import type { MatchMode, MatchResult } from "@/src/types";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

const ANALYSIS_WIDTH = 256;
const ANALYSIS_HEIGHT = 192;
const IMAGE_LOAD_TIMEOUT_MS = 1_500;
const SCENE_TIMEOUT_MS = 2_000;
const POSE_BUDGET_MS = 1_350;

let posePromise: Promise<PoseLandmarker> | null = null;

function settleWithin<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: T) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(fallback), timeoutMs);
    promise.then(finish).catch(() => finish(fallback));
  });
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => reject(new Error("Photo load timeout")), IMAGE_LOAD_TIMEOUT_MS);
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = (error) => {
      window.clearTimeout(timer);
      reject(error);
    };
    image.src = src;
  });
}

function imageToCanvas(image: CanvasImageSource) {
  const canvas = document.createElement("canvas");
  canvas.width = ANALYSIS_WIDTH;
  canvas.height = ANALYSIS_HEIGHT;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");

  const sourceWidth = image instanceof HTMLVideoElement ? image.videoWidth : (image as HTMLImageElement).naturalWidth;
  const sourceHeight = image instanceof HTMLVideoElement ? image.videoHeight : (image as HTMLImageElement).naturalHeight;
  const scale = Math.max(ANALYSIS_WIDTH / sourceWidth, ANALYSIS_HEIGHT / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  context.drawImage(
    image,
    (ANALYSIS_WIDTH - width) / 2,
    (ANALYSIS_HEIGHT - height) / 2,
    width,
    height,
  );
  return canvas;
}

async function sceneScore(reference: HTMLImageElement, capture: HTMLImageElement) {
  const referenceCanvas = imageToCanvas(reference);
  const captureCanvas = imageToCanvas(capture);
  const refContext = referenceCanvas.getContext("2d", { willReadFrequently: true })!;
  const capContext = captureCanvas.getContext("2d", { willReadFrequently: true })!;
  const referenceData = refContext.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT).data;
  const captureData = capContext.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT).data;

  return new Promise<{ sceneScore: number; subjectScore: number }>((resolve, reject) => {
    const worker = new Worker("/workers/photo-score.js");
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Photo worker timeout"));
    }, SCENE_TIMEOUT_MS);
    worker.onmessage = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (error) => {
      window.clearTimeout(timer);
      worker.terminate();
      reject(error);
    };
    worker.postMessage({
      reference: referenceData,
      capture: captureData,
      width: ANALYSIS_WIDTH,
      height: ANALYSIS_HEIGHT,
    });
  });
}

async function getPoseLandmarker() {
  if (!posePromise) {
    const loading = (async (): Promise<PoseLandmarker> => {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task" },
        runningMode: "IMAGE",
        numPoses: 1,
        minPoseDetectionConfidence: 0.45,
        minPosePresenceConfidence: 0.45,
      });
    })();
    posePromise = loading.catch((error) => {
      // A transient cache/network failure must not poison every later attempt.
      posePromise = null;
      throw error;
    });
  }
  return posePromise;
}

/** Start WASM/model initialization before the explorer opens a photo task. */
export async function warmPhotoMatcher() {
  try {
    await getPoseLandmarker();
    return true;
  } catch {
    return false;
  }
}

const POSE_POINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

function normalizedPose(
  landmarks: Array<{ x: number; y: number; visibility?: number }>,
) {
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) return null;
  const center = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };
  const shoulderWidth = Math.hypot(
    leftShoulder.x - rightShoulder.x,
    leftShoulder.y - rightShoulder.y,
  );
  const hipWidth = Math.hypot(leftHip.x - rightHip.x, leftHip.y - rightHip.y);
  const scale = Math.max(0.06, shoulderWidth, hipWidth);
  return POSE_POINTS.map((index) => ({
    x: (landmarks[index].x - center.x) / scale,
    y: (landmarks[index].y - center.y) / scale,
    visibility: landmarks[index].visibility ?? 1,
  }));
}

async function poseScore(reference: HTMLImageElement, capture: HTMLImageElement) {
  try {
    const landmarker = await getPoseLandmarker();
    const [referenceResult, captureResult] = await Promise.all([
      Promise.resolve(landmarker.detect(imageToCanvas(reference))),
      Promise.resolve(landmarker.detect(imageToCanvas(capture))),
    ]);
    const refPose = referenceResult.landmarks?.[0]
      ? normalizedPose(referenceResult.landmarks[0])
      : null;
    const capPose = captureResult.landmarks?.[0]
      ? normalizedPose(captureResult.landmarks[0])
      : null;
    if (!refPose || !capPose) return null;
    let distance = 0;
    let weight = 0;
    refPose.forEach((point, index) => {
      const other = capPose[index];
      const visibility = Math.min(point.visibility, other.visibility);
      if (visibility < 0.35) return;
      distance += Math.hypot(point.x - other.x, point.y - other.y) * visibility;
      weight += visibility;
    });
    if (!weight) return null;
    return Math.round(Math.max(0, Math.min(1, 1 - distance / weight / 2.4)) * 100);
  } catch {
    return null;
  }
}

export async function scorePhoto(
  referenceSrc: string,
  captureSrc: string,
  mode: MatchMode,
  passScore = 72,
): Promise<MatchResult> {
  const [reference, capture] = await Promise.all([
    loadImage(referenceSrc),
    loadImage(captureSrc),
  ]);
  const [scene, pose] = await Promise.all([
    sceneScore(reference, capture),
    mode === "pose-scene"
      ? settleWithin(poseScore(reference, capture), POSE_BUDGET_MS, null)
      : Promise.resolve(null),
  ]);

  const sceneWeight = mode === "scene-only" || pose === null ? 0.8 : 0.55;
  const poseWeight = pose === null ? 0 : 0.35;
  const subjectWeight = pose === null ? 0.2 : 0.1;
  const score = Math.round(
    scene.sceneScore * sceneWeight +
      (pose ?? 0) * poseWeight +
      scene.subjectScore * subjectWeight,
  );
  const closeScore = Math.max(35, passScore - 13);
  const message =
    score >= passScore
      ? "画面与记忆重合，坐标已经回应。"
      : score >= closeScore
        ? "非常接近，再调整一点构图或姿势。"
        : "让背景线条与半透明参考图靠得更近。";

  return {
    score,
    sceneScore: scene.sceneScore,
    poseScore: pose,
    subjectScore: scene.subjectScore,
    message,
  };
}

export async function resizeCapture(source: HTMLCanvasElement) {
  const max = 2048;
  const scale = Math.min(1, max / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function resizePhotoFile(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Photo read failed"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const image = await loadImage(source);
  const max = 2048;
  const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

import { useCallback, useEffect, useRef, useState } from "react";
import { experienceConfig } from "@/src/config/experience";

const INTRO_FILM_SRC = experienceConfig.optionalMedia.introFilm.src;
const INTRO_POSTER_SRC = experienceConfig.optionalMedia.introFilm.poster;
const INTRO_LAST_FRAME_SRC = experienceConfig.optionalMedia.introFilm.lastFrame;
const BRIDGE_LEAD_SECONDS = 0.42;
const BRIDGE_DURATION_MS = 880;

type IntroFilmProps = {
  onTransitionStart: () => void;
  onComplete: () => void;
};

type FilmStage = "cover" | "playing" | "bridging" | "error";

export function IntroFilm({ onTransitionStart, onComplete }: IntroFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<FilmStage>("cover");
  const bridgeTimer = useRef<number | null>(null);
  const skipTimer = useRef<number | null>(null);
  const frameRequest = useRef<number | null>(null);
  const [stage, setStage] = useState<FilmStage>("cover");
  const [ready, setReady] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [paused, setPaused] = useState(false);

  const changeStage = useCallback((next: FilmStage) => {
    stageRef.current = next;
    setStage(next);
  }, []);

  const beginBridge = useCallback(() => {
    if (stageRef.current === "bridging") return;
    changeStage("bridging");
    setPaused(false);
    onTransitionStart();
    if (skipTimer.current) window.clearTimeout(skipTimer.current);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bridgeTimer.current = window.setTimeout(onComplete, reducedMotion ? 90 : BRIDGE_DURATION_MS);
  }, [changeStage, onComplete, onTransitionStart]);

  useEffect(() => {
    if (stage !== "playing") return;
    const inspectFrame = () => {
      const video = videoRef.current;
      if (
        video &&
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        video.duration - video.currentTime <= BRIDGE_LEAD_SECONDS
      ) {
        beginBridge();
        return;
      }
      frameRequest.current = window.requestAnimationFrame(inspectFrame);
    };
    frameRequest.current = window.requestAnimationFrame(inspectFrame);
    return () => {
      if (frameRequest.current) window.cancelAnimationFrame(frameRequest.current);
    };
  }, [beginBridge, stage]);

  useEffect(
    () => () => {
      if (bridgeTimer.current) window.clearTimeout(bridgeTimer.current);
      if (skipTimer.current) window.clearTimeout(skipTimer.current);
      if (frameRequest.current) window.cancelAnimationFrame(frameRequest.current);
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    },
    [],
  );

  async function playFilm() {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.volume = 1;
      changeStage("playing");
      setPaused(false);
      setCanSkip(false);
      await video.play();
      skipTimer.current = window.setTimeout(() => setCanSkip(true), 2_000);
    } catch {
      changeStage("error");
    }
  }

  function skipFilm() {
    videoRef.current?.pause();
    beginBridge();
  }

  function handlePause() {
    if (stageRef.current === "playing" && !videoRef.current?.ended) setPaused(true);
  }

  function handlePlay() {
    if (stageRef.current === "playing") setPaused(false);
  }

  return (
    <section className={`intro-film-overlay is-${stage}`} data-film-stage={stage} aria-label="探索地图开场短片">
      <div className="intro-film-media" aria-hidden={stage === "cover"}>
        <img className="intro-film-poster" src={INTRO_POSTER_SRC} alt="" />
        <img className="intro-film-last-frame" src={INTRO_LAST_FRAME_SRC} alt="" />
        <video
          ref={videoRef}
          className="intro-film-video"
          src={INTRO_FILM_SRC}
          poster={INTRO_POSTER_SRC}
          preload="auto"
          playsInline
          disablePictureInPicture
          onCanPlay={() => setReady(true)}
          onLoadedData={() => setReady(true)}
          onEnded={beginBridge}
          onPause={handlePause}
          onPlay={handlePlay}
          onError={() => changeStage("error")}
        />
      </div>

      {stage === "cover" && (
        <div className="intro-film-cover">
          <div className="intro-film-cover-copy">
            <span>{experienceConfig.optionalMedia.introFilm.deliveryLabel}</span>
            <h1>一封只交给{experienceConfig.recipientName}的信</h1>
            <p>{ready ? "信使已经抵达，请亲自接收。" : "信使正在穿过云层……"}</p>
          </div>
          <button className="intro-film-start" type="button" onClick={playFilm}>
            <i aria-hidden="true" />
            <b>{ready ? "开始接收邀请" : "接收邀请"}</b>
          </button>
          <small>点击后将有声音 · 建议保持横屏</small>
        </div>
      )}

      {stage === "playing" && canSkip && !paused && (
        <button className="intro-film-skip" type="button" onClick={skipFilm}>跳过片头</button>
      )}

      {stage === "playing" && paused && (
        <button className="intro-film-resume" type="button" onClick={playFilm}>继续播放</button>
      )}

      {stage === "error" && (
        <div className="intro-film-error">
          <p>信使在途中遇到了一阵风。</p>
          <div><button type="button" onClick={playFilm}>重新播放</button><button type="button" onClick={skipFilm}>直接打开信封</button></div>
        </div>
      )}

      <div className="intro-film-paper-flash" aria-hidden="true" />
      <div className="intro-film-seal-bridge" aria-hidden="true"><i /></div>
    </section>
  );
}

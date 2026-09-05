"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { MagicMicroEffect } from "./MagicMicroEffect";
import type { Checkpoint, MatchResult } from "@/src/types";
import { resizePhotoFile, scorePhoto, warmPhotoMatcher } from "@/src/lib/photoMatch";
import { getReference, saveReference } from "@/src/lib/storage";

type Props = {
  checkpoint: Checkpoint;
  attempt: number;
  surveyMode: boolean;
  storageNamespace?: string;
  onClose(): void;
  onPass(dataUrl: string, result: MatchResult): void;
  onAttempt(result: MatchResult): void;
};

export function CameraChallenge({
  checkpoint,
  attempt,
  surveyMode,
  storageNamespace = "formal",
  onClose,
  onPass,
  onAttempt,
}: Props) {
  const [reference, setReference] = useState(checkpoint.referenceImage);
  const [hasCustomReference, setHasCustomReference] = useState(false);
  const [capture, setCapture] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const active = useRef(true);

  useEffect(() => () => {
    active.current = false;
  }, []);

  useEffect(() => {
    void warmPhotoMatcher();
    let active = true;
    getReference(checkpoint.id, storageNamespace).then((saved) => {
      if (!active || !saved) return;
      setReference(saved);
      setHasCustomReference(true);
    });
    return () => {
      active = false;
    };
  }, [checkpoint.id, storageNamespace]);

  async function chooseCapture(file?: File) {
    if (!file) return;
    setLoadingPhoto(true);
    setPhotoError("");
    try {
      const resized = await resizePhotoFile(file);
      if (!active.current) return;
      setCapture(resized);
      setResult(null);
    } catch {
      if (active.current) setPhotoError("这张照片无法读取，请换一张 JPG、PNG 或系统照片。");
    } finally {
      if (active.current) setLoadingPhoto(false);
    }
  }

  async function chooseReference(file?: File) {
    if (!file) return;
    setLoadingPhoto(true);
    setPhotoError("");
    try {
      const dataUrl = await resizePhotoFile(file);
      await saveReference(checkpoint.id, dataUrl, storageNamespace);
      if (!active.current) return;
      setReference(dataUrl);
      setHasCustomReference(true);
      setResult(null);
    } catch {
      if (active.current) setPhotoError("参考照片无法读取，请更换文件后再试。");
    } finally {
      if (active.current) setLoadingPhoto(false);
    }
  }

  async function evaluate() {
    if (!capture) return;
    setScoring(true);
    setPhotoError("");
    const startedAt = performance.now();
    try {
      const match = await scorePhoto(
        reference,
        capture,
        checkpoint.matchMode,
        checkpoint.passScore,
      );
      const remainingCeremonyMs = Math.max(0, 1_250 - (performance.now() - startedAt));
      if (remainingCeremonyMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingCeremonyMs));
      }
      if (!active.current) return;
      setResult(match);
      onAttempt(match);
      if (match.score >= checkpoint.passScore) onPass(capture, match);
    } catch {
      if (!active.current) return;
      const fallback: MatchResult = {
        score: 58,
        sceneScore: 58,
        poseScore: null,
        subjectScore: 58,
        message: "魔法镜暂时无法完成计算，可以更换照片或请制图人校准。",
      };
      setResult(fallback);
      onAttempt(fallback);
    } finally {
      if (active.current) setScoring(false);
    }
  }

  function closeChallenge() {
    active.current = false;
    onClose();
  }

  const temporaryReference = !hasCustomReference && checkpoint.referenceImage.endsWith(".svg");

  return (
    <motion.div className="camera-modal upload-challenge" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="camera-header">
        <button className="text-button" onClick={closeChallenge}>返回地图</button>
        <div>
          <span>PHOTO RE-CREATION</span>
          <strong>参考左侧照片，上传你复刻完成的照片</strong>
        </div>
        <div className="attempt-mark">第 {attempt + 1} 次</div>
      </div>

      <div className={`photo-comparison ${scoring ? "is-scanning-memory" : ""}`}>
        <div className="memory-scan-beam" aria-hidden="true" />
        <section className="photo-panel reference-photo-panel">
          <MagicMicroEffect variant="wave" />
          <header><span>01</span><div><b>参考照片</b><small>由制图人提前拍摄</small></div></header>
          <div className="photo-stage">
            <img src={reference} alt="制图人预先拍摄的模特参考照片" />
            {temporaryReference && <div className="reference-pending">当前为示意图<br/>请在制图人模式上传真实参考照</div>}
          </div>
          {surveyMode && (
            <label className="secondary-button photo-file-button">
              替换本关参考照片
              <input data-role="reference-photo" type="file" accept="image/*" onChange={(event) => chooseReference(event.target.files?.[0])} />
            </label>
          )}
        </section>

        <div className="comparison-seal" aria-hidden="true">≈</div>

        <section className="photo-panel capture-photo-panel">
          <MagicMicroEffect variant="wave" />
          <header><span>02</span><div><b>你的复刻</b><small>从照片 App 中选择</small></div></header>
          <div className={`photo-stage ${capture ? "has-photo" : "empty-photo-stage"}`}>
            {capture ? (
              <img src={capture} alt="已选择的复刻照片" />
            ) : (
              <label className="upload-dropzone">
                <i>＋</i>
                <b>{loadingPhoto ? "正在读取照片…" : "选择复刻照片"}</b>
                <span>照片只保存在这台 iPad，不会上传</span>
                <input data-role="capture-photo" type="file" accept="image/*" onChange={(event) => chooseCapture(event.target.files?.[0])} />
              </label>
            )}
          </div>
          {capture && (
            <label className="secondary-button photo-file-button">
              更换复刻照片
              <input data-role="capture-photo" type="file" accept="image/*" onChange={(event) => chooseCapture(event.target.files?.[0])} />
            </label>
          )}
        </section>

        {result && (
          <motion.div className={`score-card ${result.score >= checkpoint.passScore ? "passed" : ""}`} initial={{ scale: 0.86 }} animate={{ scale: 1 }}>
            <MagicMicroEffect variant="rune" />
            <b>{result.score}</b><span>匹配度</span><p>{result.message}</p>
            <small>场景 {result.sceneScore} · 姿势 {result.poseScore ?? "未识别"} · 位置 {result.subjectScore}</small>
          </motion.div>
        )}
      </div>

      <div className="camera-controls upload-controls">
        <span>{checkpoint.photoPrompt}</span>
        <button className="primary-button" onClick={evaluate} disabled={!capture || scoring || loadingPhoto}>
          {scoring ? "正在计算匹配度…" : "开始匹配"}
        </button>
      </div>
      {photoError && <p className="photo-error" role="alert">{photoError}</p>}
      {attempt >= 3 && <p className="magic-interference">魔法受到干扰，请让制图人长按罗盘进行校准。</p>}
    </motion.div>
  );
}

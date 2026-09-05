"use client";

import type { Checkpoint, ExplorationZone, PositionSample, StoryProgress } from "@/src/types";
import { MagicMicroEffect } from "./MagicMicroEffect";

type Props = {
  zone: ExplorationZone;
  checkpoint: Checkpoint;
  progress: StoryProgress;
  position: PositionSample | null;
  distanceToCheckpointM: number;
  headingCorrection: number;
  headingSource: string;
  headingVisible: boolean;
  surveyMode: boolean;
  onSurveyMode(value: boolean): void;
  onClose(): void;
  onForceArrive(): void;
  onForcePass(): void;
  onPrevious(): void;
  onReset(keepPhotos: boolean): void;
  onMockPosition(): void;
  onToggleHeadingCorrection(): void;
  onToggleHeadingVisibility(): void;
};

export function GmPanel({
  zone,
  checkpoint,
  progress,
  position,
  distanceToCheckpointM,
  headingCorrection,
  headingSource,
  headingVisible,
  surveyMode,
  onSurveyMode,
  onClose,
  onForceArrive,
  onForcePass,
  onPrevious,
  onReset,
  onMockPosition,
  onToggleHeadingCorrection,
  onToggleHeadingVisibility,
}: Props) {
  function exportSurvey() {
    const data = {
      exportedAt: new Date().toISOString(),
      zone: zone.id,
      currentPosition: position,
      activeCheckpoint: progress.activeCheckpointId,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exploration-survey-${zone.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="gm-backdrop">
      <section className="gm-panel" aria-label="制图人控制台">
        <MagicMicroEffect variant="rune" />
        <header><div><span>THE CARTOGRAPHER</span><h2>制图人控制台</h2></div><button onClick={onClose}>关闭</button></header>
        <p>当前区域：{zone.title}<br/>当前关卡：{progress.activeCheckpointId}</p>
        <div className="gm-grid">
          <button onClick={onForceArrive}>强制抵达</button>
          <button onClick={onForcePass}>强制过关</button>
          <button onClick={onMockPosition}>模拟当前目标坐标</button>
          <button onClick={onToggleHeadingCorrection}>方向翻转 180°并返回地图</button>
          <button onClick={onToggleHeadingVisibility}>{headingVisible ? "关闭方向指示并返回地图" : "恢复方向指示并返回地图"}</button>
          <button onClick={onPrevious}>退回上一关</button>
          <button onClick={exportSurvey}>导出当前勘测点</button>
          <label className="gm-toggle"><input type="checkbox" checked={surveyMode} onChange={(event) => onSurveyMode(event.target.checked)}/><span>现场勘测模式</span></label>
        </div>
        <div className="gm-location">
          <b>定位读数</b>
          {position ? (
            <code>{position.latitude.toFixed(6)}, {position.longitude.toFixed(6)} · ±{Math.round(position.accuracy)}m</code>
          ) : <span>暂无有效位置</span>}
          <b>目标校验</b>
          <code>{checkpoint.location.latitude.toFixed(6)}, {checkpoint.location.longitude.toFixed(6)}</code>
          <span>WGS‑84 直线距离：{Number.isFinite(distanceToCheckpointM) ? `${Math.round(distanceToCheckpointM)}m` : "等待定位"}</span>
          <span>方向来源：{headingSource} · 当前总补偿：{headingCorrection}°</span>
        </div>
        <footer>
          <button className="danger-text" onClick={() => onReset(true)}>保留照片并重置进度</button>
          <button className="danger-text" onClick={() => onReset(false)}>清空全部测试数据</button>
        </footer>
      </section>
    </div>
  );
}

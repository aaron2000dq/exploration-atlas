"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";

export type CelebrationKind = "arrival" | "photo";

type CelebrationLayerProps = {
  kind: CelebrationKind;
  label: string;
};

type ParticleStyle = CSSProperties & Record<`--${string}`, string | number>;

const confettiPalette = ["#e5c57d", "#8f3f35", "#f0dda5", "#5f7665", "#be8050", "#6a4a79"];

const arrivalSparks = Array.from({ length: 22 }, (_, index) => ({
  angle: index * (360 / 22) + (index % 3) * 2.5,
  distance: 82 + (index % 5) * 14,
  delay: (index % 6) * 0.035,
  size: index % 4 === 0 ? 7 : index % 3 === 0 ? 5 : 3,
}));

const photoConfetti = Array.from({ length: 52 }, (_, index) => {
  const side = index % 2 === 0 ? 1 : -1;
  const lane = Math.floor(index / 2);
  return {
    side,
    delay: (lane % 8) * 0.028,
    apexX: side * (18 + (lane % 7) * 5.2),
    apexY: -(34 + (lane % 6) * 7),
    endX: side * (28 + (lane % 9) * 5.5),
    endY: 9 + (lane % 5) * 3,
    rotate: side * (220 + (lane % 7) * 90),
    color: confettiPalette[index % confettiPalette.length],
    shape: index % 5 === 0 ? "ribbon" : index % 3 === 0 ? "round" : "paper",
  };
});

export function CelebrationLayer({ kind, label }: CelebrationLayerProps) {
  const isArrival = kind === "arrival";

  return (
    <motion.div
      className={`celebration-layer celebration-${kind}`}
      data-celebration={kind}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      role="status"
      aria-live="polite"
    >
      {isArrival ? (
        <>
          <div className="arrival-aura" aria-hidden="true">
            <i className="generated-rune-seal arrival-rune-seal" />
            <i className="arrival-ring ring-one" />
            <i className="arrival-ring ring-two" />
            {arrivalSparks.map((spark, index) => (
              <i
                className="coordinate-spark"
                key={index}
                style={{
                  "--spark-angle": `${spark.angle}deg`,
                  "--spark-distance": `${spark.distance}px`,
                  "--spark-delay": `${spark.delay}s`,
                  "--spark-size": `${spark.size}px`,
                } as ParticleStyle}
              />
            ))}
            <svg className="arrival-sigil" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" />
              <circle cx="60" cy="60" r="37" />
              <path d="M60 18 68 52 102 60 68 68 60 102 52 68 18 60 52 52Z" />
              <circle className="arrival-sigil-core" cx="60" cy="60" r="7" />
            </svg>
          </div>
          <div className="celebration-copy arrival-copy">
            <span>COORDINATE FOUND</span>
            <strong>{label}</strong>
            <small>坐标已回应</small>
          </div>
        </>
      ) : (
        <>
          <div className="photo-celebration-flash" aria-hidden="true" />
          <div className="generated-rune-seal memory-rune-seal" aria-hidden="true" />
          <div className="confetti-field" aria-hidden="true">
            {photoConfetti.map((piece, index) => (
              <i
                className={`confetti-piece ${piece.shape} ${piece.side > 0 ? "from-left" : "from-right"}`}
                key={index}
                style={{
                  "--confetti-delay": `${piece.delay}s`,
                  "--confetti-apex-x": `${piece.apexX}vw`,
                  "--confetti-apex-y": `${piece.apexY}vh`,
                  "--confetti-end-x": `${piece.endX}vw`,
                  "--confetti-end-y": `${piece.endY}vh`,
                  "--confetti-apex-rotate": `${piece.rotate * 0.58}deg`,
                  "--confetti-rotate": `${piece.rotate}deg`,
                  "--confetti-color": piece.color,
                } as ParticleStyle}
              />
            ))}
            <div className="confetti-cannon cannon-left"><i /><b /></div>
            <div className="confetti-cannon cannon-right"><i /><b /></div>
          </div>
          <div className="celebration-copy photo-copy">
            <span>MEMORY MATCHED</span>
            <strong>画面与记忆重合</strong>
            <small>{label} · MOMENT CAPTURED</small>
          </div>
        </>
      )}
    </motion.div>
  );
}

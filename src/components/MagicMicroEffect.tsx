import { useId } from "react";

type MagicMicroEffectVariant = "vine" | "ripple" | "star-trail" | "rune" | "wave";

type Props = {
  variant: MagicMicroEffectVariant;
  className?: string;
};

export function MagicMicroEffect({ variant, className = "" }: Props) {
  const vineMaskId = `vine-growth-${useId().replace(/:/g, "")}`;

  if (variant === "ripple") {
    return (
      <div className={`magic-micro-effect magic-micro-ripple ${className}`} aria-hidden="true">
        <i className="micro-ripple-halo" />
        <i className="micro-ripple-core" />
        <i className="micro-ripple-ring ring-one" />
        <i className="micro-ripple-ring ring-two" />
        <i className="micro-ripple-ring ring-three" />
        <i className="micro-ripple-ring ring-four" />
        <i className="micro-ripple-drop drop-one" />
        <i className="micro-ripple-drop drop-two" />
        <i className="micro-ripple-drop drop-three" />
      </div>
    );
  }

  if (variant === "rune") {
    return (
      <div className={`magic-micro-effect magic-micro-rune ${className}`} aria-hidden="true">
        <i className="micro-rune-ring micro-rune-ring-outer" />
        <i className="micro-rune-ring" />
        <i className="micro-rune-star">✦</i>
        <i className="micro-rune-ray ray-one" />
        <i className="micro-rune-ray ray-two" />
        <i className="micro-rune-glyphs">· ᚱ · ᛟ ·</i>
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div className={`magic-micro-effect magic-micro-wave ${className}`} aria-hidden="true">
        <svg viewBox="0 0 240 34" preserveAspectRatio="none">
          <path className="micro-wave-line wave-ghost" d="M2 18 C25 5 43 30 67 17 S111 5 134 18 S178 31 202 16 S225 9 238 17" />
          <path className="micro-wave-line wave-one" d="M2 18 C25 5 43 30 67 17 S111 5 134 18 S178 31 202 16 S225 9 238 17" />
          <path className="micro-wave-line wave-two" d="M5 22 C28 11 45 31 69 21 S113 9 136 21 S180 30 203 20 S225 13 236 20" />
          <path className="micro-wave-line wave-three" d="M4 13 C29 1 47 24 70 13 S112 1 137 14 S180 25 205 12 S227 5 238 12" />
          <circle className="micro-wave-glint glint-one" cx="67" cy="17" r="2.2" />
          <circle className="micro-wave-glint glint-two" cx="137" cy="14" r="1.7" />
          <circle className="micro-wave-glint glint-three" cx="205" cy="12" r="1.4" />
        </svg>
      </div>
    );
  }

  if (variant === "star-trail") {
    return (
      <div className={`magic-micro-effect magic-micro-star-trail ${className}`} aria-hidden="true">
        <svg viewBox="0 0 260 38" preserveAspectRatio="none">
          <path className="micro-star-baseline" d="M3 28 C44 6 82 34 122 15 S196 2 257 19" />
          <path className="micro-star-path" d="M3 28 C44 6 82 34 122 15 S196 2 257 19" />
          <path className="micro-star-echo" d="M3 28 C44 6 82 34 122 15 S196 2 257 19" />
          <circle className="micro-star-comet" cx="0" cy="0" r="3.2">
            <animateMotion dur="6.8s" repeatCount="indefinite" path="M3 28 C44 6 82 34 122 15 S196 2 257 19" />
          </circle>
          <circle className="micro-star-node node-one" cx="38" cy="17" r="1.4" />
          <circle className="micro-star-node node-two" cx="176" cy="7" r="1.2" />
          <circle className="micro-star-node node-three" cx="247" cy="16" r="1.5" />
          <g className="micro-star-spark spark-one" transform="translate(122 15)"><path d="M0-5 1.4-1.4 5 0 1.4 1.4 0 5-1.4 1.4-5 0-1.4-1.4Z" /></g>
          <g className="micro-star-spark spark-two" transform="translate(224 13)"><path d="M0-3 1-1 3 0 1 1 0 3-1 1-3 0-1-1Z" /></g>
        </svg>
      </div>
    );
  }

  return (
    <div className={`magic-micro-effect magic-micro-vine ${className}`} aria-hidden="true">
      <svg className="micro-vine-growth-art" viewBox="0 0 1686 933" preserveAspectRatio="none">
        <defs>
          <mask id={vineMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1686" height="933">
            <rect width="1686" height="933" fill="black" />
            <path
              className="vine-reveal-path vine-reveal-up"
              pathLength="1"
              transform="translate(0 -22) scale(1 1.08)"
              d="M150 785 C92 702 82 566 120 414 C158 276 272 174 423 145 C575 116 716 101 843 100"
            />
            <path
              className="vine-reveal-path vine-reveal-right"
              pathLength="1"
              transform="translate(0 -22) scale(1 1.08)"
              d="M150 785 C348 751 575 763 835 805 C1075 790 1328 755 1510 665 C1583 548 1592 410 1531 302 C1436 198 1288 151 1142 126 C1014 104 910 98 843 100"
            />
          </mask>
          <filter id={`${vineMaskId}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <image
          className="micro-vine-completed-art"
          href="/assets/magic/vine-growth-frame-v1.png"
          width="1686"
          height="933"
          preserveAspectRatio="none"
          transform="translate(0 -22) scale(1 1.08)"
        />
        <image
          className="micro-vine-generated-art"
          href="/assets/magic/vine-growth-frame-v1.png"
          width="1686"
          height="933"
          preserveAspectRatio="none"
          mask={`url(#${vineMaskId})`}
          transform="translate(0 -22) scale(1 1.08)"
        />
        <path
          className="vine-growth-trace vine-growth-trace-up"
          pathLength="1"
          filter={`url(#${vineMaskId}-glow)`}
          transform="translate(0 -22) scale(1 1.08)"
          d="M150 785 C92 702 82 566 120 414 C158 276 272 174 423 145 C575 116 716 101 843 100"
        />
        <path
          className="vine-growth-trace vine-growth-trace-right"
          pathLength="1"
          filter={`url(#${vineMaskId}-glow)`}
          transform="translate(0 -22) scale(1 1.08)"
          d="M150 785 C348 751 575 763 835 805 C1075 790 1328 755 1510 665 C1583 548 1592 410 1531 302 C1436 198 1288 151 1142 126 C1014 104 910 98 843 100"
        />
      </svg>
      <i className="micro-vine-seed-burst"><b /><b /><b /></i>
      <i className="micro-vine-awakening-glow" />
    </div>
  );
}

import type { CSSProperties } from "react";
import type { Checkpoint } from "@/src/types";

const starNodes = [
  { x: 12, y: 20, delay: "-.6s" },
  { x: 24, y: 38, delay: "-1.8s" },
  { x: 43, y: 17, delay: "-2.7s" },
  { x: 61, y: 32, delay: "-1.1s" },
  { x: 76, y: 14, delay: "-3.4s" },
  { x: 88, y: 42, delay: "-2.2s" },
];

function ChapterRelic({ giftType }: { giftType: Checkpoint["giftType"] }) {
  return (
    <div className="chapter-relic" data-gift={giftType}>
      <svg viewBox="0 0 120 120">
        {giftType === "scent" && (
          <g className="relic-potion">
            <path d="M47 16h26M51 17v23L27 82q-8 20 13 22h40q21-2 13-22L69 40V17" />
            <path className="relic-fill" d="M35 77q25-12 50 0l9 18H27Z" />
            <circle cx="54" cy="84" r="3"/><circle cx="70" cy="92" r="2"/>
            <path className="relic-vapor vapor-one" d="M53 13q-14-11 2-20" />
            <path className="relic-vapor vapor-two" d="M68 11q14-13-1-24" />
          </g>
        )}
        {giftType === "motion" && (
          <g className="relic-wheel">
            <circle cx="60" cy="62" r="25"/><circle cx="60" cy="62" r="5"/>
            <path d="M60 37v50M35 62h50M42 44l36 36M78 44 42 80" />
            <path className="relic-wing wing-left" d="M33 50Q12 29 5 51q11 14 31 16" />
            <path className="relic-wing wing-right" d="M87 50q21-21 28 1-11 14-31 16" />
          </g>
        )}
        {giftType === "sound" && (
          <g className="relic-record">
            <circle cx="57" cy="61" r="38"/><circle cx="57" cy="61" r="22"/><circle cx="57" cy="61" r="5"/>
            <path className="record-arm" d="M89 25v50L70 89"/><circle cx="89" cy="22" r="5"/>
            <path className="floating-note note-one" d="M31 27v-17l12-3v17M31 27q-8-3-8 4 8 5 8-4M43 24q-8-3-8 4 8 5 8-4" />
          </g>
        )}
        {giftType === "sparkle" && (
          <g className="relic-gem">
            <path className="gem-core" d="M25 47 43 25h34l18 22-35 51Z" />
            <path d="m25 47 35 11 35-11M43 25l17 33 17-33M60 58v40" />
            <path className="gem-ray" d="M60 7v12M19 22l9 9M101 22l-9 9M12 62h13M108 62H95" />
          </g>
        )}
        {giftType === "taste" && (
          <g className="relic-cloche">
            <path d="M18 82h84M27 77q2-39 33-42 31 3 33 42ZM13 89h94" />
            <circle cx="60" cy="28" r="7" />
            <path className="relic-vapor vapor-one" d="M45 27q-11-14 1-26" />
            <path className="relic-vapor vapor-two" d="M70 24q13-14 1-27" />
          </g>
        )}
        {giftType === "love" && (
          <g className="relic-letter">
            <path d="M16 34h88v58H16Z"/><path d="m16 38 44 34 44-34M16 92l34-31M104 92 70 61" />
            <path className="letter-heart" d="M60 43c-12-14-25 4 0 20 25-16 12-34 0-20Z" />
          </g>
        )}
      </svg>
      <span>{giftType === "love" ? "THE LAST SECRET" : "ENCHANTED OBJECT"}</span>
    </div>
  );
}

function MysteryRelic() {
  return (
    <div className="chapter-relic mystery-relic" data-gift="mystery">
      <svg viewBox="0 0 120 120">
        <g>
          <circle cx="60" cy="58" r="38" />
          <circle cx="60" cy="58" r="29" />
          <path d="M43 49q2-17 18-17 16 0 17 14 0 10-11 16-8 4-8 13" />
          <circle className="mystery-relic-dot" cx="59" cy="89" r="2.6" />
          <path d="M60 8v9M60 99v9M10 58h9M101 58h9M24 22l7 7M89 87l7 7M96 22l-7 7M31 87l-7 7" />
        </g>
      </svg>
      <span>COORDINATE SEALED</span>
    </div>
  );
}

const themeParticles = [
  { lane: 12, delay: -1.2, duration: 15.8, scale: .54, drift: -7, spin: 210 },
  { lane: 24, delay: -8.7, duration: 18.4, scale: .82, drift: 9, spin: -275 },
  { lane: 37, delay: -4.1, duration: 16.6, scale: .62, drift: -12, spin: 340 },
  { lane: 49, delay: -12.5, duration: 20.2, scale: 1.08, drift: 6, spin: -230 },
  { lane: 61, delay: -6.4, duration: 17.5, scale: .72, drift: -9, spin: 295 },
  { lane: 74, delay: -15.8, duration: 21.4, scale: .48, drift: 11, spin: -360 },
  { lane: 84, delay: -3.3, duration: 19.1, scale: .91, drift: -6, spin: 245 },
  { lane: 18, delay: -14.2, duration: 22.8, scale: .41, drift: 14, spin: -310 },
  { lane: 43, delay: -10.6, duration: 23.2, scale: .58, drift: -15, spin: 390 },
  { lane: 69, delay: -1.9, duration: 18.9, scale: .67, drift: 8, spin: -260 },
  { lane: 91, delay: -11.3, duration: 24.1, scale: .38, drift: -11, spin: 325 },
  { lane: 56, delay: -17.1, duration: 21.7, scale: .76, drift: 13, spin: -345 },
];

function ThemeTrace({ giftType }: { giftType: Checkpoint["giftType"] }) {
  return (
    <svg className="theme-trace" viewBox="0 0 1000 600" preserveAspectRatio="none">
      {giftType === "scent" && (
        <g className="trace-scent">
          <path d="M-80 390C135 245 276 446 471 295S781 144 1090 246" />
          <path d="M-90 432C172 319 318 472 506 340S817 216 1086 297" />
          <path className="trace-accent" d="M18 366C175 288 284 372 404 309" />
        </g>
      )}
      {giftType === "motion" && (
        <g className="trace-motion">
          <path d="M-90 496C186 480 296 355 470 332S733 282 1090 92" />
          <path d="M-90 532C192 509 314 404 486 371S760 310 1092 149" />
          <path className="trace-accent" d="M692 331a74 74 0 1 0 148 0 74 74 0 1 0-148 0m74-54v108m-54-54h108" />
        </g>
      )}
      {giftType === "sound" && (
        <g className="trace-sound">
          <path d="M-70 245C137 158 302 348 499 252S799 152 1080 234" />
          <path d="M-70 275C137 188 302 378 499 282S799 182 1080 264" />
          <path d="M-70 305C137 218 302 408 499 312S799 212 1080 294" />
          <path className="trace-accent" d="M728 188v106m0-103 83-20v101M728 294c-27-9-47 3-42 19 7 19 43 16 42-19m83-22c-27-9-47 3-42 19 7 19 43 16 42-19" />
        </g>
      )}
      {giftType === "sparkle" && (
        <g className="trace-sparkle">
          <path d="M53 451 238 338 406 384 592 222 755 283 951 125" />
          <path className="trace-accent" d="m238 320 7 18 18 7-18 7-7 18-7-18-18-7 18-7Zm354-119 8 21 21 8-21 8-8 21-8-21-21-8 21-8Zm359-94 6 18 18 6-18 6-6 18-6-18-18-6 18-6Z" />
        </g>
      )}
      {giftType === "taste" && (
        <g className="trace-taste">
          <path d="M90 633C124 466 267 520 303 386s143-92 177-214M520 638c14-155 146-143 161-265s126-113 158-248" />
          <path className="trace-accent" d="M738 438q0-79 66-82 66 3 66 82m-150 0h168m-185 18h204" />
        </g>
      )}
      {giftType === "love" && (
        <g className="trace-love">
          <path d="M-52 389C156 302 288 413 439 322s279-53 359-133c62-62 102-15 69 32-40 57-126 2-43-67 66-54 180-37 260-91" />
          <path className="trace-accent" d="M706 367c-44-54-105 10 0 86 105-76 44-140 0-86Z" />
        </g>
      )}
    </svg>
  );
}

function ThemeAmbient({ giftType }: { giftType: Checkpoint["giftType"] }) {
  return (
    <div className={`theme-ambient theme-ambient-${giftType}`} data-theme={giftType}>
      <ThemeTrace giftType={giftType} />
      <div className="theme-particles">
        {themeParticles.map((particle, index) => (
          <i
            key={index}
            data-variant={index % 3}
            style={{
              "--particle-lane": `${particle.lane}%`,
              "--particle-delay": `${particle.delay}s`,
              "--particle-duration": `${particle.duration}s`,
              "--particle-scale": particle.scale,
              "--particle-scale-small": particle.scale * .7,
              "--particle-scale-large": particle.scale * 1.18,
              "--particle-drift": `${particle.drift}vh`,
              "--particle-drift-opposite": `${particle.drift * -1}vh`,
              "--particle-drift-half": `${particle.drift * .5}vh`,
              "--particle-spin": `${particle.spin}deg`,
              "--particle-spin-mid": `${particle.spin * .62}deg`,
              "--particle-spin-soft": `${particle.spin * .3}deg`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="theme-light-blooms"><i/><i/><i/></div>
    </div>
  );
}

export function MapMagicOverlay({
  giftType,
  revealed,
}: {
  giftType: Checkpoint["giftType"];
  revealed: boolean;
}) {
  return (
    <div className="map-magic-overlay" data-gift={revealed ? giftType : "mystery"} aria-hidden="true">
      <div className="map-arcane-fog map-arcane-fog-a" />
      <div className="map-arcane-fog map-arcane-fog-b" />
      <div className="map-candle-bloom" />
      <svg className="ink-constellation" viewBox="0 0 100 50" preserveAspectRatio="none">
        <path d="M12 20 24 38 43 17 61 32 76 14 88 42" />
        {starNodes.map((node, index) => (
          <g key={index} transform={`translate(${node.x} ${node.y})`}>
            <circle r="1.15" style={{ "--star-delay": node.delay } as CSSProperties} />
            <path d="M-2 0H2M0-2V2" />
          </g>
        ))}
      </svg>

      <ThemeAmbient giftType={giftType} />
      {revealed ? <ChapterRelic giftType={giftType} /> : <MysteryRelic />}
    </div>
  );
}

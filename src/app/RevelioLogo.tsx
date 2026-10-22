"use client";

import React, { useState } from "react";
import { RotateCw } from "lucide-react";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  showReplayButton?: boolean;
}

export default function RevelioLogo({
  className = "w-14 h-14",
  showWordmark = false,
  showReplayButton = false,
}: LogoProps) {
  const [animKey, setAnimKey] = useState(0);

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        key={animKey}
        viewBox={showWordmark ? "0 0 1254 1060" : "30 20 1190 760"}
        className={`rev-html-logo play overflow-visible select-none ${className}`}
        role="img"
        aria-label="Revelio Digital Solutions Animated Logo"
      >
        <defs>
          <linearGradient id="gOuter" gradientUnits="userSpaceOnUse" x1="0" y1="36" x2="0" y2="1186">
            <stop offset="0" stopColor="#16dcff" />
            <stop offset="0.5" stopColor="#02b0ff" />
            <stop offset="1" stopColor="#08d6ff" />
          </linearGradient>
          <linearGradient id="gInner" gradientUnits="userSpaceOnUse" x1="0" y1="190" x2="0" y2="760">
            <stop offset="0" stopColor="#10dcff" />
            <stop offset="0.36" stopColor="#00eeff" />
            <stop offset="0.5" stopColor="#02c4ff" />
            <stop offset="0.64" stopColor="#0192fd" />
            <stop offset="1" stopColor="#04a2ff" />
          </linearGradient>
          <radialGradient id="gDisc" gradientUnits="userSpaceOnUse" cx="620" cy="520" r="620">
            <stop offset="0" stopColor="#03163f" />
            <stop offset="1" stopColor="#00081c" />
          </radialGradient>
          <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <clipPath id="clipWord">
            <rect
              className="wipe"
              style={{ "--delay": "1.6s" } as React.CSSProperties}
              x="186"
              y="775"
              width="880"
              height="125"
            />
          </clipPath>
        </defs>

        <circle
          className="disc"
          cx="620.5"
          cy={showWordmark ? "611" : "475"}
          r={showWordmark ? "563" : "430"}
          fill="url(#gDisc)"
        />

        <path
          className="halo"
          d={
            showWordmark
              ? "M620.5 47.5 A563.5 563.5 0 1 1 620.5 1174.5 A563.5 563.5 0 1 1 620.5 47.5"
              : "M620.5 55 A420 420 0 1 1 620.5 895 A420 420 0 1 1 620.5 55"
          }
        />
        <g filter="url(#glow)">
          <path
            className="stroke ring-outer draw"
            pathLength="1"
            style={{ "--dur": "1.2s", "--delay": ".05s" } as React.CSSProperties}
            d={
              showWordmark
                ? "M620.5 47.5 A563.5 563.5 0 1 1 620.5 1174.5 A563.5 563.5 0 1 1 620.5 47.5"
                : "M620.5 55 A420 420 0 1 1 620.5 895 A420 420 0 1 1 620.5 55"
            }
          />
        </g>

        <g filter="url(#glow)">
          <path
            className="stroke ring-inner draw"
            pathLength="1"
            style={{ "--dur": "1.1s", "--delay": ".4s" } as React.CSSProperties}
            d="M624 205.5 A283.5 270 0 1 1 624 745.5 A283.5 270 0 1 1 624 205.5"
          />

          <g className="blink">
            <path
              className="stroke lid draw"
              pathLength="1"
              style={{ "--dur": "0.9s", "--delay": ".7s" } as React.CSSProperties}
              d="M602 376 C540.5 382 475.3 391.7 393 489.5 C475.3 587.3 540.5 597 602 603"
            />
            <path
              className="stroke band draw"
              pathLength="1"
              style={{ "--dur": "0.8s", "--delay": "1.0s" } as React.CSSProperties}
              d="M714.7 445 A111 114 0 1 0 714.7 534"
            />
            <g className="glance">
              <circle
                className="stroke iris draw"
                pathLength="1"
                style={{ "--dur": ".7s", "--delay": "1.2s" } as React.CSSProperties}
                cx="612.5"
                cy="489.5"
                r="62.5"
              />
              <circle
                className="fillcyan pop"
                style={{ "--delay": "1.4s" } as React.CSSProperties}
                cx="637"
                cy="465.5"
                r="19"
              />
            </g>
          </g>

          <path
            className="trace draw"
            pathLength="1"
            style={{ "--dur": ".6s", "--delay": "1.3s" } as React.CSSProperties}
            d="M705 454.5 H790 L806.8 434"
          />
          <path
            className="trace draw"
            pathLength="1"
            style={{ "--dur": ".6s", "--delay": "1.4s" } as React.CSSProperties}
            d="M668 493.5 H823.5"
          />
          <path
            className="trace draw"
            pathLength="1"
            style={{ "--dur": ".6s", "--delay": "1.3s" } as React.CSSProperties}
            d="M705 530.5 H790 L806.7 550.7"
          />

          <g>
            <path
              className="stroke hook draw"
              pathLength="1"
              style={{ "--dur": ".5s", "--delay": "1.5s" } as React.CSSProperties}
              d="M765.5 381 V417 H748"
            />
            <path
              className="fillcyan late"
              style={{ "--delay": "1.7s" } as React.CSSProperties}
              d="M713 389 L717 392 L721 395 L725 398 L728 401 L731 404 L734 407 L738 409.5 L748 409.5 V425 L733 425 L732 422 L731 419 L730 416 L728 413 L727 410 L725 407 L723 404 L721 401 L719 398 L717 395 L715 392 Z"
            />
          </g>
          <g transform="translate(0 980) scale(1 -1)">
            <path
              className="stroke hook draw"
              pathLength="1"
              style={{ "--dur": ".5s", "--delay": "1.5s" } as React.CSSProperties}
              d="M766 381 V417 H748"
            />
            <path
              className="fillcyan late"
              style={{ "--delay": "1.7s" } as React.CSSProperties}
              d="M713 389 L717 392 L721 395 L725 398 L728 401 L731 404 L734 407 L738 409.5 L748 409.5 V425 L733 425 L732 422 L731 419 L730 416 L728 413 L727 410 L725 407 L723 404 L721 401 L719 398 L717 395 L715 392 Z"
            />
          </g>

          <circle className="node pop" style={{ "--delay": "1.6s" } as React.CSSProperties} cx="765" cy="367" r="16.2" />
          <circle className="node pop" style={{ "--delay": "1.7s" } as React.CSSProperties} cx="819.5" cy="418.5" r="16.2" />
          <circle className="node pop" style={{ "--delay": "1.8s" } as React.CSSProperties} cx="843.5" cy="493.5" r="16.2" />
          <circle className="node pop" style={{ "--delay": "1.7s" } as React.CSSProperties} cx="819.5" cy="566" r="16.2" />
          <circle className="node pop" style={{ "--delay": "1.6s" } as React.CSSProperties} cx="766" cy="613" r="16.2" />
        </g>

        <g>
          <path className="spark" pathLength="1" style={{ "--delay": "2.1s" } as React.CSSProperties} d="M765.5 417 V381" />
          <path className="spark" pathLength="1" style={{ "--delay": "2.4s" } as React.CSSProperties} d="M705 454.5 H790 L806.8 434" />
          <path className="spark" pathLength="1" style={{ "--delay": "2.2s" } as React.CSSProperties} d="M668 493.5 H823.5" />
          <path className="spark" pathLength="1" style={{ "--delay": "2.6s" } as React.CSSProperties} d="M705 530.5 H790 L806.7 550.7" />
          <path className="spark" pathLength="1" style={{ "--delay": "2.3s" } as React.CSSProperties} d="M766 563.5 V599" />
        </g>

        {showWordmark && (
          <>
            <g clipPath="url(#clipWord)">
              <g className="ltr">
                <path strokeWidth="24" d="M210 787 V889" />
                <path d="M210 798 H292 A19 19 0 0 1 311 817 V827.5 A19 19 0 0 1 292 846.5 H210" />
                <polygon className="ltr-fill" points="274.4,855 301,855 328.5,889 300.3,889" />
                <path d="M458 798 H356.5 V878 H458" />
                <path strokeWidth="19" d="M356.5 838 H455" />
                <polygon className="ltr-fill" points="471,787 497.5,787 546,864 595,787 622.8,787 561,889 531,889" />
                <path d="M747 798 H642.5 V878 H747" />
                <path strokeWidth="19" d="M642.5 838 H742" />
                <path d="M778.5 787 V878.5 H870" />
                <path strokeWidth="24" d="M896.5 787 V889" />
                <rect x="940.5" y="798" width="102" height="80" rx="19" />
              </g>
            </g>
            <text
              className="sub rise"
              style={{ "--delay": "1.9s" } as React.CSSProperties}
              x="267"
              y="961"
              fontSize="55"
              textLength="723"
              lengthAdjust="spacing"
            >
              DIGITAL SOLUTIONS
            </text>
          </>
        )}
      </svg>

      {showReplayButton && (
        <button
          type="button"
          onClick={() => setAnimKey((prev) => prev + 1)}
          className="mt-3 px-4 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black text-[11px] font-mono tracking-widest uppercase flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-500/10"
        >
          <RotateCw className="w-3 h-3" />
          Replay Logo
        </button>
      )}
    </div>
  );
}
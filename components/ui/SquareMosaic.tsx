"use client";

import { seededRandom } from "@/lib/geo";

type SquareMosaicProps = {
  className?: string;
  /** Deterministic layout seed */
  seed?: number;
  /** Grid density (columns) */
  columns?: number;
  rows?: number;
  /** Corner the mosaic biases toward for its brightest tiles */
  anchor?: "tr" | "tl" | "br" | "bl";
};

/**
 * Adventum brand device — the translucent blue "tile mosaic" from the
 * corporate template, rebuilt for the dark theme. A grid of rounded
 * squares with brand-blue tints whose opacity falls off away from the
 * anchor corner, echoing the logo's square cluster. Purely decorative.
 */
export default function SquareMosaic({
  className = "",
  seed = 7,
  columns = 6,
  rows = 4,
  anchor = "tr",
}: SquareMosaicProps) {
  const rand = seededRandom(seed);
  const gap = 2; // percent
  const cw = (100 - gap * (columns - 1)) / columns;
  const ch = (100 - gap * (rows - 1)) / rows;

  const tiles: {
    x: number;
    y: number;
    w: number;
    h: number;
    op: number;
    tone: "blue" | "teal";
  }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      // distance (0..1) from the anchor corner
      const fx = anchor.includes("l") ? c / (columns - 1) : 1 - c / (columns - 1);
      const fy = anchor.includes("t") ? r / (rows - 1) : 1 - r / (rows - 1);
      const proximity = 1 - (fx + fy) / 2; // 1 near anchor, 0 far
      const jitter = rand();
      // only render a subset, biased toward the anchor
      if (jitter > proximity * 0.9 + 0.15) continue;
      tiles.push({
        x: c * (cw + gap),
        y: r * (ch + gap),
        w: cw,
        h: ch,
        op: 0.04 + proximity * 0.22 * (0.6 + jitter * 0.4),
        tone: jitter > 0.72 ? "teal" : "blue",
      });
    }
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        {tiles.map((t, i) => (
          <rect
            key={i}
            x={t.x}
            y={t.y}
            width={t.w}
            height={t.h}
            rx={1.4}
            fill={t.tone === "teal" ? "#1fc4dd" : "#4d9bf0"}
            opacity={t.op}
          />
        ))}
      </svg>
    </div>
  );
}

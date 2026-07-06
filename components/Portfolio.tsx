"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VIEWPORT, fadeIn, stagger } from "@/lib/anim";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import { useI18n } from "@/components/providers/I18nProvider";

/* ---------------------------------------------------------------- */
/*  Abstract molecular-bond diagrams — nodes + trimmed bond lines.  */
/*  Each product gets a subtly different geometry.                  */
/* ---------------------------------------------------------------- */

type Diagram = {
  nodes: readonly (readonly [number, number])[];
  bonds: readonly (readonly [number, number])[];
  /** Indices of emphasized "hub" atoms rendered larger */
  hubs?: readonly number[];
  /** Dashed bonds — used for the developing pipeline plate */
  dashed?: boolean;
};

/* Fused bicyclic core with a fluorinated tail */
const DIAGRAM_DOLUTEGRAVIR: Diagram = {
  nodes: [
    [18, 40], [26, 26], [42, 26], [50, 40], [42, 54], [26, 54],
    [58, 18], [70, 28], [64, 42],
    [80, 50], [96, 44], [108, 54],
  ],
  bonds: [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    [2, 6], [6, 7], [7, 8], [8, 3],
    [8, 9], [9, 10], [10, 11],
  ],
  hubs: [3, 10],
};

/* Extended chain with branch points closing into a terminal ring */
const DIAGRAM_RALTEGRAVIR: Diagram = {
  nodes: [
    [10, 44], [24, 34], [38, 44], [52, 34], [66, 44], [80, 34], [94, 44],
    [24, 18], [52, 18], [66, 60],
    [104, 30], [112, 44], [104, 56],
  ],
  bonds: [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [1, 7], [3, 8], [4, 9],
    [6, 10], [10, 11], [11, 12], [12, 6],
  ],
  hubs: [3, 6],
};

/* Twin rings bridged through a central sulfonamide-like hub */
const DIAGRAM_DARUNAVIR: Diagram = {
  nodes: [
    [38, 32], [31, 44], [17, 44], [10, 32], [17, 20], [31, 20],
    [58, 42], [52, 58], [66, 58],
    [80, 36], [87, 24], [101, 24], [108, 36], [101, 48], [87, 48],
  ],
  bonds: [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    [0, 6], [6, 7], [6, 8], [6, 9],
    [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 9],
  ],
  hubs: [6],
};

/* Loose constellation — a network still taking shape */
const DIAGRAM_PIPELINE: Diagram = {
  nodes: [
    [20, 24], [44, 16], [70, 24], [94, 18],
    [32, 44], [60, 42], [86, 44],
    [20, 62], [48, 64], [76, 62], [102, 56],
  ],
  bonds: [
    [0, 1], [1, 2], [2, 3],
    [0, 4], [1, 5], [2, 5], [3, 6],
    [4, 5], [5, 6],
    [4, 7], [5, 8], [6, 9], [6, 10], [7, 8], [8, 9],
  ],
  hubs: [5],
  dashed: true,
};

const NODE_R = 2.5;
const HUB_R = 4;
const BOND_TRIM = 5;

function MoleculeDiagram({
  diagram,
  className = "",
}: {
  diagram: Diagram;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {diagram.bonds.map((bond, i) => {
        const a = diagram.nodes[bond[0]];
        const b = diagram.nodes[bond[1]];
        if (!a || !b) return null;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        const ux = (dx / len) * BOND_TRIM;
        const uy = (dy / len) * BOND_TRIM;
        return (
          <line
            key={`bond-${i}`}
            x1={a[0] + ux}
            y1={a[1] + uy}
            x2={b[0] - ux}
            y2={b[1] - uy}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={diagram.dashed ? "2.5 4" : undefined}
            opacity="0.55"
          />
        );
      })}
      {diagram.nodes.map((node, i) => (
        <circle
          key={`node-${i}`}
          cx={node[0]}
          cy={node[1]}
          r={diagram.hubs?.includes(i) ? HUB_R : NODE_R}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Formula rendering — digits drop to subscript in mono            */
/* ---------------------------------------------------------------- */

function Formula({ formula }: { formula: string }) {
  const tokens = formula.match(/[A-Za-z]+|\d+/g) ?? [];
  return (
    <span className="font-mono text-xs tracking-[0.12em] text-silver/90">
      {tokens.map((token, i) =>
        /^\d+$/.test(token) ? (
          <span key={i} className="align-sub text-[0.7em] text-muted">
            {token}
          </span>
        ) : (
          <span key={i}>{token}</span>
        )
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/*  Product data                                                    */
/* ---------------------------------------------------------------- */

type Product = {
  index: string;
  /** Literal proper-noun product name (rendered as-is). */
  name?: string;
  /** Translation key for a descriptive (non-proper-noun) name. */
  nameKey?: string;
  tagKey: string;
  formula?: string;
  descriptionKey: string;
  accent: "bio" | "pulse";
  diagram: Diagram;
};

const PRODUCTS: Product[] = [
  {
    index: "01",
    name: "Dolutegravir",
    tagKey: "portfolio.tag_insti",
    formula: "C20H19F2N3O5",
    descriptionKey: "portfolio.dolutegravir_desc",
    accent: "bio",
    diagram: DIAGRAM_DOLUTEGRAVIR,
  },
  {
    index: "02",
    name: "Raltegravir",
    tagKey: "portfolio.tag_insti",
    formula: "C20H21FN6O5",
    descriptionKey: "portfolio.raltegravir_desc",
    accent: "pulse",
    diagram: DIAGRAM_RALTEGRAVIR,
  },
  {
    index: "03",
    name: "Darunavir",
    tagKey: "portfolio.tag_pi",
    formula: "C27H37N3O7S",
    descriptionKey: "portfolio.darunavir_desc",
    accent: "bio",
    diagram: DIAGRAM_DARUNAVIR,
  },
  {
    index: "04",
    nameKey: "portfolio.hospital_name",
    tagKey: "portfolio.tag_pipeline",
    descriptionKey: "portfolio.hospital_desc",
    accent: "pulse",
    diagram: DIAGRAM_PIPELINE,
  },
];

/* ---------------------------------------------------------------- */
/*  Section                                                         */
/* ---------------------------------------------------------------- */

export default function Portfolio() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to(glowRef.current, {
        yPercent: 22,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="relative overflow-hidden section-pad"
    >
      {/* decorative field */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div ref={glowRef} className="absolute inset-0">
          <div className="absolute -top-40 right-[-12%] h-[30rem] w-[30rem] rounded-full bg-pulse/5 blur-3xl" />
          <div className="absolute bottom-[-8rem] left-[-12%] h-[26rem] w-[26rem] rounded-full bg-bio/5 blur-3xl" />
        </div>
        <div
          className="absolute inset-x-0 top-0 h-[26rem] bg-grid-faint"
          style={{
            maskImage:
              "radial-gradient(ellipse 75% 100% at 50% 0%, black, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 100% at 50% 0%, black, transparent 72%)",
          }}
        />
      </div>

      <div className="shell relative">
        <SectionHeading
          eyebrow={t("portfolio.eyebrow")}
          title={t("portfolio.title")}
          highlight={["Portfolio"]}
          sub={t("portfolio.sub")}
        />

        {/* specimen plates */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
          className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-6"
        >
          {PRODUCTS.map((product) => (
            <GlassCard
              key={product.index}
              accent={product.accent}
              className="flex h-full flex-col p-8"
            >
              {/* accent top line — warms on hover */}
              <span
                aria-hidden
                className={`absolute inset-x-0 top-0 h-px opacity-60 transition-opacity duration-500 ease-premium group-hover:opacity-100 ${
                  product.accent === "bio"
                    ? "bg-gradient-to-r from-transparent via-bio/60 to-transparent"
                    : "bg-gradient-to-r from-transparent via-pulse/60 to-transparent"
                }`}
              />

              {/* plate header — index + reticle */}
              <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.28em] text-muted">
                <span>{product.index}</span>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-muted/70 transition-colors duration-500 ease-premium group-hover:text-silver"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* molecular-bond diagram — brightens on hover */}
              <div
                aria-hidden
                className={`mt-7 opacity-40 transition-opacity duration-500 ease-premium group-hover:opacity-75 ${
                  product.accent === "bio" ? "text-bio" : "text-pulse"
                }`}
              >
                <MoleculeDiagram diagram={product.diagram} className="h-24 w-full" />
              </div>

              <div aria-hidden className="hairline mt-7" />

              {/* classification */}
              <p className="mt-6 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted">
                {t(product.tagKey)}
              </p>

              <h3 className="mt-3 font-display text-2xl font-medium leading-tight text-frost">
                {product.nameKey ? t(product.nameKey) : product.name}
              </h3>

              {product.formula && (
                <p className="mt-2">
                  <Formula formula={product.formula} />
                </p>
              )}

              <p className="mt-4 text-sm leading-relaxed text-silver">
                {t(product.descriptionKey)}
              </p>

              {/* status line — pinned to the plate base */}
              <div className="mt-auto pt-8">
                <div aria-hidden className="hairline mb-4" />
                <p className="flex items-center gap-2.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted">
                  <span
                    aria-hidden
                    className={`h-1 w-1 shrink-0 rounded-full animate-pulse-soft ${
                      product.accent === "bio" ? "bg-bio" : "bg-pulse"
                    }`}
                  />
                  {t("portfolio.status")}
                </p>
              </div>
            </GlassCard>
          ))}
        </motion.div>

        {/* compliance note */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={fadeIn}
          className="mt-16"
        >
          <div aria-hidden className="hairline mb-8" />
          <div className="flex max-w-3xl items-start gap-3">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-muted"
            >
              <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 7.5v3.5M8 5v.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-sm leading-relaxed text-muted">
              {t("portfolio.disclaimer")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

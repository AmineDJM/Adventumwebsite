"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { useI18n } from "@/components/providers/I18nProvider";
import { EASE, VIEWPORT, stagger } from "@/lib/anim";
import {
  ALGERIA_OUTLINE,
  ALGERIA_CITIES,
  REGION_TARGETS,
  samplePointsInPolygon,
  sampleOutline,
  seededRandom,
  type LonLat,
} from "@/lib/geo";

/* ------------------------------------------------------------------ */
/*  Particle map — Algeria first, then expansion arcs across the      */
/*  region. Rendered on a 2D canvas: DPR-aware, resize-safe,          */
/*  time-based cinematic reveal once the section enters the viewport. */
/* ------------------------------------------------------------------ */

const ALGIERS: LonLat = [3.06, 36.75];

type P = { x: number; y: number };

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function quadPoint(a: P, c: P, b: P, t: number): P {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
    y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y,
  };
}

function ParticleMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* ---- source data (lon/lat) ---- */
    const outline = sampleOutline(ALGERIA_OUTLINE, 480);
    const fill = samplePointsInPolygon(ALGERIA_OUTLINE, 380, 19);
    const twinkle = seededRandom(31);
    const outlinePhase = outline.map(() => twinkle() * Math.PI * 2);
    const fillPhase = fill.map(() => twinkle() * Math.PI * 2);

    /* ---- projection fitted to canvas ---- */
    const allPts: LonLat[] = [
      ...ALGERIA_OUTLINE,
      ...REGION_TARGETS.map((t) => t.pos),
    ];
    const lons = allPts.map((p) => p[0]);
    const lats = allPts.map((p) => p[1]);
    const minLon = Math.min(...lons) - 2.5;
    const maxLon = Math.max(...lons) + 2.5;
    const minLat = Math.min(...lats) - 2.5;
    const maxLat = Math.max(...lats) + 3.5;

    let W = 0;
    let H = 0;
    let project: (p: LonLat) => P = () => ({ x: 0, y: 0 });

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sx = W / (maxLon - minLon);
      const sy = H / (maxLat - minLat);
      const s = Math.min(sx, sy);
      const ox = (W - (maxLon - minLon) * s) / 2;
      const oy = (H - (maxLat - minLat) * s) / 2;
      project = ([lon, lat]: LonLat) => ({
        x: ox + (lon - minLon) * s,
        y: H - (oy + (lat - minLat) * s),
      });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    /* ---- reveal + draw loop, both gated by visibility ----
       The loop only runs while the map is on screen: an always-on canvas
       repaint would tax every scroll elsewhere on the page. */
    let revealStart: number | null = null;
    let raf = 0;
    let running = false;
    const REVEAL_MS = 5200;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (!startedRef.current) {
              startedRef.current = true;
              revealStart = performance.now();
            }
            if (!running) {
              running = true;
              raf = requestAnimationFrame(draw);
            }
          } else if (running) {
            running = false;
            cancelAnimationFrame(raf);
          }
        });
      },
      { threshold: 0.05 }
    );
    io.observe(wrap);

    const draw = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      const t = now / 1000;

      let p = 0;
      if (reducedMotion) {
        p = startedRef.current ? 1 : 0;
      } else if (revealStart !== null) {
        p = easeInOutCubic(Math.min((now - revealStart) / REVEAL_MS, 1));
      }

      ctx.clearRect(0, 0, W, H);

      // Algeria appears in the first 35% of the reveal
      const mapAlpha = Math.min(p / 0.35, 1);

      // interior particles
      for (let i = 0; i < fill.length; i++) {
        const pt = project(fill[i]);
        const tw = reducedMotion
          ? 0.6
          : 0.45 + 0.35 * Math.sin(t * 1.1 + fillPhase[i]);
        ctx.fillStyle = `rgba(207,228,245,${(0.28 * tw * mapAlpha).toFixed(3)})`;
        ctx.fillRect(pt.x, pt.y, 1.4, 1.4);
      }
      // border particles
      for (let i = 0; i < outline.length; i++) {
        const pt = project(outline[i]);
        const tw = reducedMotion
          ? 0.8
          : 0.6 + 0.4 * Math.sin(t * 1.4 + outlinePhase[i]);
        ctx.fillStyle = `rgba(47,131,214,${(0.75 * tw * mapAlpha).toFixed(3)})`;
        ctx.fillRect(pt.x, pt.y, 1.6, 1.6);
      }

      // cities
      for (const city of ALGERIA_CITIES) {
        const pt = project(city.pos);
        const pulse = reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(t * 2 + pt.x);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 9);
        g.addColorStop(0, `rgba(104,210,223,${0.55 * pulse * mapAlpha})`);
        g.addColorStop(1, "rgba(104,210,223,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(104,210,223,${0.95 * mapAlpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // expansion arcs, ring by ring, in the remaining 65% of the reveal
      const origin = project(ALGIERS);
      const arcsP = Math.max(0, (p - 0.35) / 0.65);

      for (const target of REGION_TARGETS) {
        const ringP = Math.min(Math.max(arcsP * 3 - (target.ring - 1), 0), 1);
        if (ringP <= 0) continue;

        const dest = project(target.pos);
        const mid: P = {
          x: (origin.x + dest.x) / 2,
          y: (origin.y + dest.y) / 2 - Math.hypot(dest.x - origin.x, dest.y - origin.y) * 0.22,
        };

        // arc polyline up to ringP
        ctx.beginPath();
        const steps = 44;
        const upto = Math.floor(steps * ringP);
        for (let i = 0; i <= upto; i++) {
          const pt = quadPoint(origin, mid, dest, i / steps);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = `rgba(47,131,214,${0.28 * ringP})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // head glow while drawing
        if (ringP < 1) {
          const head = quadPoint(origin, mid, dest, ringP);
          ctx.fillStyle = "rgba(47,131,214,0.9)";
          ctx.beginPath();
          ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // arrived: destination node + label + idle traveling pulse
          const g = ctx.createRadialGradient(dest.x, dest.y, 0, dest.x, dest.y, 8);
          g.addColorStop(0, "rgba(47,131,214,0.5)");
          g.addColorStop(1, "rgba(47,131,214,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(dest.x, dest.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(234,242,251,0.9)";
          ctx.beginPath();
          ctx.arc(dest.x, dest.y, 1.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '9px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = "rgba(174,186,205,0.55)";
          ctx.textAlign = dest.x > origin.x ? "left" : "right";
          ctx.fillText(
            target.name.toUpperCase(),
            dest.x + (dest.x > origin.x ? 7 : -7),
            dest.y + 3
          );

          if (!reducedMotion) {
            const cycle = (t * 0.22 + target.ring * 0.31) % 1;
            const pulsePt = quadPoint(origin, mid, dest, cycle);
            ctx.fillStyle = "rgba(104,210,223,0.75)";
            ctx.beginPath();
            ctx.arc(pulsePt.x, pulsePt.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // origin beacon
      if (mapAlpha > 0.2) {
        const pulse = reducedMotion ? 1 : 0.7 + 0.3 * Math.sin(t * 2.4);
        const g = ctx.createRadialGradient(
          origin.x, origin.y, 0,
          origin.x, origin.y, 16
        );
        g.addColorStop(0, `rgba(104,210,223,${0.6 * pulse * mapAlpha})`);
        g.addColorStop(1, "rgba(104,210,223,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = `rgba(234,242,251,${0.85 * mapAlpha})`;
        ctx.textAlign = "left";
        ctx.fillText("ALGIERS", origin.x + 10, origin.y - 6);
      }
    };
    // No unconditional bootstrap — the IntersectionObserver starts the
    // loop when the map becomes visible.

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-[16/11] w-full max-w-5xl md:aspect-[16/9]"
    >
      {/* holographic table glow under the map */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[2rem]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 42% 42%, rgba(47,131,214,0.07), transparent 65%)," +
            "radial-gradient(ellipse 45% 40% at 42% 42%, rgba(104,210,223,0.05), transparent 60%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

const HORIZONS = [
  {
    tagKey: "vision.horizon1_tag",
    titleKey: "vision.horizon1_title",
    bodyKey: "vision.horizon1_body",
  },
  {
    tagKey: "vision.horizon2_tag",
    titleKey: "vision.horizon2_title",
    bodyKey: "vision.horizon2_body",
  },
  {
    tagKey: "vision.horizon3_tag",
    titleKey: "vision.horizon3_title",
    bodyKey: "vision.horizon3_body",
  },
];

export default function Vision() {
  const { t } = useI18n();
  return (
    <section id="vision" className="relative overflow-hidden section-pad">
      {/* deep-space backdrop accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pulse/20 to-transparent"
      />

      <div className="shell">
        <SectionHeading
          eyebrow={t("vision.eyebrow")}
          title={t("vision.title")}
          highlight={["Algeria"]}
          sub={t("vision.sub")}
          align="center"
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.2, ease: EASE }}
          className="mt-16 md:mt-24"
        >
          <ParticleMap />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
          className="mx-auto mt-16 grid max-w-4xl gap-4 md:grid-cols-3 md:gap-6"
        >
          {HORIZONS.map((h) => (
            <motion.div
              key={h.tagKey}
              variants={{
                hidden: { opacity: 0, y: 28 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.9, ease: EASE },
                },
              }}
              className="glass glass-hover rounded-2xl p-6"
            >
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.35em] text-pulse/80">
                {t(h.tagKey)}
              </p>
              <h3 className="mt-3 font-display text-xl font-medium text-frost">
                {t(h.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(h.bodyKey)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

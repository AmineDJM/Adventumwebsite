"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { EASE, VIEWPORT, fadeUp } from "@/lib/anim";
import { useI18n } from "@/components/providers/I18nProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { CYCLE_STAGES, type CycleElements } from "@/lib/hivCycle";

const BIO = new THREE.Color("#68D2DF");
const BLUE = new THREE.Color("#2f83d6");
const LIME = new THREE.Color("#82C341");
const FROST = new THREE.Color("#cfe4f5");
const _v = new THREE.Vector3();

const damp = (cur: number, target: number, lambda: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-lambda * dt));

/* helper: a helix line geometry */
function helixGeo(turns: number, height: number, radius: number, n = 80, phase = 0) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = t * Math.PI * 2 * turns + phase;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, (t - 0.5) * height, Math.sin(a) * radius));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/* ---- element primitives, each reads its 0..1 value from elRef every frame ---- */

function useVal(elRef: React.MutableRefObject<CycleElements>, key: keyof CycleElements) {
  return () => elRef.current[key];
}

function Virion({ get, position }: { get: () => number; position: [number, number, number] }) {
  const grp = useRef<THREE.Group>(null);
  const spikes = useRef<THREE.InstancedMesh>(null);
  const verts = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.6, 1);
    const p = g.getAttribute("position");
    const out: THREE.Vector3[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const k = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (!seen.has(k)) { seen.add(k); out.push(v); }
    }
    g.dispose();
    return out;
  }, []);
  useEffect(() => {
    if (!spikes.current) return;
    verts.forEach((v, i) => {
      const d = new THREE.Object3D();
      d.position.copy(v).multiplyScalar(1.15);
      d.lookAt(_v.copy(v).multiplyScalar(2));
      d.rotateX(Math.PI / 2);
      d.updateMatrix();
      spikes.current!.setMatrixAt(i, d.matrix);
    });
    spikes.current.instanceMatrix.needsUpdate = true;
  }, [verts]);
  useFrame((s, dt) => {
    if (!grp.current) return;
    const v = get();
    grp.current.visible = v > 0.02;
    grp.current.scale.setScalar(damp(grp.current.scale.x, 0.4 + v * 0.6, 6, dt) * (v > 0.02 ? 1 : 1));
    grp.current.rotation.y += dt * 0.4;
    grp.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && "opacity" in m) (m as THREE.MeshBasicMaterial).opacity = Math.min(1, v) * ((o as THREE.Mesh).userData.base ?? 1);
    });
  });
  return (
    <group ref={grp} position={position}>
      <mesh userData={{ base: 0.25 }}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshBasicMaterial color={BIO} wireframe transparent opacity={0.25} toneMapped={false} />
      </mesh>
      <instancedMesh ref={spikes} args={[undefined, undefined, verts.length]}>
        <coneGeometry args={[0.05, 0.16, 6]} />
        <meshStandardMaterial color={BIO} emissive={BIO} emissiveIntensity={0.7} transparent toneMapped={false} />
      </instancedMesh>
      <mesh rotation={[0.2, 0, 0.3]} userData={{ base: 0.4 }}>
        <coneGeometry args={[0.22, 0.5, 16, 1, true]} />
        <meshStandardMaterial color={BIO} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Strand({
  get, position, color, kind,
}: {
  get: () => number;
  position: [number, number, number];
  color: THREE.Color;
  kind: "single" | "double";
}) {
  const grp = useRef<THREE.Group>(null);
  const geoA = useMemo(() => helixGeo(2.4, 1.6, 0.28), []);
  const geoB = useMemo(() => helixGeo(2.4, 1.6, 0.28, 80, Math.PI), []);
  const wave = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 60; i++) {
      const t = i / 59;
      pts.push(new THREE.Vector3(Math.sin(t * 10) * 0.18, (t - 0.5) * 1.6, Math.cos(t * 10) * 0.18));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  useFrame((s, dt) => {
    if (!grp.current) return;
    const v = get();
    grp.current.visible = v > 0.02;
    grp.current.rotation.y += dt * 0.6;
    grp.current.traverse((o) => {
      const m = (o as THREE.Line).material as THREE.LineBasicMaterial | undefined;
      if (m && "opacity" in m) m.opacity = Math.min(1, v) * 0.85;
    });
  });
  return (
    <group ref={grp} position={position}>
      {kind === "single" ? (
        <line>
          <primitive object={wave} attach="geometry" />
          <lineBasicMaterial color={color} transparent toneMapped={false} />
        </line>
      ) : (
        <>
          <line>
            <primitive object={geoA} attach="geometry" />
            <lineBasicMaterial color={color} transparent toneMapped={false} />
          </line>
          <line>
            <primitive object={geoB} attach="geometry" />
            <lineBasicMaterial color={FROST} transparent toneMapped={false} />
          </line>
        </>
      )}
    </group>
  );
}

function Blob({
  get, position, color, count, spread, focus,
}: {
  get: () => number;
  position: [number, number, number];
  color: THREE.Color;
  count: number;
  spread: number;
  focus?: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const rnd = (n: number) => { const x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); };
    return Array.from({ length: count }, (_, i) => new THREE.Vector3((rnd(i) - 0.5) * spread, (rnd(i + 7) - 0.5) * spread, (rnd(i + 13) - 0.5) * spread));
  }, [count, spread]);
  useFrame((s, dt) => {
    if (!mesh.current) return;
    const v = get();
    mesh.current.visible = v > 0.02;
    const sc = Math.min(1, v);
    data.forEach((p, i) => {
      const d = new THREE.Object3D();
      d.position.copy(p);
      d.scale.setScalar(sc);
      d.updateMatrix();
      mesh.current!.setMatrixAt(i, d.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} position={position}>
      <icosahedronGeometry args={[0.13, 0]} />
      <meshStandardMaterial color={focus ? LIME : color} emissive={focus ? LIME : color} emissiveIntensity={0.6} toneMapped={false} />
    </instancedMesh>
  );
}

function MatureCapsid({ get, position }: { get: () => number; position: [number, number, number] }) {
  const grp = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!grp.current) return;
    const v = get();
    grp.current.visible = v > 0.02;
    grp.current.rotation.y += dt * 0.5;
    grp.current.scale.setScalar(damp(grp.current.scale.x, 0.4 + v * 0.6, 6, dt));
    grp.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (m && "opacity" in m) m.opacity = Math.min(1, v) * ((o as THREE.Mesh).userData.base ?? 1);
    });
  });
  return (
    <group ref={grp} position={position}>
      <mesh userData={{ base: 0.22 }}>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshBasicMaterial color={BLUE} wireframe transparent opacity={0.22} toneMapped={false} />
      </mesh>
      <mesh rotation={[0.2, 0, 0.3]} userData={{ base: 0.55 }}>
        <coneGeometry args={[0.26, 0.62, 20]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.4} transparent opacity={0.55} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------ host cell ------------------------------ */

function HostCell({ integratedGet }: { integratedGet: () => number }) {
  const nucleusDNA = useMemo(() => helixGeo(5, 3.4, 0.7, 160), []);
  const mark = useRef<THREE.Mesh>(null);
  useFrame((s, dt) => {
    if (!mark.current) return;
    const v = integratedGet();
    const m = mark.current.material as THREE.MeshBasicMaterial;
    m.opacity = damp(m.opacity, Math.min(1, v) * (0.7 + Math.sin(s.clock.elapsedTime * 4) * 0.25), 5, dt);
    mark.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 4) * 0.1 * v);
  });
  return (
    <group position={[3, 0, -0.5]}>
      {/* membrane */}
      <mesh>
        <sphereGeometry args={[3, 40, 40]} />
        <meshStandardMaterial color={BLUE} transparent opacity={0.05} roughness={0.5} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[3, 2]} />
        <meshBasicMaterial color={BLUE} wireframe transparent opacity={0.06} toneMapped={false} />
      </mesh>
      {/* nucleus */}
      <mesh>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshStandardMaterial color={BLUE} transparent opacity={0.1} roughness={0.4} toneMapped={false} />
      </mesh>
      <group rotation={[0, 0, 0.3]}>
        <line>
          <primitive object={nucleusDNA} attach="geometry" />
          <lineBasicMaterial color={FROST} transparent opacity={0.35} toneMapped={false} />
        </line>
      </group>
      {/* integration marker */}
      <mesh ref={mark}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={LIME} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------- scene --------------------------------- */

function CycleScene({ stage, dark }: { stage: number; dark: boolean }) {
  const { camera } = useThree();
  const elRef = useRef<CycleElements>({ ...CYCLE_STAGES[0].el });

  useFrame((s, dt) => {
    const target = CYCLE_STAGES[stage].el;
    const cur = elRef.current;
    (Object.keys(cur) as (keyof CycleElements)[]).forEach((k) => {
      cur[k] = damp(cur[k], target[k], 4, dt);
    });
    const cam = CYCLE_STAGES[stage].cam;
    const look = CYCLE_STAGES[stage].look;
    camera.position.x = damp(camera.position.x, cam[0], 2.4, dt);
    camera.position.y = damp(camera.position.y, cam[1], 2.4, dt);
    camera.position.z = damp(camera.position.z, cam[2], 2.4, dt);
    _v.set(
      damp((camera as THREE.PerspectiveCamera).userData.lx ?? look[0], look[0], 2.4, dt),
      look[1],
      look[2]
    );
    (camera as THREE.PerspectiveCamera).userData.lx = _v.x;
    camera.lookAt(_v);
  });

  const g = (k: keyof CycleElements) => () => elRef.current[k];

  return (
    <>
      <ambientLight intensity={dark ? 0.7 : 1.15} />
      <pointLight position={[3, 4, 5]} intensity={dark ? 55 : 40} color="#bfe6ff" distance={40} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#68D2DF" distance={40} />
      <HostCell integratedGet={g("integrated")} />
      <Virion get={g("virion")} position={[-2.6, 0.3, 0]} />
      {/* fusion flash */}
      <Strand get={g("rna")} position={[-0.6, 0, 0.3]} color={BIO} kind="single" />
      <Strand get={g("dna")} position={[-0.6, 0, 0.3]} color={BIO} kind="double" />
      <Strand get={g("newRna")} position={[1.3, 0.3, 0.4]} color={BIO} kind="single" />
      <Blob get={g("proteins")} position={[0.2, -0.3, 0.3]} color={BIO} count={16} spread={1.1} />
      <Blob get={g("integrated")} position={[3, 0, -0.5]} color={LIME} count={6} spread={0.6} focus />
      <Virion get={g("budVirion")} position={[0.2, 0.8, 0]} />
      <MatureCapsid get={g("mature")} position={[-1.6, 0.5, 0]} />
    </>
  );
}

/* ------------------------------ component ------------------------------ */

export default function HIVCycle() {
  const { t } = useI18n();
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const active = CYCLE_STAGES[stage];

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // autoplay through the cycle when visible
  useEffect(() => {
    if (!playing || !visible) return;
    const id = window.setInterval(() => {
      setStage((s) => (s + 1) % CYCLE_STAGES.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [playing, visible]);

  return (
    <section id="hiv-cycle" className="relative overflow-hidden section-pad">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 hairline" />
        <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pulse/[0.05] blur-3xl" />
      </div>

      <div className="shell relative">
        <SectionHeading
          eyebrow={t("cycle.eyebrow")}
          title={t("cycle.title")}
          sub={t("cycle.sub")}
          align="center"
        />

        <div ref={wrapRef} className="relative mt-14">
          {/* stage viewport */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 1, ease: EASE }}
            className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] glass md:aspect-[16/8]"
          >
            <Canvas
              className="absolute inset-0"
              frameloop={visible ? "always" : "never"}
              camera={{ position: [0, 0.4, 8.5], fov: 45 }}
              dpr={[1, 1.7]}
              gl={{ alpha: true, antialias: true }}
            >
              <CycleScene stage={stage} dark={dark} />
            </Canvas>

            {/* cytoplasm / nucleus labels */}
            <div className="pointer-events-none absolute left-6 top-5 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-silver/70">
              {t("cycle.label_cytoplasm")}
            </div>
            <div className="pointer-events-none absolute right-6 top-5 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-silver/70">
              {t("cycle.label_hostcell")}
            </div>

            {/* stage caption overlay */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-abyss/80 to-transparent p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="max-w-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-pulse">
                      {String(stage + 1).padStart(2, "0")}/{String(CYCLE_STAGES.length).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-xl font-medium text-frost md:text-2xl">
                      {t(active.titleKey)}
                    </h3>
                    {active.targetKey && (
                      <span
                        className={`rounded-full border px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.2em] ${
                          active.focus
                            ? "border-lime/50 bg-lime/10 text-lime"
                            : "border-hairline/20 text-silver"
                        }`}
                      >
                        {active.focus ? t("cycle.focus_badge") + " · " : ""}
                        {t(active.targetKey)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-silver">
                    {t(active.descKey)}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* timeline controls */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            className="mt-8 flex flex-col items-center gap-5"
          >
            <div className="flex w-full items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? t("cycle.pause") : t("cycle.play")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline/15 bg-surface/[0.04] text-frost transition-all duration-400 hover:border-pulse/50 hover:text-pulse"
              >
                {playing ? (
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <rect x="4" y="3" width="3" height="10" rx="1" />
                    <rect x="9" y="3" width="3" height="10" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M5 3.5v9l7-4.5-7-4.5z" />
                  </svg>
                )}
              </button>

              {/* stage track */}
              <div className="relative flex flex-1 items-center justify-between">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-hairline/12" />
                <div
                  className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-bio to-pulse transition-all duration-500 ease-premium"
                  style={{ width: `${(stage / (CYCLE_STAGES.length - 1)) * 100}%` }}
                />
                {CYCLE_STAGES.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setStage(i);
                      setPlaying(false);
                    }}
                    aria-label={t(s.titleKey)}
                    className="relative z-10 flex h-6 w-6 items-center justify-center"
                  >
                    <span
                      className={`h-3 w-3 rounded-full border transition-all duration-400 ${
                        i === stage
                          ? "scale-125 border-transparent bg-pulse shadow-[0_0_12px_rgba(47,131,214,0.8)]"
                          : i < stage
                          ? "border-transparent bg-bio/70"
                          : "border-hairline/30 bg-abyss"
                      } ${s.focus ? "ring-2 ring-lime/40 ring-offset-2 ring-offset-transparent" : ""}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted">
              {t("cycle.hint")}
            </p>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-muted"
          >
            {t("cycle.disclaimer")}
          </motion.p>
        </div>
      </div>
    </section>
  );
}

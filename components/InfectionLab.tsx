"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { EASE, VIEWPORT, fadeUp, stagger } from "@/lib/anim";
import { useI18n } from "@/components/providers/I18nProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { PATHOGENS, type Pathogen, type PathogenKey } from "@/lib/pathogens";

const _dummy = new THREE.Object3D();
const _v = new THREE.Vector3();

/* ---- icosahedron unique vertices (for spikes / antigens) ---- */
function useIcosaVerts(radius: number, detail = 1) {
  return useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(radius, detail);
    const pos = geo.getAttribute("position");
    const out: THREE.Vector3[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const k = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(v);
      }
    }
    geo.dispose();
    return out;
  }, [radius, detail]);
}

/* --------------------------- HIV model --------------------------- */

function HIVModel({ color }: { color: THREE.Color }) {
  const spikes = useRef<THREE.InstancedMesh>(null);
  const verts = useIcosaVerts(1.7, 1);

  useEffect(() => {
    if (!spikes.current) return;
    verts.forEach((v, i) => {
      _dummy.position.copy(v).multiplyScalar(1.06);
      _dummy.lookAt(_v.copy(v).multiplyScalar(2));
      _dummy.rotateX(Math.PI / 2);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      spikes.current!.setMatrixAt(i, _dummy.matrix);
    });
    spikes.current.instanceMatrix.needsUpdate = true;
  }, [verts]);

  const rna = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 60; i++) {
      const t = i / 59;
      const a = t * Math.PI * 6;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.34, (t - 0.5) * 1.2, Math.sin(a) * 0.34));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <group>
      {/* envelope */}
      <mesh>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.16} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.68, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.06} roughness={0.4} toneMapped={false} />
      </mesh>
      {/* glycoprotein spikes */}
      <instancedMesh ref={spikes} args={[undefined, undefined, verts.length]}>
        <coneGeometry args={[0.09, 0.34, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.3} toneMapped={false} />
      </instancedMesh>
      {/* conical capsid */}
      <mesh rotation={[0.2, 0, 0.35]} position={[0, -0.05, 0]}>
        <coneGeometry args={[0.62, 1.55, 24, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} roughness={0.35} toneMapped={false} />
      </mesh>
      {/* RNA */}
      <lineSegments rotation={[0.2, 0, 0.35]}>
        <primitive object={rna} attach="geometry" />
        <lineBasicMaterial color="#eaf2fb" transparent opacity={0.5} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

/* ------------------------ Hepatitis model ------------------------ */

function HepatitisModel({ color }: { color: THREE.Color }) {
  const antigens = useRef<THREE.InstancedMesh>(null);
  const verts = useIcosaVerts(1.35, 1);
  useEffect(() => {
    if (!antigens.current) return;
    verts.forEach((v, i) => {
      _dummy.position.copy(v).multiplyScalar(1.0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      antigens.current!.setMatrixAt(i, _dummy.matrix);
    });
    antigens.current.instanceMatrix.needsUpdate = true;
  }, [verts]);

  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color={color} flatShading transparent opacity={0.5} roughness={0.35} metalness={0.1} toneMapped={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.34, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <instancedMesh ref={antigens} args={[undefined, undefined, verts.length]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#cfe4f5" emissive={color} emissiveIntensity={0.5} roughness={0.3} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------- Bacteria model ------------------------ */

function BacteriaModel({ color }: { color: THREE.Color }) {
  const ribo = useRef<THREE.InstancedMesh>(null);
  const riboPos = useMemo(() => {
    const rand = (n: number) => {
      const x = Math.sin(n * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 26 }, (_, i) => new THREE.Vector3((rand(i) - 0.5) * 0.9, (rand(i + 9) - 0.5) * 2.1, (rand(i + 18) - 0.5) * 0.9));
  }, []);
  useEffect(() => {
    if (!ribo.current) return;
    riboPos.forEach((v, i) => {
      _dummy.position.copy(v);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      ribo.current!.setMatrixAt(i, _dummy.matrix);
    });
    ribo.current.instanceMatrix.needsUpdate = true;
  }, [riboPos]);

  const flagella = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    for (let f = 0; f < 3; f++) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 24; i++) {
        const t = i / 23;
        pts.push(new THREE.Vector3(Math.sin(t * 8 + f * 2) * 0.28 * t, -1.5 - t * 1.3, Math.cos(t * 8 + f * 2) * 0.28 * t + (f - 1) * 0.15));
      }
      lines.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    return lines;
  }, []);

  return (
    <group>
      <mesh rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.75, 1.7, 12, 24]} />
        <meshStandardMaterial color={color} transparent opacity={0.28} roughness={0.3} toneMapped={false} />
      </mesh>
      <mesh rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.8, 1.75, 8, 20]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.28} toneMapped={false} />
      </mesh>
      <instancedMesh ref={ribo} args={[undefined, undefined, riboPos.length]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#eaf2fb" emissive={color} emissiveIntensity={0.6} toneMapped={false} />
      </instancedMesh>
      {flagella.map((g, i) => (
        <line key={i}>
          <primitive object={g} attach="geometry" />
          <lineBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
        </line>
      ))}
    </group>
  );
}

/* -------------------------- Fungus model ------------------------- */

function FungusModel({ color }: { color: THREE.Color }) {
  const cells: [number, number, number, number][] = [
    [0, 0, 0, 1.15],
    [1.15, 1.0, 0.2, 0.6],
    [1.35, -0.9, 0.1, 0.45],
  ];
  return (
    <group>
      {cells.map(([x, y, z, r], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[r, 32, 32]} />
            <meshStandardMaterial color={color} transparent opacity={0.32} roughness={0.25} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[r * 1.03, 24, 24]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.28} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[r * 0.32, 16, 16]} />
            <meshStandardMaterial color="#eaf2fb" emissive={color} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ModelSwitch({ type, color }: { type: PathogenKey; color: THREE.Color }) {
  if (type === "hiv") return <HIVModel color={color} />;
  if (type === "hepatitis") return <HepatitisModel color={color} />;
  if (type === "bacteria") return <BacteriaModel color={color} />;
  return <FungusModel color={color} />;
}

/* -------------------------- hotspot marker ----------------------- */

function Hotspot({
  position,
  color,
  active,
  focus,
  onActivate,
}: {
  position: [number, number, number];
  color: THREE.Color;
  active: boolean;
  focus?: boolean;
  onActivate: () => void;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 3) * 0.18;
    const on = active || hover;
    if (ring.current) {
      ring.current.scale.setScalar((on ? 1.5 : 1) * pulse);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = on ? 0.9 : 0.55;
      ring.current.quaternion.copy(state.camera.quaternion);
    }
    if (core.current) core.current.scale.setScalar(on ? 1.5 : 1);
  });

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
        onActivate();
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      <mesh ref={core}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshBasicMaterial color={focus ? "#82C341" : color} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.13, 0.16, 32]} />
        <meshBasicMaterial color={focus ? "#82C341" : color} transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ----------------------------- scene ----------------------------- */

function LabScene({
  pathogen,
  activeId,
  setActiveId,
  allowRotate,
  dark,
}: {
  pathogen: Pathogen;
  activeId: string | null;
  setActiveId: (id: string) => void;
  allowRotate: boolean;
  dark: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const color = useMemo(() => new THREE.Color(pathogen.accent), [pathogen.accent]);

  // grow-in when the pathogen changes
  useEffect(() => {
    if (group.current) group.current.scale.setScalar(0.01);
  }, [pathogen.key]);
  useFrame(() => {
    if (group.current) {
      const s = group.current.scale.x;
      group.current.scale.setScalar(s + (1 - s) * 0.12);
    }
  });

  return (
    <>
      <ambientLight intensity={dark ? 0.7 : 1.1} />
      <pointLight position={[4, 5, 5]} intensity={dark ? 55 : 40} color="#bfe6ff" distance={40} />
      <pointLight position={[-5, -3, 2]} intensity={30} color={pathogen.accent} distance={40} />
      <group ref={group}>
        <ModelSwitch type={pathogen.key} color={color} />
        {pathogen.hotspots.map((h) => (
          <Hotspot
            key={h.id}
            position={h.pos}
            color={color}
            focus={h.focus}
            active={activeId === h.id}
            onActivate={() => setActiveId(h.id)}
          />
        ))}
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={allowRotate}
        autoRotate
        autoRotateSpeed={0.9}
        rotateSpeed={0.6}
        makeDefault
      />
    </>
  );
}

/* --------------------------- section ----------------------------- */

export default function InfectionLab() {
  const { t } = useI18n();
  const { resolved } = useTheme();
  const dark = resolved === "dark";

  const [selected, setSelected] = useState<PathogenKey>("hiv");
  const [activeId, setActiveId] = useState<string | null>("in");
  const [visible, setVisible] = useState(false);
  const [allowRotate, setAllowRotate] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  const pathogen = PATHOGENS.find((p) => p.key === selected)!;
  const activeSpot = pathogen.hotspots.find((h) => h.id === activeId) ?? null;

  useEffect(() => {
    setAllowRotate(
      !window.matchMedia("(hover: none) and (pointer: coarse)").matches
    );
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // when switching pathogen, focus its first focus-target (or first hotspot)
  const selectPathogen = (key: PathogenKey) => {
    setSelected(key);
    const p = PATHOGENS.find((x) => x.key === key)!;
    const first = p.hotspots.find((h) => h.focus) ?? p.hotspots[0];
    setActiveId(first ? first.id : null);
  };

  return (
    <section id="lab" className="relative overflow-hidden section-pad">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 hairline" />
        <div className="absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-bio/[0.05] blur-3xl" />
        <div className="absolute right-0 top-0 h-[26rem] w-[30rem] bg-grid-faint opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_80%_20%,black,transparent_75%)]" />
      </div>

      <div className="shell relative">
        <SectionHeading
          eyebrow={t("lab.eyebrow")}
          title={t("lab.title")}
          sub={t("lab.sub")}
          align="center"
        />

        {/* pathogen selector */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.08, 0.1)}
          className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-2.5"
        >
          {PATHOGENS.map((p) => {
            const on = p.key === selected;
            return (
              <motion.button
                key={p.key}
                variants={fadeUp}
                type="button"
                onClick={() => selectPathogen(p.key)}
                className={`group relative flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-500 ease-premium ${
                  on
                    ? "border-transparent text-abyss"
                    : "border-hairline/12 text-silver hover:border-pulse/40 hover:text-frost"
                }`}
                style={on ? { backgroundColor: p.accent } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: on ? "rgb(var(--bg))" : p.accent,
                    boxShadow: on ? "none" : `0 0 8px ${p.accent}`,
                  }}
                />
                {t(p.nameKey)}
              </motion.button>
            );
          })}
        </motion.div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-6">
          {/* 3D viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 1, ease: EASE }}
            className="relative order-1 lg:order-2 lg:col-span-7"
          >
            <div
              ref={wrapRef}
              className="relative mx-auto aspect-square w-full max-w-[34rem] overflow-hidden rounded-[2rem] glass"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 rounded-[2rem]"
                style={{
                  background: `radial-gradient(ellipse 70% 70% at 50% 45%, transparent 55%, rgb(var(--bg) / 0.5) 100%)`,
                }}
              />
              <Canvas
                className="absolute inset-0"
                frameloop={visible ? "always" : "never"}
                camera={{ position: [0, 0, 6.2], fov: 45 }}
                dpr={[1, 1.7]}
                gl={{ alpha: true, antialias: true }}
              >
                <LabScene
                  pathogen={pathogen}
                  activeId={activeId}
                  setActiveId={setActiveId}
                  allowRotate={allowRotate}
                  dark={dark}
                />
              </Canvas>
              {/* corner readout */}
              <div className="pointer-events-none absolute left-5 top-5 z-20 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-silver/80">
                {t(pathogen.tagKey)}
              </div>
              <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-mono text-[0.58rem] uppercase tracking-[0.25em] text-muted">
                {t("lab.hint_drag")}
              </div>
            </div>
          </motion.div>

          {/* info panel */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={stagger(0.08, 0.1)}
            className="order-2 lg:order-1 lg:col-span-5"
          >
            <motion.p
              variants={fadeUp}
              className="font-mono text-[0.65rem] uppercase tracking-[0.3em]"
              style={{ color: pathogen.accent }}
            >
              {t(pathogen.tagKey)}
            </motion.p>
            <motion.h3
              variants={fadeUp}
              className="mt-3 font-display text-3xl font-medium text-frost"
            >
              {t(pathogen.nameKey)}
            </motion.h3>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-sm leading-relaxed text-silver"
            >
              {t(pathogen.overviewKey)}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-6 hairline" />

            {/* active hotspot detail */}
            <div className="mt-6 min-h-[7.5rem]">
              <AnimatePresence mode="wait">
                {activeSpot ? (
                  <motion.div
                    key={pathogen.key + activeSpot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: activeSpot.focus ? "#82C341" : pathogen.accent,
                          boxShadow: `0 0 10px ${activeSpot.focus ? "#82C341" : pathogen.accent}`,
                        }}
                      />
                      <h4 className="font-display text-lg font-medium text-frost">
                        {t(activeSpot.labelKey)}
                      </h4>
                      {activeSpot.focus && (
                        <span className="rounded-full border border-lime/40 bg-lime/10 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-lime">
                          {t("lab.focus_badge")}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-silver">
                      {t(activeSpot.descKey)}
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted"
                  >
                    {t("lab.select_prompt")}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* hotspot chips */}
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
              {pathogen.hotspots.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setActiveId(h.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-all duration-300 ${
                    activeId === h.id
                      ? "border-pulse/50 bg-pulse/10 text-frost"
                      : "border-hairline/12 text-silver hover:border-pulse/30 hover:text-frost"
                  }`}
                >
                  {t(h.labelKey)}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.9, ease: EASE }}
          className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-muted"
        >
          {t("lab.disclaimer")}
        </motion.p>
      </div>
    </section>
  );
}

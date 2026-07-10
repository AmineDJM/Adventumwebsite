"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { EASE, VIEWPORT, fadeUp, stagger } from "@/lib/anim";
import { useI18n } from "@/components/providers/I18nProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

type Target = {
  key: "integrase" | "protease";
  nameKey: string;
  classKey: string;
  descKey: string;
  accent: string;
};

const TARGETS: Target[] = [
  { key: "integrase", nameKey: "dock.integrase_name", classKey: "dock.integrase_class", descKey: "dock.integrase_desc", accent: "#68D2DF" },
  { key: "protease", nameKey: "dock.protease_name", classKey: "dock.protease_class", descKey: "dock.protease_desc", accent: "#2f83d6" },
];

const _o = new THREE.Object3D();

/* enzyme rendered as a cluster of residues forming a binding pocket */
function Enzyme({ color }: { color: THREE.Color }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const rnd = (n: number) => { const x = Math.sin(n * 51.3) * 8493.7; return x - Math.floor(x); };
    const out: THREE.Vector3[] = [];
    // spherical shell with a cavity carved on the +x side (the pocket)
    for (let i = 0; i < 90; i++) {
      const u = rnd(i), v = rnd(i + 40);
      const theta = Math.acos(2 * u - 1);
      const phi = 2 * Math.PI * v;
      const p = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta)
      ).multiplyScalar(1.5 + rnd(i + 90) * 0.25);
      // carve a pocket: skip points near the +x axis
      if (p.x > 0.7 && Math.hypot(p.y, p.z) < 0.9) continue;
      out.push(p);
    }
    return out;
  }, []);
  useEffect(() => {
    if (!ref.current) return;
    positions.forEach((p, i) => {
      _o.position.copy(p);
      _o.scale.setScalar(0.9 + (i % 5) * 0.05);
      _o.updateMatrix();
      ref.current!.setMatrixAt(i, _o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]}>
      <sphereGeometry args={[0.22, 12, 12]} />
      <meshStandardMaterial color={color} transparent opacity={0.5} roughness={0.4} toneMapped={false} />
    </instancedMesh>
  );
}

/* small-molecule ligand (ball-and-stick) that docks into the pocket on a loop */
function Ligand({ color }: { color: THREE.Color }) {
  const grp = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const atoms = useMemo(
    () => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.34, 0.2, 0),
      new THREE.Vector3(0.1, -0.34, 0.15),
      new THREE.Vector3(-0.32, 0.12, -0.1),
      new THREE.Vector3(0.4, -0.14, -0.2),
    ],
    []
  );
  const bonds = useMemo(() => {
    const g: THREE.BufferGeometry[] = [];
    const pairs = [[0, 1], [0, 2], [0, 3], [1, 4]];
    for (const [a, b] of pairs) g.push(new THREE.BufferGeometry().setFromPoints([atoms[a], atoms[b]]));
    return g;
  }, [atoms]);

  useFrame((s) => {
    if (!grp.current) return;
    const t = (s.clock.elapsedTime % 5) / 5; // 5s loop
    // approach from +x (3.2) to the pocket (1.0), hold, then leave
    let x: number;
    let bound = 0;
    if (t < 0.4) x = 3.4 - (t / 0.4) * 2.3; // approach
    else if (t < 0.75) { x = 1.1; bound = 1; } // bound
    else x = 1.1 + ((t - 0.75) / 0.25) * 2.3; // leave
    grp.current.position.x = x;
    grp.current.position.y = Math.sin(s.clock.elapsedTime * 1.5) * 0.08;
    grp.current.rotation.y = s.clock.elapsedTime * 0.8;
    if (glow.current) {
      const m = glow.current.material as THREE.MeshBasicMaterial;
      m.opacity = bound * (0.35 + Math.sin(s.clock.elapsedTime * 6) * 0.2);
      glow.current.scale.setScalar(1 + bound * 0.4);
    }
  });

  return (
    <group>
      {/* pocket bind glow */}
      <mesh ref={glow} position={[1.1, 0, 0]}>
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={grp}>
        {atoms.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[i === 0 ? 0.14 : 0.1, 16, 16]} />
            <meshStandardMaterial color={i === 0 ? "#eaf2fb" : color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
        ))}
        {bonds.map((g, i) => (
          <line key={i}>
            <primitive object={g} attach="geometry" />
            <lineBasicMaterial color="#cfe4f5" transparent opacity={0.7} toneMapped={false} />
          </line>
        ))}
      </group>
    </group>
  );
}

function DockScene({ target, dark }: { target: Target; dark: boolean }) {
  const color = useMemo(() => new THREE.Color(target.accent), [target.accent]);
  const grp = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (grp.current) grp.current.rotation.y += dt * 0.15;
  });
  return (
    <>
      <ambientLight intensity={dark ? 0.7 : 1.1} />
      <pointLight position={[4, 4, 5]} intensity={dark ? 50 : 38} color="#bfe6ff" distance={40} />
      <pointLight position={[-4, -2, 2]} intensity={26} color={target.accent} distance={40} />
      <group ref={grp}>
        <Enzyme color={color} />
      </group>
      <Ligand color={color} />
    </>
  );
}

export default function MechanismDock() {
  const { t } = useI18n();
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const [sel, setSel] = useState<Target["key"]>("integrase");
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const target = TARGETS.find((x) => x.key === sel)!;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="mechanism" className="relative overflow-hidden section-pad">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 hairline" />
        <div className="absolute right-1/4 top-1/3 h-[32rem] w-[32rem] rounded-full bg-bio/[0.05] blur-3xl" />
      </div>
      <div className="shell relative">
        <SectionHeading
          eyebrow={t("dock.eyebrow")}
          title={t("dock.title")}
          sub={t("dock.sub")}
          align="center"
        />

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={stagger(0.08, 0.1)}
            >
              <motion.div variants={fadeUp} className="flex gap-2.5">
                {TARGETS.map((tg) => {
                  const on = tg.key === sel;
                  return (
                    <button
                      key={tg.key}
                      type="button"
                      onClick={() => setSel(tg.key)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-400 ${
                        on ? "border-transparent text-abyss" : "border-hairline/12 text-silver hover:border-pulse/40 hover:text-frost"
                      }`}
                      style={on ? { backgroundColor: tg.accent } : undefined}
                    >
                      {t(tg.nameKey)}
                    </button>
                  );
                })}
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={sel}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <p className="mt-8 font-mono text-[0.65rem] uppercase tracking-[0.3em]" style={{ color: target.accent }}>
                    {t(target.classKey)}
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-medium text-frost">
                    {t(target.nameKey)}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-silver">{t(target.descKey)}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 1, ease: EASE }}
            className="order-1 lg:order-2 lg:col-span-7"
          >
            <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[32rem] overflow-hidden rounded-[2rem] glass">
              <Canvas
                className="absolute inset-0"
                frameloop={visible ? "always" : "never"}
                camera={{ position: [0.5, 0.5, 5.5], fov: 45 }}
                dpr={[1, 1.7]}
                gl={{ alpha: true, antialias: true }}
              >
                <DockScene target={target} dark={dark} />
              </Canvas>
              <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[0.58rem] uppercase tracking-[0.25em] text-muted">
                {t("dock.hint")}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.9, ease: EASE }}
          className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-muted"
        >
          {t("dock.disclaimer")}
        </motion.p>
      </div>
    </section>
  );
}

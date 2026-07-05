"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Grid } from "@react-three/drei";
import {
  ALGERIA_OUTLINE,
  ALGERIA_CITIES,
  projectLonLat,
  samplePointsInPolygon,
  sampleOutline,
  seededRandom,
} from "@/lib/geo";

/* ----------------------------- palette ----------------------------- */

const BIO = new THREE.Color("#3ee6a8");
const PULSE = new THREE.Color("#4cd7f6");
const FROST = new THREE.Color("#cfe4f5");

/* ------------------------- soft sprite texture --------------------- */

function useSoftSprite(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

/* --------------------------- ambient dust -------------------------- */

function AmbientParticles({ quality }: { quality: number }) {
  const sprite = useSoftSprite();
  const ref = useRef<THREE.Points>(null);
  const count = Math.floor(900 * quality);

  const { positions, colors } = useMemo(() => {
    const rand = seededRandom(11);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [FROST, PULSE, BIO, FROST, PULSE];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 44;
      positions[i * 3 + 1] = (rand() - 0.5) * 26;
      positions[i * 3 + 2] = (rand() - 0.5) * 30 - 4;
      const c = palette[Math.floor(rand() * palette.length)];
      const dim = 0.35 + rand() * 0.65;
      colors[i * 3] = c.r * dim;
      colors[i * 3 + 1] = c.g * dim;
      colors[i * 3 + 2] = c.b * dim;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.012;
    ref.current.rotation.x = Math.sin(t * 0.05) * 0.02;
  });

  if (!sprite) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.16}
        vertexColors
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/* ----------------------------- DNA helix --------------------------- */

function DNAHelix({ quality }: { quality: number }) {
  const group = useRef<THREE.Group>(null);
  const nodesPerStrand = Math.floor(64 * Math.max(quality, 0.6));
  const height = 11;
  const radius = 1.35;
  const turns = 2.4;

  const { strandA, strandB, rungs } = useMemo(() => {
    const strandA: THREE.Vector3[] = [];
    const strandB: THREE.Vector3[] = [];
    const rungs: number[] = [];
    for (let i = 0; i < nodesPerStrand; i++) {
      const t = i / (nodesPerStrand - 1);
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * height;
      const a = new THREE.Vector3(
        Math.cos(angle) * radius, y, Math.sin(angle) * radius
      );
      const b = new THREE.Vector3(
        Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius
      );
      strandA.push(a);
      strandB.push(b);
      if (i % 4 === 0) rungs.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    return { strandA, strandB, rungs: new Float32Array(rungs) };
  }, [nodesPerStrand]);

  const meshA = useRef<THREE.InstancedMesh>(null);
  const meshB = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    [
      { mesh: meshA.current, pts: strandA },
      { mesh: meshB.current, pts: strandB },
    ].forEach(({ mesh, pts }) => {
      if (!mesh) return;
      pts.forEach((p, i) => {
        dummy.position.copy(p);
        const s = 0.85 + Math.sin(i * 1.7) * 0.25;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [strandA, strandB]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.14;
    group.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.28) * 0.35;
  });

  return (
    <group ref={group} position={[-6.2, 0.4, -3]} rotation={[0.12, 0, 0.26]}>
      <instancedMesh ref={meshA} args={[undefined, undefined, nodesPerStrand]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshBasicMaterial color={BIO} transparent opacity={0.9} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={meshB} args={[undefined, undefined, nodesPerStrand]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshBasicMaterial color={PULSE} transparent opacity={0.9} toneMapped={false} />
      </instancedMesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rungs, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={FROST}
          transparent
          opacity={0.28}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

/* --------------------------- virus bodies -------------------------- */

function Virion({
  position,
  scale,
  drift,
  color,
}: {
  position: [number, number, number];
  scale: number;
  drift: number;
  color: THREE.Color;
}) {
  const spikes = useRef<THREE.InstancedMesh>(null);
  const inner = useRef<THREE.Mesh>(null);

  const spikePositions = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const pos = geo.getAttribute("position");
    const unique: THREE.Vector3[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(v);
      }
    }
    geo.dispose();
    return unique;
  }, []);

  useEffect(() => {
    if (!spikes.current) return;
    const dummy = new THREE.Object3D();
    spikePositions.forEach((v, i) => {
      dummy.position.copy(v).multiplyScalar(1.18);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      spikes.current!.setMatrixAt(i, dummy.matrix);
    });
    spikes.current.instanceMatrix.needsUpdate = true;
  }, [spikePositions]);

  useFrame((state) => {
    if (inner.current) {
      const m = inner.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.08 + Math.sin(state.clock.elapsedTime * drift + scale) * 0.04;
    }
  });

  return (
    <Float speed={drift} rotationIntensity={0.5} floatIntensity={0.9}>
      <group position={position} scale={scale}>
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.22}
            toneMapped={false}
          />
        </mesh>
        <instancedMesh
          ref={spikes}
          args={[undefined, undefined, spikePositions.length]}
        >
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </instancedMesh>
        <mesh ref={inner}>
          <sphereGeometry args={[0.72, 24, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

function VirusCluster() {
  return (
    <>
      <Virion position={[6.2, 1.8, -2.5]} scale={1.15} drift={1.1} color={PULSE} />
      <Virion position={[8.2, -2.4, -6]} scale={0.8} drift={0.8} color={BIO} />
      <Virion position={[4.2, -0.6, -8]} scale={0.55} drift={1.4} color={FROST} />
    </>
  );
}

/* ------------------------ molecular network ------------------------ */

function MolecularNetwork({ quality }: { quality: number }) {
  const group = useRef<THREE.Group>(null);
  const sprite = useSoftSprite();
  const nodeCount = Math.floor(46 * Math.max(quality, 0.6));

  const { nodePositions, edges } = useMemo(() => {
    const rand = seededRandom(23);
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(
        new THREE.Vector3(
          (rand() - 0.5) * 22,
          (rand() - 0.5) * 11,
          (rand() - 0.5) * 6
        )
      );
    }
    const nodePositions = new Float32Array(nodeCount * 3);
    nodes.forEach((n, i) => {
      nodePositions[i * 3] = n.x;
      nodePositions[i * 3 + 1] = n.y;
      nodePositions[i * 3 + 2] = n.z;
    });
    const edgeList: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 3.4) {
          edgeList.push(
            nodes[i].x, nodes[i].y, nodes[i].z,
            nodes[j].x, nodes[j].y, nodes[j].z
          );
        }
      }
    }
    return { nodePositions, edges: new Float32Array(edgeList) };
  }, [nodeCount]);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  if (!sprite) return null;

  return (
    <group ref={group} position={[0, 0.5, -10]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sprite}
          color={PULSE}
          size={0.22}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={PULSE}
          transparent
          opacity={0.08}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

/* ------------------------ Algeria hologram ------------------------- */

function AlgeriaHologram({ quality }: { quality: number }) {
  const group = useRef<THREE.Group>(null);
  const sprite = useSoftSprite();
  const scale = 0.3;

  const { outlinePts, fillPts, cityPts } = useMemo(() => {
    const outline = sampleOutline(ALGERIA_OUTLINE, Math.floor(420 * quality));
    const fill = samplePointsInPolygon(
      ALGERIA_OUTLINE,
      Math.floor(320 * quality),
      13
    );
    const toArray = (pts: [number, number][]) => {
      const arr = new Float32Array(pts.length * 3);
      pts.forEach((p, i) => {
        const { x, y } = projectLonLat(p, scale);
        arr[i * 3] = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = 0;
      });
      return arr;
    };
    return {
      outlinePts: toArray(outline),
      fillPts: toArray(fill),
      cityPts: toArray(ALGERIA_CITIES.map((c) => c.pos)),
    };
  }, [quality]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.1) * 0.05;
    group.current.position.y = -3.6 + Math.sin(t * 0.24) * 0.18;
  });

  if (!sprite) return null;

  return (
    <group
      ref={group}
      position={[4.6, -3.6, -4]}
      rotation={[-Math.PI / 3.2, 0.08, -0.12]}
    >
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outlinePts, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sprite}
          color={PULSE}
          size={0.09}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fillPts, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sprite}
          color={FROST}
          size={0.055}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cityPts, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sprite}
          color={BIO}
          size={0.24}
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/* ---------------------------- light beams -------------------------- */

function useBeamTexture(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.8)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function LightBeams() {
  const tex = useBeamTexture();
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (a.current) a.current.rotation.z = 0.32 + Math.sin(t * 0.07) * 0.03;
    if (b.current) b.current.rotation.z = -0.4 + Math.cos(t * 0.05) * 0.03;
  });

  if (!tex) return null;

  return (
    <>
      <mesh ref={a} position={[-8.5, 3, -12]} rotation={[0, 0, 0.32]}>
        <planeGeometry args={[2.2, 26]} />
        <meshBasicMaterial
          map={tex}
          color={PULSE}
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={b} position={[8, 5, -14]} rotation={[0, 0, -0.4]}>
        <planeGeometry args={[3, 30]} />
        <meshBasicMaterial
          map={tex}
          color={BIO}
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

/* ---------------------------- camera rig --------------------------- */

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, pointer } = useThree();
  const scroll = useRef(0);
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight || 1;
      scroll.current = Math.min(window.scrollY / (vh * 1.4), 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = scroll.current;
    const px = reducedMotion ? 0 : pointer.x;
    const py = reducedMotion ? 0 : pointer.y;

    const targetX = px * 1.15 + Math.sin(t * 0.05) * 0.5;
    const targetY = 0.4 + py * 0.55 - p * 2.6 + Math.cos(t * 0.04) * 0.3;
    const targetZ = 16 - p * 4.2;

    const d = 1 - Math.pow(0.02, delta);
    camera.position.x += (targetX - camera.position.x) * d;
    camera.position.y += (targetY - camera.position.y) * d;
    camera.position.z += (targetZ - camera.position.z) * d;

    look.current.lerp(new THREE.Vector3(0, -p * 1.6, 0), d);
    camera.lookAt(look.current);
  });

  return null;
}

/* ------------------------------ scene ------------------------------ */

function Scene({
  quality,
  reducedMotion,
}: {
  quality: number;
  reducedMotion: boolean;
}) {
  return (
    <>
      <fog attach="fog" args={["#02050c", 14, 36]} />
      <CameraRig reducedMotion={reducedMotion} />
      <AmbientParticles quality={quality} />
      <DNAHelix quality={quality} />
      <VirusCluster />
      <MolecularNetwork quality={quality} />
      <AlgeriaHologram quality={quality} />
      <LightBeams />
      <Grid
        position={[0, -7.5, -4]}
        args={[60, 60]}
        cellSize={1.4}
        cellThickness={0.5}
        cellColor="#0c2233"
        sectionSize={7}
        sectionThickness={1}
        sectionColor="#134a5c"
        fadeDistance={38}
        fadeStrength={2.2}
        infiniteGrid
      />
    </>
  );
}

/* --------------------------- entry point ---------------------------- */

function FallbackBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-grid-faint"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 70% 30%, rgba(76,215,246,0.10), transparent 60%)," +
          "radial-gradient(ellipse 55% 45% at 25% 70%, rgba(62,230,168,0.08), transparent 60%)," +
          "linear-gradient(180deg, #050b17 0%, #02050c 100%)",
      }}
    />
  );
}

export default function ThreeScientificScene({
  className = "",
}: {
  className?: string;
}) {
  const [env, setEnv] = useState<{
    webgl: boolean;
    quality: number;
    reducedMotion: boolean;
  } | null>(null);

  useEffect(() => {
    let webgl = false;
    try {
      const canvas = document.createElement("canvas");
      webgl = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
      );
    } catch {
      webgl = false;
    }
    const isMobile =
      window.matchMedia("(max-width: 768px)").matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setEnv({ webgl, quality: isMobile ? 0.45 : 1, reducedMotion });
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <FallbackBackdrop />
      {env?.webgl && (
        <Canvas
          className="absolute inset-0"
          camera={{ position: [0, 0.4, 16], fov: 50, near: 0.1, far: 80 }}
          dpr={[1, env.quality < 1 ? 1.5 : 1.75]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          performance={{ min: 0.5 }}
        >
          <Scene quality={env.quality} reducedMotion={env.reducedMotion} />
        </Canvas>
      )}
    </div>
  );
}

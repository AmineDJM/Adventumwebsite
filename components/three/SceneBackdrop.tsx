"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Grid } from "@react-three/drei";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  ALGERIA_OUTLINE,
  ALGERIA_CITIES,
  projectLonLat,
  samplePointsInPolygon,
  sampleOutline,
  seededRandom,
} from "@/lib/geo";

/* ================================================================== */
/*  Persistent full-page "scientific laboratory" the camera travels   */
/*  through as the page scrolls. Objects are staged at increasing     */
/*  depth (-Z) so scrolling flies the viewer forward past molecular   */
/*  structures, capsules, vials, holographic panels and networks.     */
/* ================================================================== */

const BIO = new THREE.Color("#68D2DF"); // teal
const PULSE = new THREE.Color("#2f83d6"); // brand blue
const ROYAL = new THREE.Color("#2e6db4");
const FROST = new THREE.Color("#cfe4f5");

// shared scratch objects — never allocate inside useFrame
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _vec = new THREE.Vector3();

/* ------------------------- textures ------------------------------- */

function useSoftSprite(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.5)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);
}

function useBeamTexture(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);
}

/** Holographic panel face — faint scan lines + data ticks. */
function usePanelTexture(seed: number): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const w = 256;
    const h = 320;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const rand = seededRandom(seed);
    ctx.clearRect(0, 0, w, h);
    // border
    ctx.strokeStyle = "rgba(120,200,240,0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    // scan lines
    ctx.strokeStyle = "rgba(120,200,240,0.10)";
    ctx.lineWidth = 1;
    for (let y = 20; y < h - 12; y += 8) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(w - 14, y);
      ctx.stroke();
    }
    // header ticks
    ctx.fillStyle = "rgba(140,220,255,0.8)";
    ctx.fillRect(18, 18, 60, 6);
    ctx.fillRect(18, 30, 34, 4);
    // bar chart
    for (let i = 0; i < 8; i++) {
      const bh = 20 + rand() * 90;
      ctx.fillStyle = `rgba(${80 + rand() * 60},${180 + rand() * 60},240,0.5)`;
      ctx.fillRect(24 + i * 26, h - 28 - bh, 16, bh);
    }
    // scattered nodes
    ctx.fillStyle = "rgba(60,214,236,0.85)";
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(30 + rand() * (w - 60), 70 + rand() * 120, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, [seed]);
}

/* ---------------------- ambient volume ---------------------------- */

function AmbientVolume({ quality }: { quality: number }) {
  const sprite = useSoftSprite();
  const ref = useRef<THREE.Points>(null);
  const count = Math.floor(1400 * quality);

  const { positions, colors } = useMemo(() => {
    const rand = seededRandom(11);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [FROST, PULSE, BIO, FROST, PULSE, ROYAL];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 52;
      positions[i * 3 + 1] = (rand() - 0.5) * 30;
      positions[i * 3 + 2] = 12 - rand() * 100; // fill the deep travel corridor
      const c = palette[Math.floor(rand() * palette.length)];
      const dim = 0.3 + rand() * 0.7;
      colors[i * 3] = c.r * dim;
      colors[i * 3 + 1] = c.g * dim;
      colors[i * 3 + 2] = c.b * dim;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.008;
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
        size={0.15}
        vertexColors
        transparent
        opacity={0.72}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/* --------------------------- DNA helix ---------------------------- */

function DNAHelix({
  quality,
  position,
  rotation = [0, 0, 0],
  height = 12,
  colorA = BIO,
  colorB = PULSE,
}: {
  quality: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
  colorA?: THREE.Color;
  colorB?: THREE.Color;
}) {
  const group = useRef<THREE.Group>(null);
  const nodes = Math.floor(70 * Math.max(quality, 0.55));
  const radius = 1.4;
  const turns = 2.6;

  const { strandA, strandB, rungs } = useMemo(() => {
    const a: THREE.Vector3[] = [];
    const b: THREE.Vector3[] = [];
    const r: number[] = [];
    for (let i = 0; i < nodes; i++) {
      const t = i / (nodes - 1);
      const ang = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * height;
      const va = new THREE.Vector3(Math.cos(ang) * radius, y, Math.sin(ang) * radius);
      const vb = new THREE.Vector3(Math.cos(ang + Math.PI) * radius, y, Math.sin(ang + Math.PI) * radius);
      a.push(va);
      b.push(vb);
      if (i % 3 === 0) r.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
    }
    return { strandA: a, strandB: b, rungs: new Float32Array(r) };
  }, [nodes, height]);

  const meshA = useRef<THREE.InstancedMesh>(null);
  const meshB = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    [
      { m: meshA.current, pts: strandA },
      { m: meshB.current, pts: strandB },
    ].forEach(({ m, pts }) => {
      if (!m) return;
      pts.forEach((p, i) => {
        _dummy.position.copy(p);
        _dummy.scale.setScalar(0.85 + Math.sin(i * 1.7) * 0.22);
        _dummy.updateMatrix();
        m.setMatrixAt(i, _dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    });
  }, [strandA, strandB]);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.16;
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      <instancedMesh ref={meshA} args={[undefined, undefined, nodes]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color={colorA} emissive={colorA} emissiveIntensity={1.4} roughness={0.3} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={meshB} args={[undefined, undefined, nodes]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color={colorB} emissive={colorB} emissiveIntensity={1.4} roughness={0.3} toneMapped={false} />
      </instancedMesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rungs, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={FROST} transparent opacity={0.26} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

/* --------------------------- virions ------------------------------ */

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
      const k = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(v);
      }
    }
    geo.dispose();
    return unique;
  }, []);

  useEffect(() => {
    if (!spikes.current) return;
    spikePositions.forEach((v, i) => {
      _dummy.position.copy(v).multiplyScalar(1.18);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      spikes.current!.setMatrixAt(i, _dummy.matrix);
    });
    spikes.current.instanceMatrix.needsUpdate = true;
  }, [spikePositions]);

  useFrame((state) => {
    if (inner.current) {
      const m = inner.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.09 + Math.sin(state.clock.elapsedTime * drift + scale) * 0.05;
    }
  });

  return (
    <Float speed={drift} rotationIntensity={0.5} floatIntensity={0.9}>
      <group position={position} scale={scale}>
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.22} toneMapped={false} />
        </mesh>
        <instancedMesh ref={spikes} args={[undefined, undefined, spikePositions.length]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
        </instancedMesh>
        <mesh ref={inner}>
          <sphereGeometry args={[0.72, 24, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </Float>
  );
}

/* ---------------------- molecular network ------------------------- */

function MolecularNetwork({
  quality,
  position,
  color = PULSE,
}: {
  quality: number;
  position: [number, number, number];
  color?: THREE.Color;
}) {
  const group = useRef<THREE.Group>(null);
  const sprite = useSoftSprite();
  const nodeCount = Math.floor(50 * Math.max(quality, 0.55));

  const { nodePositions, edges } = useMemo(() => {
    const rand = seededRandom(23);
    const ns: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++)
      ns.push(new THREE.Vector3((rand() - 0.5) * 24, (rand() - 0.5) * 12, (rand() - 0.5) * 8));
    const np = new Float32Array(nodeCount * 3);
    ns.forEach((n, i) => {
      np[i * 3] = n.x;
      np[i * 3 + 1] = n.y;
      np[i * 3 + 2] = n.z;
    });
    const e: number[] = [];
    for (let i = 0; i < ns.length; i++)
      for (let j = i + 1; j < ns.length; j++)
        if (ns[i].distanceTo(ns[j]) < 3.6) e.push(ns[i].x, ns[i].y, ns[i].z, ns[j].x, ns[j].y, ns[j].z);
    return { nodePositions: np, edges: new Float32Array(e) };
  }, [nodeCount]);

  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  if (!sprite) return null;
  return (
    <group ref={group} position={position}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial map={sprite} color={color} size={0.24} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.09} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

/* ---------------------- Algeria hologram -------------------------- */

function AlgeriaHologram({ quality, position }: { quality: number; position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const sprite = useSoftSprite();
  const scale = 0.32;

  const { outlinePts, fillPts, cityPts } = useMemo(() => {
    const outline = sampleOutline(ALGERIA_OUTLINE, Math.floor(440 * quality));
    const fill = samplePointsInPolygon(ALGERIA_OUTLINE, Math.floor(320 * quality), 13);
    const toArr = (pts: [number, number][]) => {
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
      outlinePts: toArr(outline),
      fillPts: toArr(fill),
      cityPts: toArr(ALGERIA_CITIES.map((c) => c.pos)),
    };
  }, [quality]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.1) * 0.05;
  });

  if (!sprite) return null;
  return (
    <group ref={group} position={position} rotation={[-Math.PI / 3.1, 0.08, -0.12]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outlinePts, 3]} />
        </bufferGeometry>
        <pointsMaterial map={sprite} color={PULSE} size={0.09} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fillPts, 3]} />
        </bufferGeometry>
        <pointsMaterial map={sprite} color={FROST} size={0.05} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cityPts, 3]} />
        </bufferGeometry>
        <pointsMaterial map={sprite} color={BIO} size={0.26} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
      </points>
    </group>
  );
}

/* --------------------- capsule + vial field ----------------------- */

function CapsuleField({ quality, z }: { quality: number; z: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = Math.floor(30 * Math.max(quality, 0.5));

  const data = useMemo(() => {
    const rand = seededRandom(71);
    return Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((rand() - 0.5) * 34, (rand() - 0.5) * 18, z + (rand() - 0.5) * 14),
      rot: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
      scale: 0.7 + rand() * 0.9,
      spin: (rand() - 0.5) * 0.5,
      teal: rand() > 0.5,
    }));
  }, [count, z]);

  useEffect(() => {
    if (!ref.current) return;
    data.forEach((d, i) => {
      _dummy.position.copy(d.pos);
      _dummy.rotation.copy(d.rot);
      _dummy.scale.setScalar(d.scale);
      _dummy.updateMatrix();
      ref.current!.setMatrixAt(i, _dummy.matrix);
      ref.current!.setColorAt(i, _color.copy(d.teal ? BIO : PULSE));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [data]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      d.rot.y += delta * d.spin;
      d.pos.y += Math.sin(state.clock.elapsedTime * 0.4 + i) * delta * 0.15;
      _dummy.position.copy(d.pos);
      _dummy.rotation.copy(d.rot);
      _dummy.scale.setScalar(d.scale);
      _dummy.updateMatrix();
      ref.current.setMatrixAt(i, _dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <capsuleGeometry args={[0.16, 0.5, 6, 12]} />
      <meshStandardMaterial roughness={0.25} metalness={0.1} emissiveIntensity={0.35} toneMapped={false} transparent opacity={0.92} />
    </instancedMesh>
  );
}

function VialCluster({ quality, z }: { quality: number; z: number }) {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const count = Math.floor(9 * Math.max(quality, 0.5));

  const data = useMemo(() => {
    const rand = seededRandom(88);
    return Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((rand() - 0.5) * 30, (rand() - 0.5) * 14, z + (rand() - 0.5) * 12),
      rot: (rand() - 0.5) * 0.6,
      scale: 0.9 + rand() * 0.8,
    }));
  }, [count, z]);

  useEffect(() => {
    data.forEach((d, i) => {
      _dummy.position.copy(d.pos);
      _dummy.rotation.set(d.rot, 0, d.rot * 0.5);
      _dummy.scale.setScalar(d.scale);
      _dummy.updateMatrix();
      bodies.current?.setMatrixAt(i, _dummy.matrix);
      _dummy.position.set(d.pos.x, d.pos.y + 0.62 * d.scale, d.pos.z);
      _dummy.scale.setScalar(d.scale);
      _dummy.updateMatrix();
      caps.current?.setMatrixAt(i, _dummy.matrix);
    });
    if (bodies.current) bodies.current.instanceMatrix.needsUpdate = true;
    if (caps.current) caps.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  useFrame((state) => {
    const grp = bodies.current?.parent;
    if (grp) grp.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.22, 0.22, 1, 16, 1, true]} />
        <meshStandardMaterial color={BIO} emissive={BIO} emissiveIntensity={0.25} roughness={0.1} metalness={0.05} transparent opacity={0.28} side={THREE.DoubleSide} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.24, 0.24, 0.18, 16]} />
        <meshStandardMaterial color={FROST} roughness={0.3} metalness={0.7} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* --------------------- holographic panels ------------------------- */

function HoloPanel({
  position,
  rotation,
  seed,
  scale = 1,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  seed: number;
  scale?: number;
}) {
  const tex = usePanelTexture(seed);
  if (!tex) return null;
  return (
    <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.5}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh>
          <planeGeometry args={[2.4, 3]} />
          <meshBasicMaterial map={tex} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh>
          <planeGeometry args={[2.5, 3.1]} />
          <meshBasicMaterial color={PULSE} transparent opacity={0.04} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </Float>
  );
}

function HoloPanels({ quality, z }: { quality: number; z: number }) {
  const panels = useMemo(() => {
    const rand = seededRandom(55);
    const n = quality < 0.6 ? 4 : 7;
    return Array.from({ length: n }, (_, i) => ({
      position: [
        (rand() - 0.5) * 30,
        (rand() - 0.5) * 14,
        z + (rand() - 0.5) * 16,
      ] as [number, number, number],
      rotation: [
        (rand() - 0.5) * 0.4,
        (rand() - 0.5) * 0.9,
        (rand() - 0.5) * 0.2,
      ] as [number, number, number],
      seed: 100 + i * 7,
      scale: 0.8 + rand() * 0.8,
    }));
  }, [quality, z]);

  return (
    <>
      {panels.map((p, i) => (
        <HoloPanel key={i} {...p} />
      ))}
    </>
  );
}

/* --------------------- hospital network --------------------------- */

function HospitalNetwork({ quality, z }: { quality: number; z: number }) {
  const nodes = useRef<THREE.InstancedMesh>(null);
  const sprite = useSoftSprite();
  const count = Math.floor(38 * Math.max(quality, 0.5));

  const { positions, nodePos, edges } = useMemo(() => {
    const rand = seededRandom(64);
    const ns: THREE.Vector3[] = [];
    // loose grid to read as a "network"
    for (let i = 0; i < count; i++) {
      ns.push(
        new THREE.Vector3(
          (rand() - 0.5) * 36,
          (rand() - 0.5) * 16,
          z + (rand() - 0.5) * 12
        )
      );
    }
    const np = new Float32Array(count * 3);
    ns.forEach((n, i) => {
      np[i * 3] = n.x;
      np[i * 3 + 1] = n.y;
      np[i * 3 + 2] = n.z;
    });
    const e: number[] = [];
    for (let i = 0; i < ns.length; i++) {
      let links = 0;
      for (let j = i + 1; j < ns.length && links < 3; j++) {
        if (ns[i].distanceTo(ns[j]) < 8) {
          e.push(ns[i].x, ns[i].y, ns[i].z, ns[j].x, ns[j].y, ns[j].z);
          links++;
        }
      }
    }
    return { positions: ns, nodePos: np, edges: new Float32Array(e) };
  }, [count, z]);

  useEffect(() => {
    if (!nodes.current) return;
    positions.forEach((p, i) => {
      _dummy.position.copy(p);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      nodes.current!.setMatrixAt(i, _dummy.matrix);
      nodes.current!.setColorAt(i, _color.copy(i % 4 === 0 ? BIO : PULSE));
    });
    nodes.current.instanceMatrix.needsUpdate = true;
    if (nodes.current.instanceColor) nodes.current.instanceColor.needsUpdate = true;
  }, [positions]);

  useFrame((state) => {
    if (!nodes.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    nodes.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <instancedMesh ref={nodes} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial emissive={PULSE} emissiveIntensity={1.3} color={PULSE} toneMapped={false} />
      </instancedMesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={PULSE} transparent opacity={0.1} toneMapped={false} />
      </lineSegments>
      {sprite && (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[nodePos, 3]} />
          </bufferGeometry>
          <pointsMaterial map={sprite} color={BIO} size={0.5} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
        </points>
      )}
    </group>
  );
}

/* --------------------- large molecular lattice -------------------- */

function MolecularLattice({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);

  const { vertices, count } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(3.2, 1);
    const pos = geo.getAttribute("position");
    const unique: THREE.Vector3[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const k = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(v);
      }
    }
    geo.dispose();
    return { vertices: unique, count: unique.length };
  }, []);

  useEffect(() => {
    if (!nodesRef.current) return;
    vertices.forEach((v, i) => {
      _dummy.position.copy(v);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      nodesRef.current!.setMatrixAt(i, _dummy.matrix);
    });
    nodesRef.current.instanceMatrix.needsUpdate = true;
  }, [vertices]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh>
        <icosahedronGeometry args={[3.2, 1]} />
        <meshBasicMaterial color={PULSE} wireframe transparent opacity={0.16} toneMapped={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[3.2, 0]} />
        <meshBasicMaterial color={ROYAL} wireframe transparent opacity={0.28} toneMapped={false} />
      </mesh>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color={BIO} emissive={BIO} emissiveIntensity={1.4} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* --------------------------- beams -------------------------------- */

function LightBeams() {
  const tex = useBeamTexture();
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const c = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (a.current) a.current.rotation.z = 0.32 + Math.sin(t * 0.07) * 0.03;
    if (b.current) b.current.rotation.z = -0.4 + Math.cos(t * 0.05) * 0.03;
    if (c.current) c.current.rotation.z = 0.1 + Math.sin(t * 0.04) * 0.02;
  });

  if (!tex) return null;
  const mk = (color: THREE.Color, opacity: number) => (
    <meshBasicMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
  );
  return (
    <>
      <mesh ref={a} position={[-9, 3, -12]} rotation={[0, 0, 0.32]}>
        <planeGeometry args={[2.4, 30]} />
        {mk(PULSE, 0.05)}
      </mesh>
      <mesh ref={b} position={[9, 5, -30]} rotation={[0, 0, -0.4]}>
        <planeGeometry args={[3, 36]} />
        {mk(BIO, 0.045)}
      </mesh>
      <mesh ref={c} position={[2, -4, -55]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[3.5, 40]} />
        {mk(PULSE, 0.04)}
      </mesh>
    </>
  );
}

/* ----------------------- traveling camera ------------------------- */

function TravelingCamera({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, pointer } = useThree();
  const progress = useRef(0);
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = progress.current;
    const px = reducedMotion ? 0 : pointer.x;
    const py = reducedMotion ? 0 : pointer.y;

    // dolly forward through the corridor + gentle weaving orbit
    const targetZ = 18 - p * 92;
    const targetX = Math.sin(p * Math.PI * 3) * 5.5 + px * 1.6 + Math.sin(t * 0.05) * 0.6;
    const targetY = 1.2 + Math.sin(p * Math.PI * 2) * 2.2 + py * 0.7 + Math.cos(t * 0.04) * 0.35;

    const s = 1 - Math.pow(0.015, delta);
    camera.position.x += (targetX - camera.position.x) * s;
    camera.position.y += (targetY - camera.position.y) * s;
    camera.position.z += (targetZ - camera.position.z) * s;

    // look ahead into the corridor, weaving
    _vec.set(
      Math.sin(p * Math.PI * 3 + 0.6) * 3,
      targetY * 0.4,
      targetZ - 14
    );
    look.current.lerp(_vec, s);
    camera.lookAt(look.current);
    // subtle cinematic roll
    camera.rotation.z += (Math.sin(p * Math.PI * 2) * 0.035 - camera.rotation.z) * s;
  });

  return null;
}

/* ----------------------------- scene ------------------------------ */

function Scene({
  quality,
  reducedMotion,
  dark,
}: {
  quality: number;
  reducedMotion: boolean;
  dark: boolean;
}) {
  return (
    <>
      <fog attach="fog" args={[dark ? "#02050c" : "#e7eff5", 10, dark ? 58 : 50]} />
      <ambientLight intensity={dark ? 0.6 : 1.1} />
      <pointLight position={[8, 6, 4]} intensity={40} color="#8fd0ff" distance={60} />
      <pointLight position={[-10, -4, -20]} intensity={30} color="#68D2DF" distance={70} />
      <pointLight position={[0, 4, -50]} intensity={35} color="#2f83d6" distance={80} />

      <TravelingCamera reducedMotion={reducedMotion} />
      <AmbientVolume quality={quality} />

      {/* Station A — hero cluster (z ~ 0) */}
      <DNAHelix quality={quality} position={[-6.4, 0.4, -3]} rotation={[0.12, 0, 0.26]} />
      <Virion position={[6.2, 1.8, -2.5]} scale={1.15} drift={1.1} color={PULSE} />
      <Virion position={[8.2, -2.4, -6]} scale={0.8} drift={0.8} color={BIO} />
      <Virion position={[4.2, -0.6, -8]} scale={0.55} drift={1.4} color={FROST} />
      <MolecularNetwork quality={quality} position={[0, 0.5, -10]} />
      <AlgeriaHologram quality={quality} position={[4.6, -3.4, -5]} />

      {/* Station B — capsules & vials (z ~ -26) */}
      <CapsuleField quality={quality} z={-26} />
      <VialCluster quality={quality} z={-24} />

      {/* Station C — holographic panels & hospital network (z ~ -46) */}
      <HoloPanels quality={quality} z={-46} />
      <HospitalNetwork quality={quality} z={-50} />

      {/* Station D — deep molecular lattice + second helix (z ~ -70) */}
      <MolecularLattice position={[-5, 1, -70]} />
      <DNAHelix quality={quality} position={[6, -1, -74]} rotation={[0.1, 0, -0.3]} height={14} colorA={PULSE} colorB={ROYAL} />
      <Virion position={[0, 3, -66]} scale={1.3} drift={0.9} color={PULSE} />
      <MolecularNetwork quality={quality} position={[3, -2, -80]} color={BIO} />

      <LightBeams />
      <Grid
        position={[0, -8, -30]}
        args={[120, 120]}
        cellSize={1.6}
        cellThickness={0.5}
        cellColor={dark ? "#0c2233" : "#c2d6e4"}
        sectionSize={8}
        sectionThickness={1}
        sectionColor={dark ? "#134a5c" : "#8fb3cc"}
        fadeDistance={70}
        fadeStrength={2}
        infiniteGrid
      />
    </>
  );
}

/* --------------------------- entry -------------------------------- */

export default function SceneBackdrop() {
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const [env, setEnv] = useState<{
    webgl: boolean;
    quality: number;
    reducedMotion: boolean;
  } | null>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      webgl = false;
    }
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isTablet = window.matchMedia("(max-width: 1200px)").matches;
    const lowCore = (navigator.hardwareConcurrency ?? 8) <= 4;
    const quality = isMobile || lowCore ? 0.5 : isTablet ? 0.72 : 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnv({ webgl, quality, reducedMotion });

    const onVis = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-abyss">
      {/* gradient fallback / base wash — flips with the theme */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: dark
            ? "radial-gradient(ellipse 70% 55% at 72% 22%, rgba(47,131,214,0.10), transparent 60%)," +
              "radial-gradient(ellipse 55% 45% at 20% 78%, rgba(104,210,223,0.08), transparent 60%)," +
              "linear-gradient(180deg, #050b17 0%, #02050c 100%)"
            : "radial-gradient(ellipse 70% 55% at 72% 22%, rgba(0,87,184,0.08), transparent 60%)," +
              "radial-gradient(ellipse 55% 45% at 20% 78%, rgba(8,112,132,0.07), transparent 60%)," +
              "linear-gradient(180deg, #f2f7fb 0%, #e7eff5 100%)",
        }}
      />
      {env?.webgl && (
        <Canvas
          className="absolute inset-0"
          style={{ opacity: dark ? 1 : 0.9 }}
          frameloop={active ? "always" : "never"}
          camera={{ position: [0, 1.2, 18], fov: 52, near: 0.1, far: 120 }}
          dpr={[1, env.quality < 1 ? 1.4 : 1.7]}
          gl={{ alpha: true, antialias: env.quality > 0.6, powerPreference: "high-performance" }}
          performance={{ min: 0.5 }}
        >
          <Scene quality={env.quality} reducedMotion={env.reducedMotion} dark={dark} />
        </Canvas>
      )}
      {/* legibility scrim — keeps foreground text crisp over the scene */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: dark
            ? "radial-gradient(ellipse 100% 60% at 50% 42%, transparent 40%, rgba(2,5,12,0.35) 100%)"
            : "radial-gradient(ellipse 100% 62% at 50% 42%, transparent 35%, rgba(244,248,251,0.55) 100%)",
        }}
      />
    </div>
  );
}

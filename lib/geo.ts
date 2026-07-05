/**
 * Stylized geographic data for the particle map visuals.
 * Coordinates are [longitude, latitude] pairs — simplified outlines,
 * intended for abstract holographic rendering, not cartography.
 */

export type LonLat = [number, number];

/** Simplified Algeria border polygon (clockwise from NW coast). */
export const ALGERIA_OUTLINE: LonLat[] = [
  [-2.06, 35.06], [-1.2, 35.75], [0.0, 35.95], [1.5, 36.55], [3.0, 36.8],
  [4.8, 36.9], [6.6, 37.05], [8.6, 36.9], [8.2, 36.5], [8.35, 35.2],
  [8.25, 34.65], [7.85, 34.0], [8.3, 33.0], [9.0, 32.1], [9.55, 30.2],
  [9.85, 29.4], [9.9, 27.8], [9.75, 26.5], [10.0, 25.35], [10.25, 24.6],
  [11.55, 24.3], [11.98, 23.52], [10.2, 22.8], [8.6, 21.6], [7.4, 20.5],
  [5.84, 19.44], [4.25, 19.15], [3.2, 19.75], [1.8, 20.3], [1.15, 21.1],
  [-0.5, 22.0], [-2.5, 23.4], [-4.83, 24.99], [-6.5, 26.1], [-8.67, 27.29],
  [-8.67, 28.71], [-7.0, 29.4], [-5.5, 29.9], [-4.8, 30.5], [-3.6, 31.1],
  [-2.9, 31.9], [-1.2, 32.08], [-1.45, 33.06], [-1.75, 34.4], [-2.2, 35.0],
];

/** Key Algerian cities / hospital hubs. */
export const ALGERIA_CITIES: { name: string; pos: LonLat }[] = [
  { name: "Algiers", pos: [3.06, 36.75] },
  { name: "Oran", pos: [-0.64, 35.7] },
  { name: "Constantine", pos: [6.61, 36.36] },
  { name: "Annaba", pos: [7.75, 36.9] },
  { name: "Sétif", pos: [5.41, 36.19] },
  { name: "Tlemcen", pos: [-1.31, 34.88] },
  { name: "Ouargla", pos: [5.33, 31.95] },
  { name: "Béchar", pos: [-2.22, 31.62] },
  { name: "Tamanrasset", pos: [5.52, 22.79] },
];

/** Regional expansion targets for the vision arcs (North Africa → MENA → Africa). */
export const REGION_TARGETS: { name: string; pos: LonLat; ring: 1 | 2 | 3 }[] = [
  { name: "Tunis", pos: [10.18, 36.8], ring: 1 },
  { name: "Tripoli", pos: [13.19, 32.88], ring: 1 },
  { name: "Rabat", pos: [-6.84, 34.02], ring: 1 },
  { name: "Nouakchott", pos: [-15.97, 18.08], ring: 2 },
  { name: "Cairo", pos: [31.24, 30.04], ring: 2 },
  { name: "Bamako", pos: [-8.0, 12.65], ring: 3 },
  { name: "Niamey", pos: [2.11, 13.51], ring: 3 },
  { name: "Dakar", pos: [-17.45, 14.7], ring: 3 },
];

/** Center used for projection (roughly Algeria's centroid). */
export const MAP_CENTER: LonLat = [2.6, 28.2];

/**
 * Equirectangular projection centered on MAP_CENTER.
 * Returns x/y in an abstract unit space (y up).
 */
export function projectLonLat(
  [lon, lat]: LonLat,
  scale = 1
): { x: number; y: number } {
  const x = (lon - MAP_CENTER[0]) * scale;
  const y = (lat - MAP_CENTER[1]) * scale;
  return { x, y };
}

/** Ray-casting point-in-polygon test. */
export function pointInPolygon([px, py]: LonLat, polygon: LonLat[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Deterministic PRNG (mulberry32) so particle layouts are stable across renders. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sample `count` points uniformly inside a polygon (rejection sampling). */
export function samplePointsInPolygon(
  polygon: LonLat[],
  count: number,
  seed = 7
): LonLat[] {
  const lons = polygon.map((p) => p[0]);
  const lats = polygon.map((p) => p[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const rand = seededRandom(seed);
  const points: LonLat[] = [];
  let guard = 0;
  while (points.length < count && guard < count * 60) {
    guard++;
    const p: LonLat = [
      minLon + rand() * (maxLon - minLon),
      minLat + rand() * (maxLat - minLat),
    ];
    if (pointInPolygon(p, polygon)) points.push(p);
  }
  return points;
}

/** Resample a polygon outline into `count` evenly spaced points. */
export function sampleOutline(polygon: LonLat[], count: number): LonLat[] {
  const closed = [...polygon, polygon[0]];
  const segLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < closed.length - 1; i++) {
    const dx = closed[i + 1][0] - closed[i][0];
    const dy = closed[i + 1][1] - closed[i][1];
    const len = Math.hypot(dx, dy);
    segLengths.push(len);
    total += len;
  }
  const points: LonLat[] = [];
  const step = total / count;
  let acc = 0;
  let seg = 0;
  for (let i = 0; i < count; i++) {
    const target = i * step;
    while (seg < segLengths.length - 1 && acc + segLengths[seg] < target) {
      acc += segLengths[seg];
      seg++;
    }
    const t = segLengths[seg] === 0 ? 0 : (target - acc) / segLengths[seg];
    const [x1, y1] = closed[seg];
    const [x2, y2] = closed[seg + 1];
    points.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return points;
}

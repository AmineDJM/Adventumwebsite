/**
 * Stage model for the animated HIV replication-cycle module (MyPathology).
 * Purely educational: it describes the biology and the therapeutic CLASS that
 * acts at each step. No products, no company data — no approval/availability
 * claim is made anywhere.
 *
 * `el` values (0..1) drive element opacity/scale; the component lerps the
 * live scene toward the active stage's values every frame.
 */

export type CycleElements = {
  virion: number; // free virion approaching the cell
  fusion: number; // membrane fusion glow
  rna: number; // single-strand viral RNA in cytoplasm
  dna: number; // reverse-transcribed viral DNA (double strand)
  integrated: number; // viral DNA spliced into host genome (nucleus)
  newRna: number; // new viral RNA transcripts leaving the nucleus
  proteins: number; // viral proteins assembling at the membrane
  budVirion: number; // immature virion budding off
  mature: number; // mature conical capsid forming
};

export type CycleStage = {
  key: string;
  titleKey: string;
  descKey: string;
  /** therapeutic class acting here (i18n key) or null */
  targetKey: string | null;
  cam: [number, number, number];
  look: [number, number, number];
  el: CycleElements;
};

const ZERO: CycleElements = {
  virion: 0, fusion: 0, rna: 0, dna: 0, integrated: 0,
  newRna: 0, proteins: 0, budVirion: 0, mature: 0,
};

export const CYCLE_STAGES: CycleStage[] = [
  {
    key: "attachment",
    titleKey: "cycle.s0_title",
    descKey: "cycle.s0_desc",
    targetKey: "cycle.s0_target",
    cam: [0, 0.4, 8.5],
    look: [0, 0, 0],
    el: { ...ZERO, virion: 1 },
  },
  {
    key: "fusion",
    titleKey: "cycle.s1_title",
    descKey: "cycle.s1_desc",
    targetKey: null,
    cam: [1.6, 0.3, 7],
    look: [1, 0, 0],
    el: { ...ZERO, virion: 0.4, fusion: 1, rna: 1 },
  },
  {
    key: "reverse_transcription",
    titleKey: "cycle.s2_title",
    descKey: "cycle.s2_desc",
    targetKey: "cycle.s2_target",
    cam: [1.8, 0.2, 6],
    look: [1.2, 0, 0],
    el: { ...ZERO, rna: 0.5, dna: 1 },
  },
  {
    key: "integration",
    titleKey: "cycle.s3_title",
    descKey: "cycle.s3_desc",
    targetKey: "cycle.s3_target",
    cam: [2.4, 0.6, 5.2],
    look: [2.4, 0.3, 0],
    el: { ...ZERO, dna: 0.3, integrated: 1 },
  },
  {
    key: "transcription",
    titleKey: "cycle.s4_title",
    descKey: "cycle.s4_desc",
    targetKey: null,
    cam: [1.4, 0.5, 6],
    look: [1.6, 0.2, 0],
    el: { ...ZERO, integrated: 0.6, newRna: 1 },
  },
  {
    key: "assembly",
    titleKey: "cycle.s5_title",
    descKey: "cycle.s5_desc",
    targetKey: null,
    cam: [-1.2, 0.4, 6.5],
    look: [-1.4, 0, 0],
    el: { ...ZERO, newRna: 0.4, proteins: 1 },
  },
  {
    key: "budding",
    titleKey: "cycle.s6_title",
    descKey: "cycle.s6_desc",
    targetKey: null,
    cam: [-2.4, 0.6, 6.4],
    look: [-2.4, 0.3, 0],
    el: { ...ZERO, proteins: 0.3, budVirion: 1 },
  },
  {
    key: "maturation",
    titleKey: "cycle.s7_title",
    descKey: "cycle.s7_desc",
    targetKey: "cycle.s7_target",
    cam: [-3, 0.5, 5.6],
    look: [-3.2, 0.2, 0],
    el: { ...ZERO, budVirion: 0.5, mature: 1 },
  },
];

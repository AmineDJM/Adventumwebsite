/**
 * Data model for the interactive "Infection Intelligence" explorer.
 * Content is educational only — it describes the biology and the
 * therapeutic CLASS that acts on each target. No products, no company
 * data. All display strings are i18n keys resolved via t().
 */

export type PathogenKey = "hiv" | "hepatitis" | "bacteria" | "fungus";

export type Hotspot = {
  id: string;
  /** position on the unit model (model space) */
  pos: [number, number, number];
  labelKey: string;
  descKey: string;
};

export type Pathogen = {
  key: PathogenKey;
  nameKey: string;
  tagKey: string;
  overviewKey: string;
  /** hex accent used for this pathogen in the 3D + UI */
  accent: string;
  hotspots: Hotspot[];
};

export const PATHOGENS: Pathogen[] = [
  {
    key: "hiv",
    nameKey: "lab.hiv_name",
    tagKey: "lab.hiv_tag",
    overviewKey: "lab.hiv_overview",
    accent: "#68D2DF",
    hotspots: [
      { id: "env", pos: [0, 1.85, 0], labelKey: "lab.hiv_env_label", descKey: "lab.hiv_env_desc" },
      { id: "rt", pos: [-1.15, 0.2, 0.9], labelKey: "lab.hiv_rt_label", descKey: "lab.hiv_rt_desc" },
      { id: "in", pos: [1.2, -0.1, 0.7], labelKey: "lab.hiv_in_label", descKey: "lab.hiv_in_desc" },
      { id: "pr", pos: [0.15, -1.55, 0.5], labelKey: "lab.hiv_pr_label", descKey: "lab.hiv_pr_desc" },
    ],
  },
  {
    key: "hepatitis",
    nameKey: "lab.hep_name",
    tagKey: "lab.hep_tag",
    overviewKey: "lab.hep_overview",
    accent: "#2f83d6",
    hotspots: [
      { id: "surface", pos: [0, 1.7, 0.4], labelKey: "lab.hep_surface_label", descKey: "lab.hep_surface_desc" },
      { id: "pol", pos: [0.9, -0.6, 1.0], labelKey: "lab.hep_pol_label", descKey: "lab.hep_pol_desc" },
    ],
  },
  {
    key: "bacteria",
    nameKey: "lab.bac_name",
    tagKey: "lab.bac_tag",
    overviewKey: "lab.bac_overview",
    accent: "#82C341",
    hotspots: [
      { id: "wall", pos: [1.4, 0.9, 0.2], labelKey: "lab.bac_wall_label", descKey: "lab.bac_wall_desc" },
      { id: "ribo", pos: [-0.4, 0.1, 1.0], labelKey: "lab.bac_ribo_label", descKey: "lab.bac_ribo_desc" },
    ],
  },
  {
    key: "fungus",
    nameKey: "lab.fun_name",
    tagKey: "lab.fun_tag",
    overviewKey: "lab.fun_overview",
    accent: "#9BB4C9",
    hotspots: [
      { id: "membrane", pos: [1.35, 1.1, 0.3], labelKey: "lab.fun_membrane_label", descKey: "lab.fun_membrane_desc" },
      { id: "bud", pos: [1.5, -1.0, 0.2], labelKey: "lab.fun_bud_label", descKey: "lab.fun_bud_desc" },
    ],
  },
];

export const PATHOGEN_KEYS = PATHOGENS.map((p) => p.key);

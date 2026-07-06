import en, { type Dict } from "./en";
import fr from "./fr";
import hi from "./hi";
import zh from "./zh";
import type { Locale } from "@/lib/i18n/config";

export type { Dict };

// Each locale is merged over English so any missing key falls back gracefully.
export const dictionaries: Record<Locale, Dict> = {
  en,
  fr: { ...en, ...fr },
  hi: { ...en, ...hi },
  zh: { ...en, ...zh },
};

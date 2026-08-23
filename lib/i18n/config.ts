export const LOCALES = ["en", "fr", "hi", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

// French is the server-rendered default: it is the professional language of
// the Algerian market and the language of the search queries that matter
// most ("laboratoire pharmaceutique algérien", …). Browsers preferring
// EN/HI/ZH are switched client-side by detectLocale().
export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_META: Record<
  Locale,
  { label: string; native: string; short: string; dir: "ltr" | "rtl" }
> = {
  en: { label: "English", native: "English", short: "EN", dir: "ltr" },
  fr: { label: "French", native: "Français", short: "FR", dir: "ltr" },
  hi: { label: "Hindi", native: "हिन्दी", short: "HI", dir: "ltr" },
  zh: { label: "Chinese", native: "中文", short: "中文", dir: "ltr" },
};

/** Pick the best initial locale from the browser preference. */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const l of langs) {
    const base = l.toLowerCase().split("-")[0];
    if ((LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return DEFAULT_LOCALE;
}

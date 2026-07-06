export const LOCALES = ["en", "fr", "hi", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

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

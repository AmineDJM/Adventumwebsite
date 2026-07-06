"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  detectLocale,
  LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

type I18nState = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const STORAGE_KEY = "adventum-locale";
const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let initial: Locale = DEFAULT_LOCALE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (LOCALES as readonly string[]).includes(stored)) {
        initial = stored as Locale;
      } else {
        initial = detectLocale();
      }
    } catch {
      initial = detectLocale();
    }
    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const active = dictionaries[locale] as Record<string, string>;
      const en = dictionaries.en as Record<string, string>;
      return active[key] ?? en[key] ?? key;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback to English so components render outside the provider.
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string) =>
        (dictionaries.en as Record<string, string>)[key] ?? key,
    };
  }
  return ctx;
}

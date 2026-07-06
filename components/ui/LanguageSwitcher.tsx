"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/components/providers/I18nProvider";
import { LOCALES, LOCALE_META } from "@/lib/i18n/config";
import { EASE } from "@/lib/anim";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        className="group flex h-9 items-center gap-1.5 rounded-full border border-hairline/10 bg-surface/[0.04] px-3 backdrop-blur-md transition-all duration-500 ease-premium hover:border-pulse/40 hover:bg-surface/[0.07]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 text-silver transition-colors duration-300 group-hover:text-frost"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
        <span className="font-mono text-[0.68rem] font-medium tracking-wide text-silver transition-colors duration-300 group-hover:text-frost">
          {LOCALE_META[locale].short}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="absolute right-0 top-11 z-50 min-w-[9rem] overflow-hidden rounded-2xl glass-strong p-1.5 card-shadow"
          >
            {LOCALES.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors duration-300 ${
                    l === locale
                      ? "bg-surface/[0.06] text-frost"
                      : "text-silver hover:bg-surface/[0.05] hover:text-frost"
                  }`}
                >
                  <span>{LOCALE_META[l].native}</span>
                  <span className="font-mono text-[0.6rem] tracking-widest text-muted">
                    {LOCALE_META[l].short}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

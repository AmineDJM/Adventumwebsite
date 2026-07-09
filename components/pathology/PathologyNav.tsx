"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EASE } from "@/lib/anim";
import AdventumMark from "@/components/ui/AdventumMark";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/components/providers/I18nProvider";

export default function PathologyNav() {
  const { t } = useI18n();
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: EASE, delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-hairline/[0.06] bg-abyss/70 backdrop-blur-2xl"
    >
      <nav className="shell flex h-[72px] items-center justify-between">
        <Link href="/" className="group flex items-center gap-3" aria-label="Adventum Pharma — home">
          <span className="relative flex h-9 w-9 items-center justify-center">
            <AdventumMark id="path-mark" className="h-9 w-9" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.05rem] font-semibold tracking-[0.18em] text-frost">
              ADVENTUM
            </span>
            <span className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.5em] text-bio/90">
              MyPathology
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-full border border-hairline/12 px-4 py-2 text-[0.8rem] font-medium text-silver transition-all duration-500 ease-premium hover:border-pulse/40 hover:text-frost sm:inline-flex"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("path.back")}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  );
}

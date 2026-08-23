"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/lib/anim";
import { scrollToSection, getLenis } from "@/components/providers/SmoothScroll";
import AdventumMark from "@/components/ui/AdventumMark";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/components/providers/I18nProvider";

const LINKS = [
  { key: "nav.home", href: "#home" },
  { key: "nav.infectiology", href: "#infectiology" },
  { key: "nav.platform", href: "#platform" },
  { key: "nav.regulatory", href: "#regulatory" },
  { key: "nav.partnerships", href: "#partnerships" },
  { key: "nav.vision", href: "#vision" },
  { key: "nav.contact", href: "#contact" },
] as const;

function Logo() {
  return (
    <a
      href="#home"
      onClick={(e) => {
        e.preventDefault();
        scrollToSection("#home");
      }}
      className="group flex items-center gap-3"
      aria-label="Adventum Pharma — home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center">
        <AdventumMark id="nav-mark" className="h-9 w-9" />
        <span className="absolute inset-0 rounded-xl bg-pulse/25 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] font-semibold tracking-[0.18em] text-frost">
          ADVENTUM
        </span>
        <span className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.5em] text-bio/90">
          Pharma
        </span>
      </span>
    </a>
  );
}

export default function Navbar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = LINKS.map((l) =>
      document.querySelector(l.href)
    ).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Lock background scrolling (Lenis + native) while the mobile menu is open.
  // Locking <html> overflow stops native window scrolling; stopping Lenis
  // prevents it from re-driving scroll while the overlay is up.
  useEffect(() => {
    const root = document.documentElement;
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      root.style.overflow = "hidden";
    } else {
      lenis?.start();
      root.style.overflow = "";
    }
    return () => {
      getLenis()?.start();
      root.style.overflow = "";
    };
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToSection(href);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 0.4 }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ease-premium ${
          scrolled
            ? "border-b border-hairline/[0.06] bg-abyss/70 backdrop-blur-2xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="shell flex h-[72px] items-center justify-between">
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={go(link.href)}
                  className={`relative rounded-full px-4 py-2 text-[0.82rem] font-medium tracking-wide transition-colors duration-400 ${
                    active === link.href
                      ? "border border-hairline/10 bg-surface/[0.05] text-frost"
                      : "border border-transparent text-silver/80 hover:text-frost"
                  }`}
                >
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <a
              href="#contact"
              onClick={go("#contact")}
              className="inline-flex items-center gap-2 rounded-full border border-bio/30 bg-bio/[0.08] px-5 py-2.5 text-[0.8rem] font-semibold tracking-wide text-bio transition-all duration-500 ease-premium hover:border-bio/60 hover:bg-bio/[0.14] hover:shadow-[0_0_30px_-8px_rgba(104,210,223,0.5)]"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bio opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bio" />
              </span>
              {t("nav.partner")}
            </a>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full border border-hairline/10 bg-surface/[0.04] backdrop-blur-md"
            >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 top-0 h-px w-full bg-frost transition-all duration-400 ease-premium ${
                  open ? "top-1/2 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-px w-full bg-frost transition-all duration-400 ease-premium ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-full bg-frost transition-all duration-400 ease-premium ${
                  open ? "bottom-1/2 -rotate-45" : ""
                }`}
              />
            </span>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-abyss/95 backdrop-blur-2xl lg:hidden"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-grid-faint opacity-40"
            />
            <ul className="shell relative space-y-2">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.06 * i }}
                >
                  <a
                    href={link.href}
                    onClick={go(link.href)}
                    className={`flex items-baseline gap-4 py-2 font-display text-3xl font-medium ${
                      active === link.href ? "text-gradient-bio" : "text-frost"
                    }`}
                  >
                    <span className="font-mono text-xs text-pulse/60">
                      0{i + 1}
                    </span>
                    {t(link.key)}
                  </a>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
                className="pt-8"
              >
                <a
                  href="#contact"
                  onClick={go("#contact")}
                  className="inline-flex items-center gap-2 rounded-full border border-bio/40 bg-bio/10 px-6 py-3 text-sm font-semibold text-bio"
                >
                  {t("nav.partner")}
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

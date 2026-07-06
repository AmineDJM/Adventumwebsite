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

type ThemeChoice = "light" | "dark" | "system";
type Resolved = "light" | "dark";

type ThemeState = {
  choice: ThemeChoice;
  /** Actual theme in effect (system resolved to light/dark). */
  resolved: Resolved;
  setChoice: (c: ThemeChoice) => void;
  toggle: () => void;
};

const STORAGE_KEY = "adventum-theme";
const ThemeContext = createContext<ThemeState | null>(null);

function systemResolved(): Resolved {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [resolved, setResolved] = useState<Resolved>("dark");

  // hydrate from storage + system
  useEffect(() => {
    let stored: ThemeChoice = "system";
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "light" || s === "dark" || s === "system") stored = s;
    } catch {
      /* ignore */
    }
    setChoiceState(stored);
    setResolved(stored === "system" ? systemResolved() : stored);
    apply(stored);
  }, []);

  // follow system changes while in "system" mode
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const setChoice = useCallback((c: ThemeChoice) => {
    setChoiceState(c);
    setResolved(c === "system" ? systemResolved() : c);
    apply(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setChoice(resolved === "dark" ? "light" : "dark");
  }, [resolved, setChoice]);

  const value = useMemo(
    () => ({ choice, resolved, setChoice, toggle }),
    [choice, resolved, setChoice, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback so components can render outside the provider (e.g. tests).
    return {
      choice: "system",
      resolved: "dark",
      setChoice: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}

/** Inline script string that sets the theme before first paint (no FOUC). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

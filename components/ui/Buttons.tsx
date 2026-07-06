"use client";

import type { ReactNode, MouseEventHandler } from "react";
import { scrollToSection } from "@/components/providers/SmoothScroll";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  className?: string;
  type?: "button" | "submit";
};

function useAnchorHandler(href?: string) {
  return (e: React.MouseEvent) => {
    if (href?.startsWith("#")) {
      e.preventDefault();
      scrollToSection(href);
    }
  };
}

/** Solid luminous CTA — gradient core, soft outer glow, sweep on hover. */
export function PrimaryButton({
  children,
  href,
  onClick,
  className = "",
  type = "button",
}: ButtonProps) {
  const anchor = useAnchorHandler(href);
  const cls = `group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-bio-dim via-bio to-pulse px-8 py-[0.95rem] text-sm font-semibold tracking-wide text-abyss transition-all duration-500 ease-premium hover:shadow-[0_0_50px_-10px_rgba(31,196,221,0.6)] hover:brightness-110 ${className}`;

  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      <svg
        className="relative z-10 h-4 w-4 transition-transform duration-500 ease-premium group-hover:translate-x-1"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path
          d="M3 8h10m0 0L9 4m4 4l-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-premium group-hover:translate-x-full"
      />
    </>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick ?? anchor} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Quiet glass CTA — hairline border that warms on hover. */
export function GhostButton({
  children,
  href,
  onClick,
  className = "",
  type = "button",
}: ButtonProps) {
  const anchor = useAnchorHandler(href);
  const cls = `group relative inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-8 py-[0.95rem] text-sm font-medium tracking-wide text-frost backdrop-blur-md transition-all duration-500 ease-premium hover:border-pulse/40 hover:bg-pulse/[0.06] hover:text-pulse ${className}`;

  const inner = (
    <>
      <span>{children}</span>
      <svg
        className="h-4 w-4 opacity-60 transition-all duration-500 ease-premium group-hover:translate-x-1 group-hover:opacity-100"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path
          d="M3 8h10m0 0L9 4m4 4l-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick ?? anchor} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

type AdventumMarkProps = {
  /** Unique id prefix so multiple instances don't share gradient defs */
  id: string;
  className?: string;
};

/**
 * Adventum Pharma brand mark — the cluster of overlapping rounded squares
 * in the corporate blue → teal gradient, rebuilt as crisp vector so it
 * scales and sits cleanly on the dark theme.
 */
export default function AdventumMark({ id, className = "" }: AdventumMarkProps) {
  const blue = `url(#${id}-blue)`;
  const teal = `url(#${id}-teal)`;
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-blue`} x1="6" y1="10" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2f83d6" />
          <stop offset="0.55" stopColor="#0057B8" />
          <stop offset="1" stopColor="#004a9e" />
        </linearGradient>
        <linearGradient id={`${id}-teal`} x1="2" y1="2" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#68D2DF" />
          <stop offset="1" stopColor="#087084" />
        </linearGradient>
      </defs>
      {/* small teal accent — top left */}
      <rect x="2.5" y="3.5" width="10" height="10" rx="3" fill={teal} opacity="0.95" />
      {/* medium square — upper right */}
      <rect x="26" y="6" width="16" height="16" rx="4.5" fill={blue} opacity="0.95" />
      {/* main square */}
      <rect x="8.5" y="16.5" width="26.5" height="26.5" rx="6.5" fill={blue} />
      {/* small teal accent — lower right */}
      <rect x="33" y="33" width="9" height="9" rx="2.6" fill={teal} opacity="0.95" />
    </svg>
  );
}

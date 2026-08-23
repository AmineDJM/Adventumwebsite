/**
 * Global ambient backdrop — pure CSS, zero JavaScript.
 *
 * Replaces the former WebGL scene: a calm, professional atmosphere made of
 * a few large brand-colored glows and an ultra-faint blueprint grid. Works
 * in both themes through the color tokens and costs nothing at runtime.
 */
export default function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {/* soft brand glows */}
      <div className="absolute -top-[20%] left-1/2 h-[42rem] w-[64rem] -translate-x-1/2 rounded-full bg-pulse/[0.06] blur-3xl" />
      <div className="absolute right-[-14%] top-[28%] h-[34rem] w-[34rem] rounded-full bg-bio/[0.045] blur-3xl" />
      <div className="absolute bottom-[-12%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-pulse/[0.04] blur-3xl" />

      {/* faint blueprint grid, fading out toward the bottom */}
      <div
        className="absolute inset-x-0 top-0 h-[120vh] bg-grid-faint opacity-60"
        style={{
          maskImage:
            "linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 45%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 45%, transparent 100%)",
        }}
      />

      {/* top edge light */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pulse/20 to-transparent" />
    </div>
  );
}

import { parseHighlight } from "@/lib/i18n/highlight";

type SectionHeadingProps = {
  eyebrow: string;
  /** Title, optionally with ⟦…⟧ around the words to gradient (any language). */
  title: string;
  /** Legacy word list — used only if the title has no ⟦…⟧ markers. */
  highlight?: string[];
  sub?: string;
  align?: "left" | "center";
  className?: string;
};

/**
 * Section header with numbered eyebrow, gradient-highlighted headline and a
 * quiet supporting paragraph. Rendered as plain, always-visible text — the
 * headline is real content for crawlers and can never be stuck hidden by a
 * missed reveal animation.
 */
export default function SectionHeading({
  eyebrow,
  title,
  highlight = [],
  sub,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const isCenter = align === "center";

  // Marker-based highlight (locale-agnostic); fall back to the legacy word list.
  const hasMarkers = title.includes("⟦");
  const tokens = parseHighlight(title).map((tk) => {
    if (hasMarkers || !highlight.length) return tk;
    return { ...tk, hl: highlight.includes(tk.word.replace(/[.,]/g, "")) };
  });

  // Merge consecutive tokens of the same kind into segments so the markup
  // stays minimal and words wrap naturally.
  const segments: { text: string; hl: boolean }[] = [];
  for (const tk of tokens) {
    const last = segments[segments.length - 1];
    const hl = tk.word.trim() === "" ? (last?.hl ?? false) : tk.hl;
    if (last && last.hl === hl) last.text += tk.word;
    else segments.push({ text: tk.word, hl });
  }

  return (
    <div
      className={`${isCenter ? "mx-auto text-center" : ""} max-w-3xl ${className}`}
    >
      <p
        className={`eyebrow mb-6 flex items-center gap-3 ${
          isCenter ? "justify-center" : ""
        }`}
      >
        <span className="inline-block h-px w-8 bg-gradient-to-r from-pulse/80 to-transparent" />
        {eyebrow}
      </p>

      <h2 className="font-display text-display-lg font-medium text-frost">
        {segments.map((seg, i) =>
          seg.hl ? (
            <span key={i} className="text-gradient-bio">
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </h2>

      {sub && (
        <p
          className={`mt-6 text-base leading-relaxed text-silver md:text-lg ${
            isCenter ? "mx-auto" : ""
          } max-w-2xl`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

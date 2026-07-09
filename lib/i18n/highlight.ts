/**
 * Locale-agnostic headline highlighting.
 *
 * A translated title may wrap the word(s) that should receive the luminous
 * gradient in the marker ⟦…⟧, e.g. "Advancing ⟦Infectious Disease⟧ Care".
 * This splits the string into word tokens carrying an `hl` flag, so the
 * per-word reveal animation still works while the marked span is gradiented
 * — in every language, without relying on English word matching.
 */

export type HlToken = { word: string; hl: boolean };

const OPEN = "⟦"; // ⟦
const CLOSE = "⟧"; // ⟧

export function parseHighlight(title: string): HlToken[] {
  const tokens: HlToken[] = [];
  // Split into highlighted / plain segments by the markers.
  const segments: { text: string; hl: boolean }[] = [];
  let rest = title;
  while (rest.length) {
    const open = rest.indexOf(OPEN);
    if (open === -1) {
      segments.push({ text: rest, hl: false });
      break;
    }
    if (open > 0) segments.push({ text: rest.slice(0, open), hl: false });
    const close = rest.indexOf(CLOSE, open + 1);
    if (close === -1) {
      // unbalanced marker — treat remainder as highlighted
      segments.push({ text: rest.slice(open + 1), hl: true });
      break;
    }
    segments.push({ text: rest.slice(open + 1, close), hl: true });
    rest = rest.slice(close + 1);
  }

  // Split each segment into words while keeping the spaces attached, so the
  // reveal stagger renders one token per word.
  for (const seg of segments) {
    const parts = seg.text.split(/(\s+)/); // keep whitespace tokens
    for (const p of parts) {
      if (p === "") continue;
      tokens.push({ word: p, hl: seg.hl && p.trim().length > 0 });
    }
  }
  return tokens;
}

/** Strip markers to get the plain title (for aria-label / SEO). */
export function plainTitle(title: string): string {
  return title.split(OPEN).join("").split(CLOSE).join("");
}

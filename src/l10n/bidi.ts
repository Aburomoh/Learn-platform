/**
 * Bidi isolation for Arabic supportive text (ADR-0011 §5). Inside Arabic prose, every maximal run
 * of Latin letters, digits, operators and notation (`A + B`, `Q(t+1)`, `(26)_10`, `T1 → T4`,
 * `110`) is one left-to-right run, so neither its operators nor its digits reorder. Trailing
 * sentence punctuation (`.` `,` `:` `;`) stays with the Arabic.
 */

export type BidiRun = { ltr: string } | { rtl: string };

/** One LTR run: starts and ends on a letter, digit, bracket or prime; may hold operators, spaces, notation and the list dot (`A · B`, #705) inside. */
const LTR_RUN = /[A-Za-z0-9(\[][A-Za-z0-9 _^'′()\[\]{}+\-−×÷*\/=.,:→←↔⊕<>≤≥%·]*[A-Za-z0-9)\]'′]|[A-Za-z0-9]/g;

/** Splits text into alternating Arabic (rtl) and isolated LTR runs, in order. Empty runs are dropped. */
export function splitBidi(text: string): BidiRun[] {
  const runs: BidiRun[] = [];
  let last = 0;
  for (const m of text.matchAll(LTR_RUN)) {
    const raw = m[0];
    const start = m.index;
    if (start > last) runs.push({ rtl: text.slice(last, start) });
    runs.push({ ltr: raw });
    last = start + raw.length;
  }
  if (last < text.length) runs.push({ rtl: text.slice(last) });
  return runs;
}

/** True when the text holds Arabic letters (the translation came back Arabic, not an English fallback). */
export function isArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

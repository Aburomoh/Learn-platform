/**
 * Bidi isolation for Arabic supportive text (ADR-0011 §5). Inside Arabic prose, every maximal run
 * of Latin letters, digits, operators and notation (`A + B`, `Q(t+1)`, `(26)_10`, `T1 → T4`,
 * `110`) is one left-to-right run, so neither its operators nor its digits reorder. Trailing
 * sentence punctuation (`.` `,` `:` `;`) stays with the Arabic.
 */

export type BidiRun = { ltr: string } | { rtl: string };

/** One LTR run: starts and ends on a letter, digit, bracket or prime; may hold operators, spaces, notation and the list dot (`A · B`, #705) inside. */
const LTR_RUN = /[A-Za-z0-9(\[][A-Za-z0-9 _^'′()\[\]{}+\-−×÷*\/=.,:→←↔⊕<>≤≥%·]*[A-Za-z0-9)\]'′]|[A-Za-z0-9]/g;

const OPEN: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const CLOSE: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

/**
 * A bracket whose partner lies outside the run belongs to the Arabic around it (#720): inside an
 * LTR isolate a bracket is not mirrored, so «(0 أو 1)» split as «(0» + «1)» faced outward. Only
 * pairs that close inside the run stay isolated; an unmatched leading opener or trailing closer
 * (and any space next to it) is given back to the RTL text.
 */
function trimUnpaired(raw: string): { lead: string; run: string; trail: string } {
  let run = raw;
  let lead = "";
  let trail = "";
  for (;;) {
    const first = run[0];
    if (first in OPEN && !balanced(run, first, OPEN[first])) {
      const cut = run.slice(1).match(/^\s*/)![0].length + 1;
      lead += run.slice(0, cut);
      run = run.slice(cut);
      continue;
    }
    const lastCh = run[run.length - 1];
    if (lastCh in CLOSE && !balanced(run, CLOSE[lastCh], lastCh)) {
      const cut = run.match(/\s*.$/)![0].length;
      trail = run.slice(run.length - cut) + trail;
      run = run.slice(0, run.length - cut);
      continue;
    }
    return { lead, run, trail };
  }
}

/** True when every `open` in the run has its `close` inside the run (and the other way round). */
function balanced(run: string, open: string, close: string): boolean {
  let depth = 0;
  for (const ch of run) {
    if (ch === open) depth += 1;
    else if (ch === close) {
      if (depth === 0) return false;
      depth -= 1;
    }
  }
  return depth === 0;
}

/** Splits text into alternating Arabic (rtl) and isolated LTR runs, in order. Empty runs are dropped. */
export function splitBidi(text: string): BidiRun[] {
  const runs: BidiRun[] = [];
  const pushRtl = (s: string) => {
    if (!s) return;
    const prev = runs[runs.length - 1];
    if (prev && "rtl" in prev) prev.rtl += s;
    else runs.push({ rtl: s });
  };
  let last = 0;
  for (const m of text.matchAll(LTR_RUN)) {
    const start = m.index;
    pushRtl(text.slice(last, start));
    const { lead, run, trail } = trimUnpaired(m[0]);
    pushRtl(lead);
    // a lone bracket or operator left over goes with the Arabic too
    if (/[A-Za-z0-9]/.test(run)) runs.push({ ltr: run });
    else pushRtl(run);
    pushRtl(trail);
    last = start + m[0].length;
  }
  pushRtl(text.slice(last));
  return runs;
}

/** True when the text holds Arabic letters (the translation came back Arabic, not an English fallback). */
export function isArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

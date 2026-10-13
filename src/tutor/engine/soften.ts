/**
 * A hint's leading verdict, softened when there was nothing to judge (#717). Rung-2 nudges begin
 * "Not yet." / "Not quite." / "Not that one.": true after a Check, but "I'm stuck" and a Hint after an unchecked edit
 * are answered before any answer was marked, and a verdict on unchecked work reads as a correction.
 * One presentation rule, so the approved strings stay untouched. Pure; English and Arabic.
 */
const VERDICT = /^(?:Not yet|Not quite|Not that one)\.\s+/;
const VERDICT_AR = /^(?:ليس بعد|ليس تماماً|ليس تماما|ليس هذا)\.\s+/;

// "once more" assumes a previous try (the division nudge): dropped with the verdict, so no string has to change
const ONCE_MORE = /\s+once more,(?=\s+carefully)/;
const ONCE_MORE_AR = /\s+مرة أخرى،(?=\s+بدقة)/;

export function softenNudge(text: string): string {
  const out = text.replace(VERDICT, "").replace(VERDICT_AR, "").replace(ONCE_MORE, "").replace(ONCE_MORE_AR, "");
  if (out === text) return text;
  return out.charAt(0).toUpperCase() + out.slice(1);
}

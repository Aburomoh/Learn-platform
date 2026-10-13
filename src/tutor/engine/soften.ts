/**
 * A hint's leading verdict, softened when there was nothing to judge (#717). Rung-2 nudges begin
 * "Not yet." / "Not quite.": true after a Check, but "I'm stuck" and a Hint after an unchecked edit
 * are answered before any answer was marked, and a verdict on unchecked work reads as a correction.
 * One presentation rule, so the approved strings stay untouched. Pure; English and Arabic.
 */
const VERDICT = /^(?:Not yet|Not quite)\.\s+/;
const VERDICT_AR = /^(?:ليس بعد|ليس تماماً|ليس تماما)\.\s+/;

export function softenNudge(text: string): string {
  const out = text.replace(VERDICT, "").replace(VERDICT_AR, "");
  if (out === text) return text;
  return out.charAt(0).toUpperCase() + out.slice(1);
}

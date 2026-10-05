/**
 * Base notation in authored text (#55). Content and catalog strings write a number's base as a
 * token, `(26)_10` or `35_16`, never with Unicode subscript digits (screen readers read those
 * inconsistently and fallback fonts may lack them). The UI renders the token with real `<sub>`
 * markup and reads it as "26 base 10".
 *
 * Powers (#409) are a token too: `10^2`, `10^−2` (true minus or ASCII `-`) or `2^n`, rendered with
 * `<sup>` and read as "10 to the power minus 2". Boolean expressions use `'` and `⊕`, never `^`.
 */

/** `(value)_base` or `value_base`, base 2, 8, 10 or 16. Runs on text after template slots are filled. */
const BASE_TOKEN = /(\()?([0-9A-Fa-f][0-9A-Fa-f.]*)(\))?_(2|8|10|16)(?![0-9A-Za-z_])/;
/** `base^exp`: a whole-number base, an integer exponent (optional minus) or a one-letter one like `n`. */
const POWER_TOKEN = /(?<![0-9A-Za-z_.])(\d+)\^([−-]?)(\d+|[a-z])(?![0-9A-Za-z_])/;
const TOKEN = new RegExp(`${BASE_TOKEN.source}|${POWER_TOKEN.source}`, "g");

export type BasePart = { value: string; base: string; parens: boolean; raw: string; start: number };
/** A power; `exp` is normalised to a true minus (U+2212) when negative. */
export type PowerPart = { power: string; exp: string; raw: string; start: number };
export type NotationPart = { text: string } | BasePart | PowerPart;

/** "10 to the power minus 2". */
export function readPower(p: PowerPart): string {
  return `${p.power} to the power ${p.exp.replace("−", "minus ")}`;
}

/** Splits text into plain runs and base-notation tokens, in order. */
export function splitNotation(text: string): NotationPart[] {
  const parts: NotationPart[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    let [raw] = m;
    const [, open, value, close, base, power, minus, exp] = m;
    let start = m.index;
    if (power !== undefined) {
      if (start > last) parts.push({ text: text.slice(last, start) });
      parts.push({ power, exp: `${minus ? "−" : ""}${exp}`, raw, start });
      last = start + raw.length;
      continue;
    }
    // parentheses belong to the token only as a pair
    if (close !== undefined && open === undefined) continue;
    if (open !== undefined && close === undefined) {
      // "(26_10": the bracket is ordinary text and the token starts after it
      start += 1;
      raw = raw.slice(1);
    }
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ value, base, parens: open !== undefined && close !== undefined, raw, start });
    last = start + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** The text as it should be read aloud: "(26)_10" becomes "26 base 10", "10^−2" "10 to the power minus 2". */
export function plainNotation(text: string): string {
  return splitNotation(text)
    .map((p) => ("text" in p ? p.text : "power" in p ? readPower(p) : `${p.value} base ${p.base}`))
    .join("");
}

/**
 * For text revealed a character at a time: how many characters to show so that a token is never
 * cut in half (which would flash the raw `_10` or `^`). A cut inside a token extends to its end.
 */
export function snapToToken(text: string, shown: number): number {
  for (const p of splitNotation(text)) {
    if ("text" in p) continue;
    const end = p.start + p.raw.length;
    if (shown > p.start && shown < end) return end;
  }
  return shown;
}

/** True when text still uses Unicode subscript digits (U+2080–U+2089). */
export function hasUnicodeSubscript(text: string): boolean {
  return /[₀-₉]/.test(text);
}

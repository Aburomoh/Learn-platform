/**
 * Base notation in authored text (#55). Content and catalog strings write a number's base as a
 * token, `(26)_10` or `35_16`, never with Unicode subscript digits (screen readers read those
 * inconsistently and fallback fonts may lack them). The UI renders the token with real `<sub>`
 * markup and reads it as "26 base 10".
 */

/** `(value)_base` or `value_base`, base 2, 8, 10 or 16. Runs on text after template slots are filled. */
const TOKEN = /(\()?([0-9A-Fa-f][0-9A-Fa-f.]*)(\))?_(2|8|10|16)(?![0-9A-Za-z_])/g;

export type NotationPart = { text: string } | { value: string; base: string; parens: boolean; raw: string; start: number };

/** Splits text into plain runs and base-notation tokens, in order. */
export function splitNotation(text: string): NotationPart[] {
  const parts: NotationPart[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    let [raw] = m;
    const [, open, value, close, base] = m;
    let start = m.index;
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

/** The text as it should be read aloud: "(26)_10" becomes "26 base 10". */
export function plainNotation(text: string): string {
  return splitNotation(text)
    .map((p) => ("text" in p ? p.text : `${p.value} base ${p.base}`))
    .join("");
}

/**
 * For text revealed a character at a time: how many characters to show so that a token is never
 * cut in half (which would flash the raw `_10`). A cut inside a token extends to its end.
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

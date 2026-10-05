import { describe, expect, it } from "vitest";
import { courses } from "./index";

/** Every string a variant carries, with its JSON path. */
function strings(x: unknown, path: string, out: [string, string][]): [string, string][] {
  if (typeof x === "string") out.push([path, x]);
  else if (Array.isArray(x)) x.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) strings(v, `${path}.${k}`, out);
  return out;
}

describe("notation (#506)", () => {
  it("no raw underscore subscript before a letter (T_A, Q_t): the course writes TA, Q(t); base markers like _2 are fine", () => {
    const bad: string[] = [];
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions)
              for (const v of q.variants) for (const [p, s] of strings(v, `${t.id}/${q.id}/${v.id}`, [])) if (/_[A-Za-z]/.test(s)) bad.push(`${p}: ${s}`);
    expect(bad).toEqual([]);
  });
});

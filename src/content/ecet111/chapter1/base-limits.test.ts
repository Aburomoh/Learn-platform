import { describe, expect, it } from "vitest";
import { courses } from "../../index";

/**
 * Owner limit on place-value numbers (#580): octal positions 8^3 to 8^-1 (at most four digits before
 * the point, one after); hex 16^2 to 16^-1 (three before, one after). Binary is unchanged.
 */
const LIMIT = { 8: { whole: 4, frac: 1 }, 16: { whole: 3, frac: 1 } } as const;

function within(value: string, base: 8 | 16): boolean {
  const [whole, frac = ""] = value.replace(/^0+(?=.)/, "").split(".");
  return whole.length <= LIMIT[base].whole && frac.length <= LIMIT[base].frac;
}

describe("octal and hex numbers stay within the owner's position limits (#580)", () => {
  it("base-to-decimal, bit-grouping and numeric specs", () => {
    const failures: string[] = [];
    let checked = 0;
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions)
              for (const v of q.variants) {
                const where = `${c.id}/${t.id}/${a.id}/${q.id}/${v.id}`;
                const s = v.spec;
                if (s.kind === "base-to-decimal" && (s.base === 8 || s.base === 16)) {
                  checked++;
                  if (!within(s.number, s.base)) failures.push(`${where}: ${s.number} base ${s.base}`);
                } else if (s.kind === "bit-grouping") {
                  checked++;
                  if (!within(s.answer, s.groupSize === 3 ? 8 : 16)) failures.push(`${where}: ${s.answer} (${s.groupSize === 3 ? "octal" : "hex"})`);
                } else if (s.kind === "numeric" && (s.base === 8 || s.base === 16)) {
                  checked++;
                  if (!within(String(s.answer), s.base)) failures.push(`${where}: ${s.answer} base ${s.base}`);
                }
              }
    expect(checked).toBeGreaterThan(10);
    expect(failures).toEqual([]);
  });
});

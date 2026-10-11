import { describe, expect, it } from "vitest";
import { isArabic, splitBidi } from "./bidi";

describe("bidi isolation of English runs inside Arabic (ADR-0011 §5)", () => {
  it("keeps an equation, its operators and digits as one LTR run; the Arabic around it stays prose", () => {
    const runs = splitBidi("المعادلة هي Q(t+1) = JQ′ + K′Q في كل حافة.");
    expect(runs).toEqual([{ rtl: "المعادلة هي " }, { ltr: "Q(t+1) = JQ′ + K′Q" }, { rtl: " في كل حافة." }]);
  });

  it("isolates numbers, bit strings, base notation and arrows; punctuation belongs to the Arabic", () => {
    expect(splitBidi("انظر إلى 010000000.")).toEqual([{ rtl: "انظر إلى " }, { ltr: "010000000" }, { rtl: "." }]);
    expect(splitBidi("إذاً (26)_10 تساوي 11010_2، صحيح؟")).toEqual([{ rtl: "إذاً " }, { ltr: "(26)_10" }, { rtl: " تساوي " }, { ltr: "11010_2" }, { rtl: "، صحيح؟" }]);
    expect(splitBidi("من T1 → T4 مباشرة")).toEqual([{ rtl: "من " }, { ltr: "T1 → T4" }, { rtl: " مباشرة" }]);
  });

  it("an English term with an Arabic gloss in brackets: the term is isolated, the gloss is prose", () => {
    const runs = splitBidi("تعني أن الخوارزمية Preemptive (استباقية).");
    expect(runs).toEqual([{ rtl: "تعني أن الخوارزمية " }, { ltr: "Preemptive" }, { rtl: " (استباقية)." }]);
  });

  it("all-Arabic and all-English texts come back as one run each", () => {
    expect(splitBidi("ليس بعد.")).toEqual([{ rtl: "ليس بعد." }]);
    expect(splitBidi("Not yet.")).toEqual([{ ltr: "Not yet" }, { rtl: "." }]);
    expect(splitBidi("")).toEqual([]);
  });

  it("isArabic tells a translation from an English fallback", () => {
    expect(isArabic("ليس بعد. انظر إلى 110.")).toBe(true);
    expect(isArabic("Not yet. Look at 110.")).toBe(false);
  });
});

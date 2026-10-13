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

  it("a bracket whose partner is outside the run stays with the Arabic, so the pair faces inward (#720)", () => {
    expect(splitBidi("وما يتبقى (0 أو 1) يُكتب بجانب العدد.")).toEqual([{ rtl: "وما يتبقى (" }, { ltr: "0" }, { rtl: " أو " }, { ltr: "1" }, { rtl: ") يُكتب بجانب العدد." }]);
    // an English-term gloss: the term is one run, the brackets and the dash belong to the Arabic
    expect(splitBidi("الخوارزمية (First Come First Served — الأسبق وصولاً يُخدم أولاً) بسيطة")).toEqual([{ rtl: "الخوارزمية (" }, { ltr: "First Come First Served" }, { rtl: " — الأسبق وصولاً يُخدم أولاً) بسيطة" }]);
    expect(splitBidi("الجدول (File Allocation Table، جدول تخصيص الملفات)")).toEqual([{ rtl: "الجدول (" }, { ltr: "File Allocation Table" }, { rtl: "، جدول تخصيص الملفات)" }]);
    // a pair that closes inside the run is still one isolated run
    expect(splitBidi("اكتب (26)_10 هنا")).toEqual([{ rtl: "اكتب " }, { ltr: "(26)_10" }, { rtl: " هنا" }]);
    expect(splitBidi("القيمة Q(t+1) تتغير")).toEqual([{ rtl: "القيمة " }, { ltr: "Q(t+1)" }, { rtl: " تتغير" }]);
  });

  it("isArabic tells a translation from an English fallback", () => {
    expect(isArabic("ليس بعد. انظر إلى 110.")).toBe(true);
    expect(isArabic("Not yet. Look at 110.")).toBe(false);
  });
});

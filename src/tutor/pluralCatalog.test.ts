import { describe, expect, it } from "vitest";
import { pluralKey, resolvePlural, resolveMessage, messageKeys } from "./messages";

describe("component sentences as templates with count forms (ADR-0011 §6, #650 item 4)", () => {
  it("English picks one / other and fills {n}", () => {
    expect(resolvePlural("ui.summary.challenges", 1)).toBe("1 challenge");
    expect(resolvePlural("ui.summary.challenges", 4)).toBe("4 challenges");
    expect(resolvePlural("ui.summary.hints", 1)).toBe("hints used on 1 challenge");
    expect(resolvePlural("ui.summary.hints", 2)).toBe("hints used on 2 challenges");
    expect(resolveMessage("ui.summary.hints.zero")).toBe("no hints needed");
  });

  it("Arabic asks its six CLDR classes and falls back to the English form that exists", () => {
    expect(new Intl.PluralRules("ar").select(2)).toBe("two");
    // no Arabic forms yet: `two` is missing, so the English `other` is used and the sentence stays whole
    expect(pluralKey("ui.summary.challenges", 2, "ar")).toBe("ui.summary.challenges.other");
    expect(pluralKey("ui.summary.challenges", 1, "ar")).toBe("ui.summary.challenges.one");
    expect(resolvePlural("ui.summary.attempts", 11, {}, "ar")).toBe("11 attempts");
  });

  it("the numeric-entry hint is one whole sentence per shape, never fragments", () => {
    expect(resolveMessage("ui.numeric.decimal")).toBe("digits 0 to 9");
    expect(resolveMessage("ui.numeric.decimal.signed")).toBe("digits 0 to 9, a leading minus sign");
    expect(resolvePlural("ui.numeric.decimal.places", 1)).toBe("digits 0 to 9, and up to 1 decimal place after the point");
    expect(resolvePlural("ui.numeric.decimal.signed-places", 2)).toBe("digits 0 to 9, a leading minus sign, and up to 2 decimal places after the point");
  });

  it("every count family has an `other` form", () => {
    const families = new Set(messageKeys().filter((k) => /\.(zero|one|two|few|many|other)$/.test(k)).map((k) => k.replace(/\.[a-z]+$/, "")));
    for (const f of families) expect(messageKeys(), f).toContain(`${f}.other`);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { gateWording } from "./gateVars";
import { en } from "./messages/en";
import { ar } from "./messages/ar";
import { messageKeys, resolveMessage, untranslatedKeys } from "./messages";

describe("ar catalog slots", () => {
  afterEach(() => {
    ar["gate.rule.AND"] = "";
  });

  it("has exactly the en keys", () => {
    expect(Object.keys(ar).sort()).toEqual(messageKeys().sort());
  });

  it("any filled translation keeps every {slot} of the English text", () => {
    const slots = (t: string) => (t.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort();
    for (const k of messageKeys()) {
      const t = (ar as Record<string, string>)[k];
      if (t) expect(slots(t), k).toEqual(slots((en as Record<string, string>)[k]));
    }
  });

  it("untranslated slots fall back to en; filled slots win, including gate wording", () => {
    expect(resolveMessage("open", {}, "ar")).toBe(en.open);
    expect(untranslatedKeys("ar")).toContain("gate.rule.AND");
    ar["gate.rule.AND"] = "AND-ar";
    expect(gateWording({ gateName: "AND" }, "ar").gateRule).toBe("AND-ar");
    expect(resolveMessage("gate.rule.AND", {}, "en")).toBe(en["gate.rule.AND"]);
    expect(resolveMessage("open", {}, "xx")).toBe(en.open);
  });
});

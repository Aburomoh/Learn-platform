import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const COURSE = "ecet111";
const questions = (topic: string, activity: string) => getActivity(COURSE, topic, activity)!.activity.questions;

describe("Chapter 4 figures (#454)", () => {
  it("decoder and encoder screens show the device; a device question draws its own", () => {
    for (const q of [...questions("decoders-encoders", "decoders"), ...questions("decoders-encoders", "encoders")])
      for (const v of q.variants) expect(v.figure?.type ?? v.spec.kind, `${q.id}/${v.id}`).toBe("device");
  });

  it("the decoder table's figure never sits on an asked column's code", () => {
    for (const v of questions("decoders-encoders", "decoders").find((q) => q.id === "dc.q.table")!.variants) {
      if (v.spec.kind !== "truth-table" || v.figure?.type !== "device") throw new Error("expected a table with a decoder");
      const asked = v.spec.columns.filter((c) => !c.given).map((c) => Number(c.label.slice(1)));
      expect(asked).not.toContain(v.figure.given);
    }
  });
});

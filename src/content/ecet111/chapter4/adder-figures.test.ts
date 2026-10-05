import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const questions = (topic: string, activity: string) => getActivity("ecet111", topic, activity)!.activity.questions;
const figureOf = (topic: string, activity: string, id: string) => questions(topic, activity).find((q) => q.id === id)!.variants.map((v) => v.figure);

describe("Chapter 4 adder figures (#454)", () => {
  it("one row first puts the prompt's bits on the block", () => {
    for (const v of questions("half-adder", "half-adder").find((q) => q.id === "ha.q.add")!.variants) {
      if (v.spec.kind !== "multiple-choice" || v.figure?.type !== "adder" || !v.figure.given) throw new Error("expected an HA with bits");
      expect(v.prompt).toContain(`A = ${v.figure.given.a} and B = ${v.figure.given.b}`);
    }
    for (const v of questions("full-adder", "full-adder-table").find((q) => q.id === "fa.q.row")!.variants) {
      if (v.figure?.type !== "adder" || !v.figure.given) throw new Error("expected a full adder with bits");
      const { a, b, ci } = v.figure.given;
      expect(v.prompt).toContain(`A = ${a}, B = ${b} and Ci = ${ci}`);
    }
  });

  it("tables show the symbol alone; the gate and K-map questions focus the asked output", () => {
    expect(figureOf("half-adder", "half-adder", "ha.q.table")).toEqual([{ type: "adder", adder: "half" }]);
    expect(figureOf("full-adder", "full-adder-table", "fa.q.table")).toEqual([{ type: "adder", adder: "full" }]);
    expect(figureOf("half-adder", "half-adder", "ha.q.gates").map((f) => f?.type === "adder" && f.focus)).toEqual(["S", "C"]);
    expect(figureOf("full-adder", "full-adder-kmap", "fa.q.kmap").map((f) => f?.type === "adder" && f.focus)).toEqual(["Co", "S"]);
  });
});

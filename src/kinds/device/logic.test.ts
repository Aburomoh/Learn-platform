import { describe, expect, it } from "vitest";
import type { VariantOf } from "../types";
import { DeviceSpec } from "./spec";
import { codeNames, device, pickName, rightPick, type DeviceAnswer } from "./logic";

type Misconception = VariantOf<DeviceSpec>["misconceptions"][number];
// The kind's detectors join the schema when it is registered with its view (Frontend, ADR-0008).
const detector = (type: string) => ({ type }) as unknown as Misconception["detect"];

function variant(spec: unknown): VariantOf<DeviceSpec> {
  return {
    id: "v1",
    prompt: "Which line?",
    spec: DeviceSpec.parse(spec),
    vars: {},
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
    misconceptions: ["bits-reversed", "counted-from-one"].map((t) => ({ id: t, title: t, nudgeKey: t, detect: detector(t) })),
  };
}

const grade = (v: VariantOf<DeviceSpec>, a: Omit<DeviceAnswer, "kind">) => device.grade(v, { kind: "device", ...a });

describe("device: truth from the Boolean module (ch4 pack §3, §5)", () => {
  it("decoder: input code k makes Dk active (s.28; xyz = 101 → D5)", () => {
    const spec = DeviceSpec.parse({ kind: "device", device: "decoder", bits: 3, asks: [5] });
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((k) => rightPick(spec, k))).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(codeNames(spec)).toEqual(["x", "y", "z"]);
  });

  it("encoder: input Ik gives code k (s.32; I6 → 110)", () => {
    const spec = DeviceSpec.parse({ kind: "device", device: "encoder", bits: 3, asks: [6] });
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((k) => pickName(spec, rightPick(spec, k)))).toEqual(["000", "001", "010", "011", "100", "101", "110", "111"]);
  });

  it("mux: select value k routes Ik (s.40; 2-to-1 and 4-to-1)", () => {
    const four = DeviceSpec.parse({ kind: "device", device: "mux", bits: 2, asks: [2] });
    expect([0, 1, 2, 3].map((k) => rightPick(four, k))).toEqual([0, 1, 2, 3]);
    expect(codeNames(four)).toEqual(["S1", "S0"]);
    const two = DeviceSpec.parse({ kind: "device", device: "mux", bits: 1, asks: [0, 1] });
    expect([0, 1].map((k) => rightPick(two, k))).toEqual([0, 1]);
  });
});

describe("device: grading one ask at a time", () => {
  const mux = variant({ kind: "device", device: "mux", bits: 2, asks: [2, 1, 3], data: [0, 1, 1, 0] });

  it("partial until the last ask; step vars", () => {
    expect(grade(mux, { step: 0, pick: 2 })).toMatchObject({ correct: true, partial: true });
    expect(grade(mux, { step: 2, pick: 3 })).toMatchObject({ correct: true });
    expect(grade(mux, { step: 2, pick: 3 }).partial).toBeUndefined();
    expect(device.steps!.tag(mux.spec, 0)).toBe("input");
    expect(device.steps!.vars(mux.spec, 0)).toMatchObject({ given: "S1 = 1, S0 = 0", codeBits: "1 0", answerName: "I2", deviceSize: "4-to-1", askCount: 3 });
  });

  it("names the slip", () => {
    expect(grade(mux, { step: 0, pick: 1 }).misconceptionId).toBe("bits-reversed"); // 10 read as 01
    expect(grade(mux, { step: 1, pick: 2 }).misconceptionId).toBe("bits-reversed");
    const dec = variant({ kind: "device", device: "decoder", bits: 3, asks: [6, 3] });
    expect(grade(dec, { step: 0, pick: 3 }).misconceptionId).toBe("bits-reversed"); // 110 read as 011
    expect(grade(dec, { step: 1, pick: 4 }).misconceptionId).toBe("counted-from-one");
    expect(grade(dec, { step: 1, pick: 0 }).misconceptionId).toBeUndefined();
    expect(device.steps!.vars(dec.spec, 0)).toMatchObject({ given: "x = 1, y = 1, z = 0", answerName: "D6", deviceSize: "3-to-8" });
    const enc = variant({ kind: "device", device: "encoder", bits: 3, asks: [1] });
    expect(grade(enc, { step: 0, pick: 4 }).misconceptionId).toBe("bits-reversed"); // 001 written as 100
    expect(device.steps!.vars(enc.spec, 0)).toMatchObject({ given: "I1", answerName: "001", deviceSize: "8-to-3" });
    expect(grade(enc, { step: 0 })).toMatchObject({ correct: false });
  });

  it("rejects malformed specs", () => {
    expect(DeviceSpec.safeParse({ kind: "device", device: "mux", bits: 2, asks: [4] }).success).toBe(false);
    expect(DeviceSpec.safeParse({ kind: "device", device: "mux", bits: 2, asks: [1, 1] }).success).toBe(false);
    expect(DeviceSpec.safeParse({ kind: "device", device: "decoder", bits: 3, asks: [1], data: [0, 1] }).success).toBe(false);
    expect(DeviceSpec.safeParse({ kind: "device", device: "decoder", bits: 1, asks: [1] }).success).toBe(false);
    expect(DeviceSpec.safeParse({ kind: "device", device: "mux", bits: 2, asks: [1], names: ["S1"] }).success).toBe(false);
  });
});

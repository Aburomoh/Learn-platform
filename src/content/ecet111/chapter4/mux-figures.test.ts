import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const questions = (topic: string, activity: string) => getActivity("ecet111", topic, activity)!.activity.questions;

describe("Chapter 4 mux figures (#454)", () => {
  it("predict Y shows the prompt's mux; each pairs set shows its selects", () => {
    for (const v of questions("multiplexers", "multiplexers").find((q) => q.id === "mx.q.predict")!.variants) expect(v.figure).toMatchObject({ type: "device", device: "mux", bits: 2 });
    const pairs = questions("multiplexers", "mux-functions").find((q) => q.id === "mx.q.pairs")!.variants;
    expect(pairs.map((v) => (v.figure?.type === "device" ? `${v.figure.names?.join("")} I${v.figure.given}` : ""))).toEqual(["xy I0", "wxy I3", "ABC I2", "xyz I0"]);
  });
});

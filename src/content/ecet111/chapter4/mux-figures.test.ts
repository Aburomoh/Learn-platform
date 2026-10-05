import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const questions = (topic: string, activity: string) => getActivity("ecet111", topic, activity)!.activity.questions;

describe("Chapter 4 mux figures (#454)", () => {
  it("predict Y shows the prompt's mux; mux-pairs has none yet", () => {
    for (const v of questions("multiplexers", "multiplexers").find((q) => q.id === "mx.q.predict")!.variants) expect(v.figure).toMatchObject({ type: "device", device: "mux", bits: 2 });
    // practice walks every pair but a figure's focus is fixed: no pairs figure until linked views (#454 step 5, Reviewer on #479)
    for (const v of questions("multiplexers", "mux-functions").find((q) => q.id === "mx.q.pairs")!.variants) expect(v.figure).toBeUndefined();
  });
});

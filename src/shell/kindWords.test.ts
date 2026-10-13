import { describe, expect, it } from "vitest";
import { courses } from "@/content";
import { messageKeys } from "@/tutor/messages";
import { kindWords, kindsOf } from "./kindWords";

const activities = courses.flatMap((c) => c.modules.flatMap((m) => m.topics.flatMap((t) => t.activities)));

describe("kindWords (owner refinement 1, epic #670)", () => {
  it("every kind in use has plain words in the catalogue", () => {
    const keys = new Set(messageKeys());
    const kinds = new Set(activities.flatMap(kindsOf));
    expect(kinds.size).toBeGreaterThan(10);
    for (const kind of kinds) expect(keys.has(`ui.kind.${kind}`), kind).toBe(true);
  });

  it("names each kind once, in the order the practice uses them", () => {
    const d2b = activities.find((a) => a.id === "decimal-to-binary")!;
    expect(kindsOf(d2b)).toEqual(["repeated-division", "numeric", "bit-grouping"]);
    expect(kindWords(d2b)).toBe("Step-by-step division · Type the number · Group the bits");
  });

  it("falls back to the kind id, never to nothing", () => {
    const fake = { ...activities[0], questions: [{ ...activities[0].questions[0], variants: [{ ...activities[0].questions[0].variants[0], spec: { kind: "made-up" } }] }] };
    expect(kindWords(fake as never)).toBe("made-up");
  });
});

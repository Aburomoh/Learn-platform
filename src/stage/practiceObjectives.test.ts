import { describe, expect, it } from "vitest";
import { getActivity, courses } from "@/content";
import { practiceObjectives } from "./ActivitySummary";

// #713 (Auditor): "You can now" lists only what this practice checked.
describe("practiceObjectives", () => {
  it("lists only the objectives the practice's questions carry, each once, in topic order", () => {
    const ref = getActivity("cpet181", "deadlock-sketches", "cases") ?? getActivity("ecet111", "number-systems", "decimal-to-binary")!;
    const { topic, activity } = ref;
    const listed = practiceObjectives(topic, activity);
    const ids = new Set(activity.questions.map((q) => q.objectiveId));
    expect(listed).toEqual(topic.objectives.filter((o) => ids.has(o.id)).map((o) => o.text));
    expect(new Set(listed).size).toBe(listed.length);
    for (const text of listed) expect(topic.objectives.some((o) => o.text === text)).toBe(true);
  });

  it("a topic of several practices: at least one practice vouches for fewer objectives than the topic has", () => {
    const cases = courses.flatMap((c) => c.modules.flatMap((m) => m.topics.filter((t) => t.activities.length > 1 && t.objectives.length > 1).map((t) => ({ t, fewer: t.activities.some((a) => practiceObjectives(t, a).length < t.objectives.length) }))));
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.some((c) => c.fewer)).toBe(true);
    // and every practice vouches for at least one
    for (const { t } of cases) for (const a of t.activities) expect(practiceObjectives(t, a).length).toBeGreaterThan(0);
  });
});

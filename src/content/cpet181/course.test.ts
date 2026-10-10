import { describe, expect, it } from "vitest";
import { ModuleSchema } from "../schema";
import { courses } from "../index";
import { cpet181 as outline } from "./index";

describe("CPET181 registration (#562)", () => {
  const course = courses.find((c) => c.id === "cpet181")!;

  it("is in courses with the nine chapters of the outline, in order", () => {
    expect(course.modules.map((m) => m.title.replace(/^Chapter \d+ · /, ""))).toEqual(outline.chapters.map((c) => c.title.toLowerCase()));
  });

  it("has Chapter 1 live and chapters 2–9 comingSoon with no topics", () => {
    expect(course.modules[0].comingSoon).toBeUndefined();
    expect(course.modules[0].topics.length).toBeGreaterThan(0);
    for (const m of course.modules.slice(1)) {
      expect(m.comingSoon, m.id).toBe(true);
      expect(m.topics, m.id).toHaveLength(0);
    }
  });

  it("a chapter with no topics must say comingSoon, and a comingSoon chapter has none", () => {
    expect(ModuleSchema.safeParse({ id: "x", title: "X", topics: [] }).success).toBe(false);
    expect(ModuleSchema.safeParse({ id: "x", title: "X", comingSoon: true, topics: [] }).success).toBe(true);
    expect(ModuleSchema.safeParse({ id: "x", title: "X", comingSoon: true, topics: course.modules[0].topics }).success).toBe(false);
  });
});

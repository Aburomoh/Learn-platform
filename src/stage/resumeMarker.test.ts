import { afterEach, describe, expect, it } from "vitest";
import { progressKey } from "@/learner";
import { RESUME_ATTR, resumeMarkerScript, resumeProgressKey } from "./resumeMarker";

const OFFERING = "ecet111.2026-fall";
const script = resumeMarkerScript(OFFERING, "decimal-to-binary");
const run = () => new Function(script)();
const marked = () => document.documentElement.hasAttribute(RESUME_ATTR);
const store = (activity: object | undefined) =>
  localStorage.setItem(progressKey(OFFERING), JSON.stringify({ version: 1, offeringId: OFFERING, activities: activity ? { "decimal-to-binary": activity } : {}, concepts: {} }));

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute(RESUME_ATTR);
  window.history.replaceState(null, "", "/");
});

describe("resume marker script (inline before the stage)", () => {
  it("reads the same key the progress store writes", () => {
    expect(resumeProgressKey(OFFERING)).toBe(progressKey(OFFERING));
  });

  it("leaves a new student alone: no record, or nothing finished yet", () => {
    run();
    expect(marked()).toBe(false);
    store(undefined);
    run();
    expect(marked()).toBe(false);
    store({ status: "started", completedQuestions: [] });
    run();
    expect(marked()).toBe(false);
    store({ status: "started" });
    run();
    expect(marked()).toBe(false);
  });

  it("marks a student who is part-way through this practice", () => {
    store({ status: "started", completedQuestions: ["ns.q.divide"] });
    run();
    expect(marked()).toBe(true);
  });

  it("does not mark a finished practice or a Review link (both start at challenge 1)", () => {
    store({ status: "completed", completedQuestions: ["a", "b"] });
    run();
    expect(marked()).toBe(false);
    store({ status: "started", completedQuestions: ["ns.q.divide"] });
    window.history.replaceState(null, "", "/?review=1");
    run();
    expect(marked()).toBe(false);
  });

  it("never throws and stays within its remit", () => {
    localStorage.setItem(progressKey(OFFERING), "{broken");
    expect(run).not.toThrow();
    expect(script).not.toMatch(/fetch|XMLHttpRequest|import|cookie|innerHTML|eval/);
    expect(script.length).toBeLessThan(380);
  });
});

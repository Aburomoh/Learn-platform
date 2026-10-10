import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { courses, getCourse } from "@/content";
import type { Course } from "@/content/schema";
import { clearLocalData, getProgressStore } from "@/learner";
import { completeQuestion, emptyProgress, startActivity } from "@/learner/progress";
import { product } from "../../../config/product";
import { HomeNext, pickCourse, remainingCue } from "./HomeNext";

const course = getCourse("ecet111")!;
const firstTopic = course.modules[0].topics[0];
const practice = firstTopic.activities[0];

afterEach(() => {
  act(() => {
    clearLocalData();
  });
});

describe("remainingCue", () => {
  it("says 'about' and scales the authored minutes by the challenges still ahead", () => {
    expect(remainingCue(1, 4, 10)).toBe("Challenge 2 of 4 · about 8 min left");
    expect(remainingCue(3, 4, 10)).toBe("Challenge 4 of 4 · about 3 min left");
    expect(remainingCue(3, 4, 1)).toBe("Challenge 4 of 4 · about 1 min left");
  });
});

describe("pickCourse: one course today, a list later", () => {
  const other: Course = { ...course, id: "other", code: "OTHER 101", offeringId: "other.2026" };
  const started = (c: Course, at: number) => startActivity(emptyProgress(c.offeringId), c.modules[0].topics[0].activities[0].id, at);

  it("leads with the first course when nothing is in progress", () => {
    expect(pickCourse([course, other], (c) => emptyProgress(c.offeringId)).course.id).toBe(course.id);
  });

  it("leads with the course whose practice was touched most recently", () => {
    const progress = { [course.id]: started(course, 10), other: started(other, 20) };
    expect(pickCourse([course, other], (c) => progress[c.id]).course.id).toBe("other");
    expect(pickCourse([course, other], (c) => (c.id === course.id ? started(course, 10) : emptyProgress(c.offeringId))).course.id).toBe(course.id);
  });
});

describe("HomeNext", () => {
  it("first visit: 'Start here', Start practice on the first topic, name and owner from config", () => {
    render(<HomeNext courses={courses} />);
    expect(screen.getByRole("heading", { level: 1, name: "Start here" })).toBeInTheDocument();
    expect(screen.getByText(product.tagline)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Practice for ${product.owner.displayName}'s courses`))).toBeInTheDocument();
    const button = document.querySelector("[data-primary-action]")!;
    expect(document.querySelectorAll("[data-primary-action]")).toHaveLength(1);
    expect(button).toHaveTextContent("Start practice");
    expect(button.getAttribute("href")).toContain(`/${firstTopic.id}/${practice.id}`);
    expect(screen.getByRole("heading", { level: 2, name: firstTopic.title })).toBeInTheDocument();
  });

  it("returning: 'Pick up where you left off', Continue, the steps, and what is left", () => {
    act(() => {
      getProgressStore(course.offeringId).set((p) => completeQuestion(startActivity(p, practice.id), practice.id, practice.questions[0].id));
    });
    render(<HomeNext courses={courses} />);
    expect(screen.getByRole("heading", { level: 1, name: "Pick up where you left off" })).toBeInTheDocument();
    expect(document.querySelector("[data-primary-action]")).toHaveTextContent("Continue");
    const states = within(screen.getByRole("list", { name: "Challenges" })).getAllByRole("listitem").map((s) => s.getAttribute("data-state"));
    expect(states.slice(0, 2)).toEqual(["done", "current"]);
    expect(screen.getByText(new RegExp(`Challenge 2 of ${practice.questions.length} · about \\d+ min left`))).toBeInTheDocument();
  });

  it("lists every course as a plain row with a quiet 'Open course'", () => {
    render(<HomeNext courses={courses} />);
    const section = screen.getByRole("region", { name: courses.length === 1 ? "Your course" : "Your courses" });
    const rows = within(section).getAllByRole("listitem");
    expect(rows).toHaveLength(courses.length);
    expect(within(rows[0]).getByRole("link", { name: `Open course: ${course.title}` }).getAttribute("href")).toMatch(/\/courses\/ecet111\/?$/);
  });
});

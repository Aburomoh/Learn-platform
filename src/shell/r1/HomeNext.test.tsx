import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { courses, getCourse } from "@/content";
import type { Course } from "@/content/schema";
import { clearLocalData, getProgressStore } from "@/learner";
import { completeQuestion, emptyProgress, startActivity } from "@/learner/progress";
import { product } from "../../../config/product";
import { HomeNext, pickCourse, remainingCue, rowActionLabel } from "./HomeNext";
import { courseAction } from "../primaryAction";

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
    expect(button).toHaveTextContent(`Start · ${practice.title}`);
    expect(button.getAttribute("href")).toContain(`/${firstTopic.id}/${practice.id}`);
    expect(screen.getByRole("heading", { level: 2, name: firstTopic.title })).toBeInTheDocument();
  });

  it("returning: 'Pick up where you left off', Continue and what is left; no challenge dots in the hero (#675)", () => {
    act(() => {
      getProgressStore(course.offeringId).set((p) => completeQuestion(startActivity(p, practice.id), practice.id, practice.questions[0].id));
    });
    render(<HomeNext courses={courses} />);
    expect(screen.getByRole("heading", { level: 1, name: "Pick up where you left off" })).toBeInTheDocument();
    expect(document.querySelector("[data-primary-action]")).toHaveTextContent("Continue");
    expect(screen.queryByRole("list", { name: "Challenges" })).not.toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Challenge 2 of ${practice.questions.length} · about \\d+ min left`))).toBeInTheDocument();
  });

  it("lists every course as a plain row with its own Start / Continue and a quiet 'Open course'; the catalogue is #courses (#675)", () => {
    render(<HomeNext courses={courses} />);
    const section = screen.getByRole("region", { name: courses.length === 1 ? "Your course" : "Your courses" });
    expect(section.id).toBe("courses");
    const rows = within(section).getAllByRole("listitem");
    expect(rows).toHaveLength(courses.length);
    expect(within(rows[0]).getByRole("link", { name: `Open course: ${course.title}` }).getAttribute("href")).toMatch(/\/courses\/ecet111\/?$/);
    // first visit: every row starts its first practice, by name
    for (const [i, c] of courses.entries()) {
      const first = c.modules[0].topics[0].activities[0];
      const link = within(rows[i]).getByRole("link", { name: `Start · ${first.title}: ${c.title}` });
      expect(link).toHaveTextContent(`Start · ${first.title}`);
      expect(link.getAttribute("href")).toMatch(new RegExp(`^/courses/${c.id}/${c.modules[0].topics[0].id}/${first.id}/?$`));
    }
  });

  it("returning: the row of the course in progress says Continue · its practice; the other course still says Start (#675)", () => {
    const other = courses.find((c) => c.id !== course.id)!;
    act(() => {
      getProgressStore(course.offeringId).set((p) => completeQuestion(startActivity(p, practice.id), practice.id, practice.questions[0].id));
    });
    render(<HomeNext courses={courses} />);
    const section = screen.getByRole("region", { name: "Your courses" });
    const row = (c: Course) => section.querySelector(`[data-course='${c.id}']`)!;
    expect(row(course).getAttribute("data-action")).toBe("continue");
    expect(within(row(course) as HTMLElement).getByRole("link", { name: `Continue · ${practice.title}: ${course.title}` }).getAttribute("href")).toMatch(new RegExp(`^/courses/${course.id}/${firstTopic.id}/${practice.id}/?$`));
    expect(row(other).getAttribute("data-action")).toBe("start");
    expect(within(row(other) as HTMLElement).getByRole("link", { name: /^Start · / })).toBeInTheDocument();
    // the label is the shared catalogue's, filled with the practice title
    expect(rowActionLabel(courseAction(course, getProgressStore(course.offeringId).get()))).toBe(`Continue · ${practice.title}`);
  });
});

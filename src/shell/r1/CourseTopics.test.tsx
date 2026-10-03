import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { getCourse } from "@/content";
import { clearLocalData, getProgressStore } from "@/learner";
import { completeActivity, completeQuestion, startActivity } from "@/learner/progress";
import { CourseTopics, topicStatus } from "./CourseTopics";

const course = getCourse("ecet111")!;
const topics = course.modules.flatMap((m) => m.topics);
const [first, second] = topics;
const store = () => getProgressStore(course.offeringId);
const finish = (topic: (typeof topics)[number]) =>
  store().set((p) => topic.activities.reduce((acc, a) => completeActivity(startActivity(acc, a.id), a.id, true), p));

afterEach(() => {
  act(() => {
    clearLocalData();
  });
});

describe("topicStatus", () => {
  const total = first.activities.reduce((n, a) => n + a.questions.length, 0);
  const minutes = first.activities.reduce((n, a) => n + a.minutes, 0);

  it("not started: the effort cue for the whole topic, from authored values", () => {
    const text = first.activities.length > 1 ? `${first.activities.length} short practices · about ${minutes} min` : `${total} short challenges · about ${minutes} min`;
    expect(topicStatus(first, { activities: {} })).toEqual({ text, completed: false, started: false });
  });

  it("in progress: challenges done across the topic", () => {
    const a = first.activities[0];
    const p = completeQuestion(startActivity({ version: 1, offeringId: "x", activities: {}, concepts: {} }, a.id), a.id, a.questions[0].id);
    expect(topicStatus(first, p)).toEqual({ text: `1 of ${total} challenges done`, completed: false, started: true });
  });

  it("completed only when every practice of the topic is", () => {
    const all = Object.fromEntries(first.activities.map((a) => [a.id, { status: "completed" as const, attempts: 1, hintsUsed: 0, independent: true, lastAt: 1 }]));
    expect(topicStatus(first, { activities: all })).toEqual({ text: "Completed", completed: true, started: true });
  });
});

describe("CourseTopics", () => {
  it("lists every chapter as a section and every topic as a row with a title link to its page", () => {
    render(<CourseTopics course={course} />);
    expect(screen.getAllByRole("region")).toHaveLength(course.modules.length);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(topics.length);
    for (const [i, topic] of topics.entries()) {
      const title = within(rows[i]).getByRole("link", { name: topic.title });
      expect(title.getAttribute("href")).toMatch(new RegExp(`/courses/ecet111/${topic.id}/?$`));
    }
  });

  it("first visit: the first topic carries the page's only filled button; the others are quiet", () => {
    render(<CourseTopics course={course} />);
    const filled = document.querySelectorAll("[data-primary-action]");
    expect(filled).toHaveLength(1);
    expect(filled[0]).toHaveTextContent("Start practice");
    expect(screen.getAllByRole("listitem")[0]).toContainElement(filled[0] as HTMLElement);
    expect(within(screen.getAllByRole("listitem")[1]).getByRole("link", { name: `Start: ${second.title}` })).toBeInTheDocument();
  });

  it("after finishing the first topic: it shows Completed with Review, and the next topic gets the filled button", () => {
    act(() => {
      finish(first);
    });
    render(<CourseTopics course={course} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Completed");
    expect(within(rows[0]).getByRole("link", { name: `Review: ${first.title}` }).getAttribute("href")).toContain("review=1");
    expect(rows[1].querySelector("[data-primary-action]")).toHaveTextContent("Start practice");
    expect(document.querySelectorAll("[data-primary-action]")).toHaveLength(1);
  });

  it("a practice in progress makes its topic the next one, with Continue", () => {
    act(() => {
      store().set((p) => startActivity(p, second.activities[0].id));
    });
    render(<CourseTopics course={course} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[1].querySelector("[data-primary-action]")).toHaveTextContent("Continue");
    expect(rows[0].querySelector("[data-primary-action]")).toBeNull();
  });
});

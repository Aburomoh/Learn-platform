import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { getCourse } from "@/content";
import { getProgressStore, clearLocalData } from "@/learner";
import { completeActivity, completeQuestion, startActivity } from "@/learner/progress";
import { TopicNext } from "./TopicNext";

const course = getCourse("ecet111")!;
const topics = course.modules.flatMap((m) => m.topics);
const topic = topics.find((t) => t.activities.length > 1) ?? topics[0];
const [first] = topic.activities;
const store = () => getProgressStore(course.offeringId);

afterEach(() => {
  act(() => {
    clearLocalData();
  });
});

describe("TopicNext", () => {
  it("first visit: Start practice, the effort cue from authored values, every step not started", () => {
    render(<TopicNext course={course} topic={topic} />);
    const button = document.querySelector("[data-primary-action]")!;
    expect(button).toHaveTextContent("Start practice");
    expect(button.getAttribute("href")).toContain(`/${topic.id}/${first.id}`);
    expect(document.querySelectorAll("[data-primary-action]")).toHaveLength(1);
    expect(screen.getAllByText(new RegExp(`${first.questions.length} short challenges`)).length).toBeGreaterThan(0);
    const steps = within(screen.getByRole("list", { name: /^Challenges/ })).getAllByRole("listitem");
    expect(steps).toHaveLength(first.questions.length);
    expect(steps.every((s) => s.getAttribute("data-state") === "todo")).toBe(true);
  });

  it("started: Continue, finished challenges done and the next one current", () => {
    act(() => {
      store().set((p) => completeQuestion(startActivity(p, first.id), first.id, first.questions[0].id));
    });
    render(<TopicNext course={course} topic={topic} />);
    expect(document.querySelector("[data-primary-action]")).toHaveTextContent("Continue");
    const states = within(screen.getByRole("list", { name: /^Challenges/ })).getAllByRole("listitem").map((s) => s.getAttribute("data-state"));
    expect(states.slice(0, 2)).toEqual(["done", "current"]);
  });

  it.runIf(topic.activities.length > 1)("lists every practice with its own status and quiet action", () => {
    act(() => {
      store().set((p) => completeActivity(startActivity(p, first.id), first.id, true));
    });
    render(<TopicNext course={course} topic={topic} />);
    const rows = within(screen.getByRole("region", { name: "Practices in this topic" })).getAllByRole("listitem");
    expect(rows).toHaveLength(topic.activities.length);
    expect(rows[0]).toHaveAttribute("data-status", "review");
    expect(within(rows[0]).getByRole("link", { name: `Review: ${first.title}` }).getAttribute("href")).toContain("review=1");
    // the practice the page button is about is marked "Up next" and has no second button
    expect(rows[1]).toHaveAttribute("data-up-next", "true");
    expect(within(rows[1]).queryByRole("link")).toBeNull();
    expect(rows[1]).toHaveTextContent("Up next");
    // and the steps say which practice they belong to
    expect(screen.getByRole("list", { name: `Challenges of ${topic.activities[1].title}` })).toBeInTheDocument();
    // the page button has moved on to the topic's next practice
    expect(document.querySelector("[data-primary-action]")!.getAttribute("href")).toContain(topic.activities[1].id);
  });

  it("topic finished: Next topic with Review beside it, or Review alone on the last topic", () => {
    act(() => {
      store().set((p) => topic.activities.reduce((acc, a) => completeActivity(startActivity(acc, a.id), a.id, true), p));
    });
    render(<TopicNext course={course} topic={topic} />);
    const isLast = topics[topics.length - 1].id === topic.id;
    expect(document.querySelector("[data-primary-action]")).toHaveTextContent(isLast ? "Review" : "Next topic");
    expect(screen.queryByRole("list", { name: /^Challenges/ })).toBeNull();
    expect(screen.getByText("Completed. You can review it any time.")).toBeInTheDocument();
  });
});

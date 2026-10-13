import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { getCourse } from "@/content";
import { clearLocalData, getProgressStore } from "@/learner";
import { PracticeRows, TopicNavigator } from "./TopicNavigator";

// S2 (#680): the practice page's "Practices in this topic (k of n)" navigator and the shared rows.
const course = getCourse("ecet111")!;
const topics = course.modules.flatMap((m) => m.topics);
const multi = topics.find((t) => t.activities.length > 2)!;
const single = topics.find((t) => t.activities.length === 1);
const store = () => getProgressStore(course.offeringId);

afterEach(() => {
  act(() => {
    clearLocalData();
  });
});

describe("TopicNavigator", () => {
  it("is a collapsed disclosure naming the position, with the topic's rows and the current practice marked, not linked", () => {
    const current = multi.activities[1];
    render(<TopicNavigator course={course} topic={multi} activity={current} />);
    const details = screen.getByTestId("topic-navigator") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.querySelector("summary")).toHaveTextContent(`Practices in this topic (2 of ${multi.activities.length})`);
    const rows = within(screen.getByRole("navigation", { name: "Practices in this topic" })).getAllByRole("listitem");
    expect(rows).toHaveLength(multi.activities.length);
    expect(rows[1]).toHaveAttribute("aria-current", "page");
    expect(rows[1]).toHaveTextContent(current.title);
    expect(rows[1]).toHaveTextContent("Here");
    expect(within(rows[1]).queryByRole("link")).toBeNull();
    // every other practice is freely selectable, by name, at challenge 1 (no #q=)
    for (const [i, a] of multi.activities.entries()) {
      if (i === 1) continue;
      const link = within(rows[i]).getByRole("link", { name: new RegExp(`^Start · ${a.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });
      expect(link.getAttribute("href")).toMatch(new RegExp(`/${multi.id}/${a.id}/?$`));
    }
    // rows show the kind in plain words and the step labels (finding, not jumping)
    expect(rows[0].getAttribute("data-kinds")).toBeTruthy();
  });

  it("never writes progress: opening it and reading the rows leaves the store untouched", () => {
    render(<TopicNavigator course={course} topic={multi} activity={multi.activities[0]} />);
    const details = screen.getByTestId("topic-navigator") as HTMLDetailsElement;
    act(() => {
      details.open = true;
      details.dispatchEvent(new Event("toggle"));
    });
    expect(Object.keys(store().get().activities)).toHaveLength(0);
    expect(localStorage.getItem(`cet-learn:v1:progress:${course.offeringId}`)).toBeNull();
  });

  it.runIf(!!single)("renders nothing for a one-practice topic", () => {
    const { container } = render(<TopicNavigator course={course} topic={single!} activity={single!.activities[0]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("PracticeRows: the up-next row has no second button on the topic page; the current row is only for the navigator", () => {
    render(<PracticeRows course={course} topic={multi} progress={{ activities: {} }} upNextId={multi.activities[0].id} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Up next");
    expect(rows[0]).not.toHaveAttribute("aria-current");
    expect(within(rows[1]).getByRole("link")).toBeInTheDocument();
  });
});

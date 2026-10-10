import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { courses } from "@/content";
import { emptyProgress, markExplained, skipActivities, startActivity, completeActivity } from "@/learner/progress";
import { skipOffer } from "@/shell/primaryAction";
import { chapterStatus, topicStatus } from "@/shell/r1/CourseTopics";
import { SkipMenu } from "./SkipMenu";

const course = courses.find((c) => c.id === "ecet111")!;
// a topic with several practices, and the one after it
const [topic, nextTopic] = (() => {
  const topics = course.modules.flatMap((m) => m.topics);
  const i = topics.findIndex((t) => t.activities.length > 1);
  return [topics[i], topics[i + 1]];
})();

describe("hidden skip rules (#579, PEDAGOGY)", () => {
  it("opens only after one practice in the topic is completed first-try without Explain Slowly", () => {
    const [first] = topic.activities;
    let p = startActivity(emptyProgress(course.offeringId), first.id, 1);
    expect(skipOffer(course, topic, first, p).allowed).toBe(false);
    p = completeActivity(p, first.id, false, 2); // hints were used
    expect(skipOffer(course, topic, first, p).allowed).toBe(false);
    p = completeActivity(p, first.id, true, 3);
    expect(skipOffer(course, topic, first, p).allowed).toBe(true);
    expect(skipOffer(course, topic, first, markExplained(p, first.id, 4)).allowed).toBe(false);
  });

  it("from an earlier practice it goes to the topic's last practice at challenge 1; from the last, to the next topic", () => {
    const p = emptyProgress(course.offeringId);
    const [first] = topic.activities;
    const last = topic.activities[topic.activities.length - 1];
    const fromFirst = skipOffer(course, topic, first, p);
    expect(fromFirst.href).toBe(`/courses/${course.id}/${topic.id}/${last.id}/?review=1`);
    expect(fromFirst.skipped).toEqual(topic.activities.slice(0, -1).map((a) => a.id));
    const fromLast = skipOffer(course, topic, last, p);
    expect(fromLast.href).toBe(`/courses/${course.id}/${nextTopic.id}/`);
    expect(fromLast.skipped).toEqual([last.id]);
    expect(fromLast.targetLabel).toContain(nextTopic.title);
  });

  it("skipped is never completed: the topic reads as unfinished, the chapter is not done, and a completed practice is untouched", () => {
    const [first, second] = topic.activities;
    let p = completeActivity(startActivity(emptyProgress(course.offeringId), first.id, 1), first.id, true, 2);
    p = skipActivities(p, [first.id, second.id], 3);
    expect(p.activities[first.id].status).toBe("completed");
    expect(p.activities[second.id].status).toBe("skipped");
    const status = topicStatus(topic, p);
    expect(status.completed).toBe(false);
    expect(status.text).toContain("skipped ahead");
    const chapter = course.modules.find((m) => m.topics.includes(topic))!;
    expect(chapterStatus(chapter, p).state).not.toBe("done");
    // coming back starts the skipped practice again; an old record without the new fields still reads
    expect(startActivity(p, second.id, 4).activities[second.id].status).toBe("started");
    expect(skipOffer(course, topic, first, { activities: { [first.id]: { status: "completed", attempts: 1, hintsUsed: 0, independent: true, lastAt: 1 } } }).allowed).toBe(true);
  });
});

describe("SkipMenu", () => {
  it("renders nothing while locked (no ⋯, no unlock hint); once allowed: ⋯ → entry → confirmation → skip; Escape closes", async () => {
    const onSkip = vi.fn();
    const { rerender, container } = render(<SkipMenu allowed={false} targetLabel="the next topic" onSkip={onSkip} />);
    const user = userEvent.setup();
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/skip/i)).toBeNull();

    rerender(<SkipMenu allowed targetLabel="the next topic" onSkip={onSkip} />);
    const button = screen.getByRole("button", { name: "More" });
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.click(button);
    expect(screen.getByRole("button", { name: "Skip to the challenge" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "Skip to the challenge" }));
    expect(screen.getByText(/Skip the remaining practice in this topic\? You can come back any time/)).toBeInTheDocument();
    expect(onSkip).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("group", { name: "Confirm skip" })).toBeNull();
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "Skip to the challenge" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

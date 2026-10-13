import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { courses } from "@/content";
import { completeActivity, completeQuestion, emptyProgress, markExplained, skipActivities, skipQuestion, skippedAhead, startActivity, firstUnfinishedQuestion } from "@/learner/progress";
import { skipOffer } from "@/shell/primaryAction";
import { chapterStatus, topicStatus } from "@/shell/r1/CourseTopics";
import { createRunnerReducer, initialRunnerState } from "./runnerReducer";
import { SkipMenu } from "./SkipMenu";

const course = courses.find((c) => c.id === "ecet111")!;
// a topic with several practices, and the one after it
const [topic, nextTopic] = (() => {
  const topics = course.modules.flatMap((m) => m.topics);
  const i = topics.findIndex((t) => t.activities.length > 1 && t.activities[0].questions.length > 1);
  return [topics[i], topics[i + 1]];
})();

describe("skip to next question (#579, #623, #661, PEDAGOGY)", () => {
  it("is on every question from the first visit: no gate on progress, hints or Explain Slowly", () => {
    const [first] = topic.activities;
    let p = startActivity(emptyProgress(course.offeringId), first.id, 1);
    expect(skipOffer(course, topic, first, 0).allowed).toBe(true);
    p = completeActivity(p, first.id, false, 2);
    p = markExplained(p, first.id);
    expect(p.activities[first.id].explained).toBe(true);
    expect(skipOffer(course, topic, first, 0).allowed).toBe(true);
    // a first practice of a first topic, nothing done anywhere
    const firstTopic = course.modules[0].topics[0];
    expect(skipOffer(course, firstTopic, firstTopic.activities[0], 0).allowed).toBe(true);
  });

  it("goes to the very next question; from the last question to the next practice; from the last practice to the next topic; from the course's last question to the course page", () => {
    const [first, second] = topic.activities;
    const last = topic.activities[topic.activities.length - 1];
    expect(skipOffer(course, topic, first, 0)).toMatchObject({ kind: "question", targetLabel: "the next question" });
    expect(skipOffer(course, topic, first, 0).href).toBeUndefined();
    const fromLastQuestion = skipOffer(course, topic, first, first.questions.length - 1);
    expect(fromLastQuestion).toMatchObject({ kind: "practice", href: `/courses/${course.id}/${topic.id}/${second.id}/` });
    expect(fromLastQuestion.targetLabel).toContain(second.title);
    const fromLastPractice = skipOffer(course, topic, last, last.questions.length - 1);
    expect(fromLastPractice).toMatchObject({ kind: "topic", href: `/courses/${course.id}/${nextTopic.id}/` });
    expect(fromLastPractice.targetLabel).toContain(nextTopic.title);
    const topics = course.modules.flatMap((m) => m.topics);
    const lastTopic = topics[topics.length - 1];
    const lastActivity = lastTopic.activities[lastTopic.activities.length - 1];
    expect(skipOffer(course, lastTopic, lastActivity, lastActivity.questions.length - 1)).toMatchObject({ kind: "course", href: `/courses/${course.id}/`, targetLabel: "the course page" });
  });

  it("the next immediate question, even one already done: never 'the next unfinished'", () => {
    const [first] = topic.activities;
    const reducer = createRunnerReducer(first);
    const completed = first.questions.map((_, i) => i === 1); // challenge 2 already done
    const s = { ...reducer(initialRunnerState(first), { type: "OPEN" }), completed };
    expect(reducer(s, { type: "SKIP_QUESTION" }).qIndex).toBe(1);
    expect(skipOffer(course, topic, first, 0).kind).toBe("question");
  });

  it("records the skipped question only: the practice stays unfinished, reads as skipped ahead, resumes at the skipped question; done later, it is no longer skipped", () => {
    const [first, second] = topic.activities;
    const [q1, q2] = second.questions;
    let p = completeActivity(startActivity(emptyProgress(course.offeringId), first.id, 1), first.id, true, 2);
    p = skipQuestion(startActivity(p, second.id, 3), second.id, q1.id);
    expect(p.activities[first.id].status).toBe("completed");
    expect(p.activities[second.id]).toMatchObject({ status: "started", skippedQuestions: [q1.id] });
    expect(skippedAhead(p.activities[second.id])).toBe(true);
    expect(skippedAhead(p.activities[first.id])).toBe(false);
    expect(firstUnfinishedQuestion(second, p.activities[second.id])).toBe(0);
    const status = topicStatus(topic, p);
    expect(status.completed).toBe(false);
    expect(status.text).toContain("skipped ahead");
    const chapter = course.modules.find((m) => m.topics.includes(topic))!;
    expect(chapterStatus(chapter, p).state).not.toBe("done");
    // the same skip twice records once; a finished question cannot be skipped
    expect(skipQuestion(p, second.id, q1.id)).toBe(p);
    p = completeQuestion(p, second.id, q2.id, 6);
    expect(skipQuestion(p, second.id, q2.id)).toBe(p);
    // done later: no longer skipped
    p = completeQuestion(p, second.id, q1.id, 8);
    expect(p.activities[second.id].skippedQuestions).toEqual([]);
    expect(skippedAhead(p.activities[second.id])).toBe(false);
    // a practice left by the first skip (#579) still reads as skipped ahead and restarts on return
    const old = skipActivities(p, [first.id], 9);
    expect(skippedAhead(old.activities[first.id])).toBe(false); // completed stays completed
    expect(startActivity(skipActivities(emptyProgress(course.offeringId), [second.id], 1), second.id, 2).activities[second.id].status).toBe("started");
  });

  it("reducer: SKIP_QUESTION opens the next question and leaves this one unfinished; GO_TO_QUESTION returns to it; nothing after the last (the page leaves instead)", () => {
    const activity = topic.activities[0];
    const reducer = createRunnerReducer(activity);
    let s = reducer(initialRunnerState(activity), { type: "OPEN" });
    s = reducer(s, { type: "SKIP_QUESTION" });
    expect(s.qIndex).toBe(1);
    expect(s.completed[0]).toBe(false);
    expect(s.done).toBe(false);
    s = reducer(s, { type: "GO_TO_QUESTION", index: 0 });
    expect(s.qIndex).toBe(0);
    const last = { ...s, qIndex: activity.questions.length - 1 };
    expect(reducer(last, { type: "SKIP_QUESTION" })).toBe(last);
  });
});

describe("SkipMenu", () => {
  it("renders nothing while locked (no ⋯, no unlock hint); once allowed: ⋯ → entry → confirmation → skip; Escape closes", async () => {
    const onSkip = vi.fn();
    const { rerender, container } = render(<SkipMenu allowed={false} targetLabel="the next question" onSkip={onSkip} />);
    const user = userEvent.setup();
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/skip/i)).toBeNull();

    rerender(<SkipMenu allowed targetLabel="the next question" onSkip={onSkip} />);
    const button = screen.getByRole("button", { name: "More" });
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.click(button);
    expect(screen.getByRole("button", { name: "Skip to next question" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "Skip to next question" }));
    expect(screen.getByText(/Skip this question\? You can come back any time\. This goes to the next question\./)).toBeInTheDocument();
    expect(onSkip).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("group", { name: "Confirm skip" })).toBeNull();
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "Skip to next question" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

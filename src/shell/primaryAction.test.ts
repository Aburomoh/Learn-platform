import { describe, expect, it } from "vitest";
import { getCourse } from "@/content";
import type { ActivityProgress, OfferingProgress } from "@/learner/progress";
import { courseAction, practiceAction, topicAction, topicRowAction } from "./primaryAction";

const course = getCourse("ecet111")!;
const topics = course.modules.flatMap((m) => m.topics);
const [first, second] = topics;
const last = topics[topics.length - 1];
const practice = (i: number) => topics[i].activities[0];

const record = (status: ActivityProgress["status"], lastAt = 1): ActivityProgress => ({ status, attempts: 0, hintsUsed: 0, independent: false, lastAt });
const progress = (activities: Record<string, ActivityProgress> = {}): Pick<OfferingProgress, "activities"> => ({ activities });
/** Every practice of a topic completed. */
const done = (topic: (typeof topics)[number], at = 1) => Object.fromEntries(topic.activities.map((a) => [a.id, record("completed", at)]));
const allDone = () => progress(Object.fromEntries(topics.flatMap((t) => t.activities.map((a) => [a.id, record("completed")]))));

describe("topicAction: the table in the IA note", () => {
  it("the course has at least two topics, each with a practice (test precondition)", () => {
    expect(topics.length).toBeGreaterThanOrEqual(2);
    expect(topics.every((t) => t.activities.length >= 1)).toBe(true);
  });

  it("no record → Start practice, to the practice", () => {
    const action = topicAction(course, first, progress());
    expect(action).toMatchObject({ kind: "start", primary: { label: "Start practice", href: `/courses/ecet111/${first.id}/${practice(0).id}/` } });
    expect(action.secondary).toBeUndefined();
  });

  it("status new counts as no record", () => {
    expect(topicAction(course, first, progress({ [practice(0).id]: record("new") })).kind).toBe("start");
  });

  it("started → Continue, to the same practice (the runner resumes at the first unfinished challenge)", () => {
    const action = topicAction(course, first, progress({ [practice(0).id]: record("started") }));
    expect(action).toMatchObject({ kind: "continue", primary: { label: "Continue", href: `/courses/ecet111/${first.id}/${practice(0).id}/` } });
    expect(action.secondary).toBeUndefined();
  });

  it("completed → Next topic (primary) to the next topic in course order, Review (secondary) restarts at challenge 1", () => {
    expect(topicAction(course, first, progress(done(first)))).toMatchObject({
      kind: "next-topic",
      primary: { label: "Next topic", href: `/courses/ecet111/${second.id}/` },
      secondary: { label: "Review", href: `/courses/ecet111/${first.id}/${practice(0).id}/?review=1` },
    });
  });

  it("completed last topic of the course → no Next topic; Review becomes primary", () => {
    const action = topicAction(course, last, allDone());
    expect(action).toMatchObject({ kind: "review", primary: { label: "Review" } });
    expect(action.secondary).toBeUndefined();
    expect(action.primary.href).toContain(`/${last.id}/`);
    expect(action.primary.href).toMatch(/\?review=1$/);
  });
});

describe("courseAction: course page and home", () => {
  it("first visit → Start practice on the first topic", () => {
    expect(courseAction(course, progress())).toMatchObject({ kind: "start", primary: { label: "Start practice" }, topic: { id: first.id } });
  });

  it("a practice in progress → Continue the most recently touched one", () => {
    const p = progress({ [practice(0).id]: record("started", 10), [practice(1).id]: record("started", 20) });
    expect(courseAction(course, p)).toMatchObject({ kind: "continue", primary: { label: "Continue", href: `/courses/ecet111/${second.id}/${practice(1).id}/` } });
  });

  it("first topic completed, nothing in progress → Start practice on the next unfinished topic", () => {
    const action = courseAction(course, progress(done(first)));
    expect(action).toMatchObject({ kind: "start", topic: { id: second.id } });
  });

  it("everything completed → Review the last topic", () => {
    expect(courseAction(course, allDone())).toMatchObject({ kind: "review", topic: { id: last.id } });
  });
});

describe("topicRowAction: the small button on a course-page row", () => {
  it("offers the row's own Start, Continue or Review, never Next topic", () => {
    expect(topicRowAction(course, first, progress()).kind).toBe("start");
    expect(topicRowAction(course, first, progress({ [practice(0).id]: record("started") })).kind).toBe("continue");
    const row = topicRowAction(course, first, progress(done(first)));
    expect(row).toMatchObject({ kind: "review", primary: { label: "Review", href: `/courses/ecet111/${first.id}/${practice(0).id}/?review=1` } });
    expect(row.secondary).toBeUndefined();
  });
});

describe("topics with more than one practice", () => {
  const multi = topics.find((t) => t.activities.length > 1);
  it.runIf(multi)("moves to the topic's next practice before offering Next topic", () => {
    const [a, b] = multi!.activities;
    const action = topicAction(course, multi!, progress({ [a.id]: record("completed") }));
    expect(action).toMatchObject({ kind: "start", primary: { href: `/courses/ecet111/${multi!.id}/${b.id}/` } });
    expect(topicAction(course, multi!, progress({ [a.id]: record("completed"), [b.id]: record("started") })).kind).toBe("continue");
  });
});

describe("practiceAction: one practice's own row", () => {
  it("is Start, Continue or Review from that practice's status alone", () => {
    const a = practice(0);
    const href = `/courses/ecet111/${first.id}/${a.id}/`;
    expect(practiceAction(course, first, a, progress())).toEqual({ kind: "start", link: { label: "Start", href } });
    expect(practiceAction(course, first, a, progress({ [a.id]: record("new") })).kind).toBe("start");
    expect(practiceAction(course, first, a, progress({ [a.id]: record("started") }))).toEqual({ kind: "continue", link: { label: "Continue", href } });
    expect(practiceAction(course, first, a, progress({ [a.id]: record("completed") }))).toEqual({ kind: "review", link: { label: "Review", href: `${href}?review=1` } });
  });
});

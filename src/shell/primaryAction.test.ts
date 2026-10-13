import { describe, expect, it } from "vitest";
import { getCourse } from "@/content";
import type { ActivityProgress, OfferingProgress } from "@/learner/progress";
import { courseAction, practiceAction, topicAction, topicRowAction, topicRowLink } from "./primaryAction";

const course = getCourse("ecet111")!;
const topics = course.modules.flatMap((m) => m.topics);
const [first, second] = topics;
const last = topics[topics.length - 1];
const practice = (i: number) => topics[i].activities[0];

/** A record with meaningful progress: `started` carries one attempt (ADR-0013). */
const record = (status: ActivityProgress["status"], lastAt = 1): ActivityProgress => ({ status, attempts: status === "started" ? 1 : 0, hintsUsed: 0, independent: false, lastAt });
/** `started` with no attempt and nothing done: what older builds wrote on mount, or an Explain Slowly alone. */
const visited = (lastAt = 1, explained = false): ActivityProgress => ({ status: "started", attempts: 0, hintsUsed: 0, independent: false, lastAt, ...(explained ? { explained } : {}) });
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
    expect(action).toMatchObject({ kind: "start", primary: { label: `Start · ${practice(0).title}`, href: `/courses/ecet111/${first.id}/${practice(0).id}/` } });
    expect(action.secondary).toBeUndefined();
  });

  it("status new counts as no record", () => {
    expect(topicAction(course, first, progress({ [practice(0).id]: record("new") })).kind).toBe("start");
  });

  it("visited only, or explained only, is not in progress: Start, as with no record (ADR-0013, owner refinement 3)", () => {
    expect(topicAction(course, first, progress({ [practice(0).id]: visited() })).kind).toBe("start");
    expect(topicAction(course, first, progress({ [practice(0).id]: visited(5, true) })).kind).toBe("start");
    // a done question without an attempt counts (a credited split, ADR-0013 rule 7)
    expect(topicAction(course, first, progress({ [practice(0).id]: { ...visited(), completedQuestions: [practice(0).questions[0].id] } })).kind).toBe("continue");
  });

  it("started → Continue, to the same practice (the runner resumes at the first unfinished challenge)", () => {
    const action = topicAction(course, first, progress({ [practice(0).id]: record("started") }));
    expect(action).toMatchObject({ kind: "continue", primary: { label: `Continue · ${practice(0).title}`, href: `/courses/ecet111/${first.id}/${practice(0).id}/` } });
    expect(action.secondary).toBeUndefined();
  });

  it("completed → Next topic (primary) to the next topic in course order, Review (secondary) restarts at challenge 1", () => {
    expect(topicAction(course, first, progress(done(first)))).toMatchObject({
      kind: "next-topic",
      primary: { label: `Next topic · ${second.title}`, href: `/courses/ecet111/${second.id}/` },
      secondary: { label: `Review · ${practice(0).title}`, href: `/courses/ecet111/${first.id}/${practice(0).id}/?review=1` },
    });
  });

  it("completed last topic of the course → no Next topic; Review becomes primary", () => {
    const action = topicAction(course, last, allDone());
    expect(action).toMatchObject({ kind: "review", primary: { label: `Review · ${last.activities[0].title}` } }); // a finished topic reviews its first practice
    expect(action.secondary).toBeUndefined();
    expect(action.primary.href).toContain(`/${last.id}/`);
    expect(action.primary.href).toMatch(/\?review=1$/);
  });
});

describe("courseAction: course page and home", () => {
  it("first visit → Start practice on the first topic", () => {
    expect(courseAction(course, progress())).toMatchObject({ kind: "start", primary: { label: `Start · ${practice(0).title}` }, topic: { id: first.id } });
  });

  it("a practice in progress → Continue the one with the newest meaningful lastAt", () => {
    const p = progress({ [practice(0).id]: record("started", 10), [practice(1).id]: record("started", 20) });
    expect(courseAction(course, p)).toMatchObject({ kind: "continue", primary: { label: `Continue · ${practice(1).title}`, href: `/courses/ecet111/${second.id}/${practice(1).id}/` } });
  });

  it("a visited-only or explained-only record is never Continue, even with the newest lastAt (ADR-0013 rules 4 and 6)", () => {
    expect(courseAction(course, progress({ [practice(1).id]: visited(99) }))).toMatchObject({ kind: "start", topic: { id: first.id } });
    expect(courseAction(course, progress({ [practice(1).id]: visited(99, true) }))).toMatchObject({ kind: "start", topic: { id: first.id } });
    const p = progress({ [practice(0).id]: record("started", 10), [practice(1).id]: visited(99) });
    expect(courseAction(course, p)).toMatchObject({ kind: "continue", topic: { id: first.id } });
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
    expect(row).toMatchObject({ kind: "review", primary: { label: `Review · ${practice(0).title}`, href: `/courses/ecet111/${first.id}/${practice(0).id}/?review=1` } });
    expect(row.secondary).toBeUndefined();
  });
});

describe("topicRowLink: the quiet link of a course-page row (epic #670, QW1)", () => {
  const multi = topics.find((t) => t.activities.length > 1)!;
  const single = topics.find((t) => t.activities.length === 1)!;
  it("a topic with several practices opens its page, where the practices are chosen", () => {
    expect(topicRowLink(course, multi, progress())).toMatchObject({ label: "Open topic", href: `/courses/ecet111/${multi.id}/` });
    expect(topicRowLink(course, multi, progress(done(multi))).label).toBe("Open topic");
  });
  it("every catalogue label carries its template and slots for the Arabic layer (#705)", () => {
    const a = first.activities[0];
    expect(practiceAction(course, first, a, progress()).link).toMatchObject({ template: "Start · {title}", vars: { title: a.title } });
    expect(topicRowLink(course, multi, progress()).template).toBe("Open topic");
    expect(courseAction(course, allDone()).primary.template).toBe("Review · {title}");
  });

  it("a one-practice topic goes straight to the practice, naming it", () => {
    const a = single.activities[0];
    expect(topicRowLink(course, single, progress())).toMatchObject({ label: `Start · ${a.title}`, href: `/courses/ecet111/${single.id}/${a.id}/` });
    expect(topicRowLink(course, single, progress({ [a.id]: record("started") })).label).toBe(`Continue · ${a.title}`);
    expect(topicRowLink(course, single, progress(done(single))).label).toBe(`Review · ${a.title}`);
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
    expect(practiceAction(course, first, a, progress())).toMatchObject({ kind: "start", link: { label: `Start · ${a.title}`, href } });
    expect(practiceAction(course, first, a, progress({ [a.id]: record("new") })).kind).toBe("start");
    expect(practiceAction(course, first, a, progress({ [a.id]: record("started") }))).toMatchObject({ kind: "continue", link: { label: `Continue · ${a.title}`, href } });
    expect(practiceAction(course, first, a, progress({ [a.id]: visited() })).kind).toBe("start");
    expect(practiceAction(course, first, a, progress({ [a.id]: visited(1, true) })).kind).toBe("start");
    expect(practiceAction(course, first, a, progress({ [a.id]: record("completed") }))).toMatchObject({ kind: "review", link: { label: `Review · ${a.title}`, href: `${href}?review=1` } });
  });
});

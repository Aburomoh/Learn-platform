/**
 * The one primary action of a page (R1 redesign; docs/design/information-architecture.md
 * "Primary action", as amended by the accepted UX proposal §2). Pure: content order plus the
 * local progress record in, a label and a link out. No React, no storage access.
 *
 * | Local progress | Button                                   | Goes to                        |
 * |----------------|------------------------------------------|--------------------------------|
 * | No record      | Start practice                           | the practice (challenge 1)     |
 * | started        | Continue                                 | the practice (runner resumes)  |
 * | completed      | Next topic (primary), Review (secondary) | next topic; Review = challenge 1 |
 * Completed last topic of the course: no Next topic; Review becomes primary.
 */
import type { Activity, Course, Topic } from "@/content/schema";
import type { ActivityProgress, OfferingProgress } from "@/learner/progress";

export interface ActionLink {
  label: string;
  href: string;
}

export type ActionKind = "start" | "continue" | "next-topic" | "review";

export interface PrimaryAction {
  kind: ActionKind;
  primary: ActionLink;
  /** A quiet text action beside the button (e.g. Review). */
  secondary?: ActionLink;
  /** The topic and practice the action is about (for the panel around the button). */
  topic: Topic;
  activity: Activity;
}

type Progress = Pick<OfferingProgress, "activities">;

export const topicHref = (course: Course, topic: Topic) => `/courses/${course.id}/${topic.id}/`;
export const practiceHref = (course: Course, topic: Topic, activity: Activity) => `${topicHref(course, topic)}${activity.id}/`;
/** Review restarts at challenge 1 instead of resuming (read by the activity page, #119). */
export const reviewHref = (course: Course, topic: Topic, activity: Activity) => `${practiceHref(course, topic, activity)}?review=1`;

const topicsOf = (course: Course): Topic[] => course.modules.flatMap((m) => m.topics);

function statusOf(progress: Progress, activity: Activity): ActivityProgress["status"] {
  return progress.activities[activity.id]?.status ?? "new";
}

/** The practice a topic's button is about: its first unfinished one, else its first. */
function currentPractice(topic: Topic, progress: Progress): Activity {
  return topic.activities.find((a) => statusOf(progress, a) !== "completed") ?? topic.activities[0];
}

const isCompleted = (topic: Topic, progress: Progress) => topic.activities.every((a) => statusOf(progress, a) === "completed");

/** One practice's own action, for a row that lists it: Start, Continue or Review. */
export function practiceAction(course: Course, topic: Topic, activity: Activity, progress: Progress): { kind: "start" | "continue" | "review"; link: ActionLink } {
  const status = statusOf(progress, activity);
  if (status === "completed") return { kind: "review", link: { label: "Review", href: reviewHref(course, topic, activity) } };
  if (status === "started") return { kind: "continue", link: { label: "Continue", href: practiceHref(course, topic, activity) } };
  return { kind: "start", link: { label: "Start", href: practiceHref(course, topic, activity) } };
}

/** Topic page: follows the table above for this topic's current practice. */
export function topicAction(course: Course, topic: Topic, progress: Progress): PrimaryAction {
  const activity = currentPractice(topic, progress);
  const status = statusOf(progress, activity);
  if (!isCompleted(topic, progress)) {
    return status === "started"
      ? { kind: "continue", primary: { label: "Continue", href: practiceHref(course, topic, activity) }, topic, activity }
      : { kind: "start", primary: { label: "Start practice", href: practiceHref(course, topic, activity) }, topic, activity };
  }
  const review: ActionLink = { label: "Review", href: reviewHref(course, topic, activity) };
  const topics = topicsOf(course);
  const next = topics[topics.findIndex((t) => t.id === topic.id) + 1];
  if (!next) return { kind: "review", primary: review, topic, activity };
  return { kind: "next-topic", primary: { label: "Next topic", href: topicHref(course, next) }, secondary: review, topic, activity };
}

/**
 * Course page and home: the same rule applied to the course as a whole.
 * - a practice in progress → Continue the most recently touched one;
 * - otherwise → Start practice on the first topic that is not completed;
 * - everything completed → Review the last topic.
 */
export function courseAction(course: Course, progress: Progress): PrimaryAction {
  const topics = topicsOf(course);
  let latest: { topic: Topic; activity: Activity; at: number } | undefined;
  for (const topic of topics)
    for (const activity of topic.activities) {
      const record = progress.activities[activity.id];
      if (record?.status === "started" && (!latest || record.lastAt > latest.at)) latest = { topic, activity, at: record.lastAt };
    }
  if (latest) return { kind: "continue", primary: { label: "Continue", href: practiceHref(course, latest.topic, latest.activity) }, topic: latest.topic, activity: latest.activity };

  const open = topics.find((t) => !isCompleted(t, progress));
  if (open) return topicAction(course, open, progress);
  return topicAction(course, topics[topics.length - 1], progress);
}

/** A small button on a topic row of the course page: its own Start / Continue / Review. */
export function topicRowAction(course: Course, topic: Topic, progress: Progress): PrimaryAction {
  const action = topicAction(course, topic, progress);
  if (action.kind !== "next-topic") return action;
  // On a row, a completed topic offers its own Review; "Next topic" belongs to the page button.
  return { kind: "review", primary: action.secondary!, topic, activity: action.activity };
}

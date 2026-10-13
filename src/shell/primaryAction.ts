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
import { messageTemplate, resolveMessage } from "@/tutor/messages";
import type { ActivityProgress, OfferingProgress } from "@/learner/progress";

export interface ActionLink {
  label: string;
  href: string;
  /** The catalogue template of the label and its slots (#705): rendered through the Arabic layer. */
  template?: string;
  vars?: Record<string, string | number>;
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

export const courseHref = (course: Course) => `/courses/${course.id}/`;
export const topicHref = (course: Course, topic: Topic) => `${courseHref(course)}${topic.id}/`;
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

/** Labels name their destination (epic #670, QW2): "Start · Binary addition", "Next topic · Latches". */
export const actionLabel = (kind: "start" | "continue" | "review" | "next-topic", title: string) => resolveMessage(`ui.action.${kind}`, { title });

/** A link whose label is a catalogue string with the title in its slot; the template rides along for the Arabic layer (#705). */
export const actionLink = (kind: "start" | "continue" | "review" | "next-topic", title: string, href: string): ActionLink => ({
  label: actionLabel(kind, title),
  href,
  template: messageTemplate(`ui.action.${kind}`),
  vars: { title },
});

/** One practice's own action, for a row that lists it: Start, Continue or Review. */
export function practiceAction(course: Course, topic: Topic, activity: Activity, progress: Progress): { kind: "start" | "continue" | "review"; link: ActionLink } {
  const status = statusOf(progress, activity);
  if (status === "completed") return { kind: "review", link: actionLink("review", activity.title, reviewHref(course, topic, activity)) };
  if (status === "started") return { kind: "continue", link: actionLink("continue", activity.title, practiceHref(course, topic, activity)) };
  return { kind: "start", link: actionLink("start", activity.title, practiceHref(course, topic, activity)) };
}

/** Topic page: follows the table above for this topic's current practice. */
export function topicAction(course: Course, topic: Topic, progress: Progress): PrimaryAction {
  const activity = currentPractice(topic, progress);
  const status = statusOf(progress, activity);
  if (!isCompleted(topic, progress)) {
    return status === "started"
      ? { kind: "continue", primary: actionLink("continue", activity.title, practiceHref(course, topic, activity)), topic, activity }
      : { kind: "start", primary: actionLink("start", activity.title, practiceHref(course, topic, activity)), topic, activity };
  }
  const review: ActionLink = actionLink("review", activity.title, reviewHref(course, topic, activity));
  const topics = topicsOf(course);
  const next = topics[topics.findIndex((t) => t.id === topic.id) + 1];
  if (!next) return { kind: "review", primary: review, topic, activity };
  return { kind: "next-topic", primary: actionLink("next-topic", next.title, topicHref(course, next)), secondary: review, topic, activity };
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
  if (latest) return { kind: "continue", primary: actionLink("continue", latest.activity.title, practiceHref(course, latest.topic, latest.activity)), topic: latest.topic, activity: latest.activity };

  const open = topics.find((t) => !isCompleted(t, progress));
  if (open) return topicAction(course, open, progress);
  return topicAction(course, topics[topics.length - 1], progress);
}

/**
 * The hidden skip (#579, PEDAGOGY "Hidden skip"). Open once one practice of the topic was completed
 * first-try (`independent`) without Explain Slowly. From an earlier practice it goes to the topic's
 * last practice at challenge 1; from the last practice to the next topic. The practices passed over
 * are recorded as skipped (never completed).
 */
export interface SkipOffer {
  /** Always true since #661 (owner): the skip is on every question. Kept so the menu can still be told to hide. */
  allowed: boolean;
  /** `question`: the next question of this practice (in the runner, no navigation). `practice`: the next practice's first question. `topic`: the next topic's page. `course`: the course page, after the course's very last question. */
  kind: "question" | "practice" | "topic" | "course";
  /** Where the page goes for `practice`, `topic` and `course`. */
  href?: string;
  /** What the skip goes to, in words, for the confirmation. */
  targetLabel: string;
}

/**
 * Skip to next question (owner, 2026-10-11, #661): available on every question, no gate. It goes to
 * the very next question of the practice (done or not); from the last question to the next
 * practice's first; from the last practice of a topic to the next topic; from the course's last
 * question to the course page. Only the skipped question is recorded (`skipQuestion`); the practice
 * is never completed by a skip.
 */
export function skipOffer(course: Course, topic: Topic, activity: Activity, qIndex: number): SkipOffer {
  if (qIndex + 1 < activity.questions.length) return { allowed: true, kind: "question", targetLabel: "the next question" };
  const i = topic.activities.findIndex((a) => a.id === activity.id);
  const nextPractice = i >= 0 ? topic.activities[i + 1] : undefined;
  if (nextPractice) return { allowed: true, kind: "practice", href: practiceHref(course, topic, nextPractice), targetLabel: `the next practice, ${nextPractice.title}` };
  const topics = topicsOf(course);
  const next = topics[topics.findIndex((t) => t.id === topic.id) + 1];
  if (next) return { allowed: true, kind: "topic", href: topicHref(course, next), targetLabel: `the next topic, ${next.title}` };
  return { allowed: true, kind: "course", href: courseHref(course), targetLabel: "the course page" };
}

/** A small button on a topic row of the course page: its own Start / Continue / Review. */
export function topicRowAction(course: Course, topic: Topic, progress: Progress): PrimaryAction {
  const action = topicAction(course, topic, progress);
  if (action.kind !== "next-topic") return action;
  // On a row, a completed topic offers its own Review; "Next topic" belongs to the page button.
  return { kind: "review", primary: action.secondary!, topic, activity: action.activity };
}

/**
 * The quiet action of a course-page topic row (epic #670, QW1): a topic with several practices
 * opens its page, where the practices are chosen; a one-practice topic goes straight to that
 * practice with its own Start / Continue / Review.
 */
export function topicRowLink(course: Course, topic: Topic, progress: Progress): ActionLink {
  if (topic.activities.length > 1) return { label: resolveMessage("ui.action.open-topic"), href: topicHref(course, topic), template: messageTemplate("ui.action.open-topic") };
  return topicRowAction(course, topic, progress).primary;
}

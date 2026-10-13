"use client";

import Link from "next/link";
import type { Activity, Topic } from "@/content/schema";
import { Notation } from "@/interactions/shared/Notation";
import { PrimaryAction } from "@/shell/r1/PrimaryAction";
import { UiText, useUiText } from "@/shell/r1/uiText";
import { messageTemplate } from "@/tutor/messages";
import type { PrimaryAction as NextAction } from "@/shell/primaryAction";
import styles from "./Stage.module.css";

/**
 * The objectives a practice can vouch for (#713): only those its questions carry, each once, in the
 * topic's order. A student who entered one practice directly is never told they can do the rest.
 */
export function practiceObjectives(topic: Pick<Topic, "objectives">, activity: Pick<Activity, "questions">): string[] {
  const ids = new Set(activity.questions.map((q) => q.objectiveId));
  return topic.objectives.filter((o) => ids.has(o.id)).map((o) => o.text);
}

export interface ActivitySummaryProps {
  activity: Activity;
  /** The topic's objectives, shown as a self-check now that the practice is done. */
  objectives: string[];
  attempts: number;
  hintsUsed: number;
  /** The same next action the topic page offers (Next topic, the next practice, or Review). */
  next: NextAction;
  topicHref: string;
  /** Quiet exits beside the filled Next (S2, #680): the topic's practice list and the course map. */
  practicesHref?: string;
  courseHref?: string;
  onRestart: () => void;
}

/**
 * End of a practice: what was done, the objectives as a "You can now" self-check, and one next
 * action (the page's only filled button), with quieter ways back.
 */
export function ActivitySummary({ activity, objectives, attempts, hintsUsed, next, topicHref, practicesHref, courseHref, onRestart }: ActivitySummaryProps) {
  // Review of this same practice is offered as "Practise again", so it is not repeated as a link.
  const primary = next.kind === "review" ? { label: "Back to topic", href: topicHref, template: messageTemplate("ui.summary.back") } : next.primary;
  // the sentence and its count phrases are catalogue strings read through the Arabic layer (#705); the title stays English
  const { t, tp } = useUiText();
  return (
    <section className={styles.stage} aria-label="Practice complete" data-testid="activity-summary">
      <h2 className={styles.summaryTitle}>
        <UiText k="ui.summary.title" />
      </h2>
      <p>
        <UiText
          k="ui.summary.line"
          vars={{
            activity: activity.title,
            challenges: tp("ui.summary.challenges", activity.questions.length),
            attempts: tp("ui.summary.attempts", attempts),
            hints: hintsUsed === 0 ? t("ui.summary.hints.zero") : tp("ui.summary.hints", hintsUsed),
          }}
        />
      </p>
      {objectives.length > 0 && (
        <div>
          <p className={styles.summaryLead}>
            <UiText k="ui.summary.you-can" />
          </p>
          <ul className={styles.summaryList}>
            {objectives.map((text) => (
              <li key={text}>
                <Notation text={text} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.summaryActions}>
        <PrimaryAction primary={primary} />
        <div className={styles.actions}>
          <button type="button" className="btn btn-quiet" onClick={onRestart}>
            <UiText k="ui.summary.again" />
          </button>
          {next.kind !== "review" && (
            <Link href={topicHref} className="btn btn-quiet">
              <UiText k="ui.summary.back" />
            </Link>
          )}
          {practicesHref && (
            <Link href={practicesHref} className="btn btn-quiet">
              <UiText k="ui.summary.another" />
            </Link>
          )}
          {courseHref && (
            <Link href={courseHref} className="btn btn-quiet">
              <UiText k="ui.summary.course-map" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

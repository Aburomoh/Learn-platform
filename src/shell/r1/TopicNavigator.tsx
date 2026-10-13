"use client";

import Link from "next/link";
import type { Activity, Course, Topic } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import { effectiveDone, type OfferingProgress } from "@/learner/progress";
import { kindWords, kindsOf } from "../kindWords";
import { practiceAction } from "../primaryAction";
import { hasMessage, pluralKey } from "@/tutor/messages";
import { useHydrated } from "../useHydrated";
import { ActionText, UiText, useUiText } from "./uiText";
import styles from "./r1.module.css";

export interface PracticeRowsProps {
  course: Course;
  topic: Topic;
  progress: Pick<OfferingProgress, "activities">;
  /** The practice the page's filled button is about: its row has no second button ("Up next" / "In progress"). */
  upNextId?: string;
  /** The practice the student is on (the practice page's navigator): marked, `aria-current="page"`, no link. */
  currentId?: string;
}

/**
 * The topic's practices, one compact row each (epic #670, QW5 + owner refinement 1): the name, then
 * its status, kind in plain words and step labels, so the student knows what a practice is before
 * entering. Shared by the topic page (`TopicNext`) and the practice page's navigator (S2, #680).
 * Challenge labels are shown for finding, never linked (step entry is S3, declared entries only).
 */
export function PracticeRows({ course, topic, progress, upNextId, currentId }: PracticeRowsProps) {
  return (
    <ol className={styles.practiceList}>
      {topic.activities.map((a) => {
        const own = practiceAction(course, topic, a, progress);
        const count = effectiveDone(a, progress.activities[a.id]).completed.size;
        const status = own.kind === "review" ? <UiText k="ui.status.completed" /> : own.kind === "continue" ? <UiText k="ui.status.challenges-done" vars={{ done: count, total: a.questions.length }} /> : <UiText k="ui.effort.minutes" vars={{ n: a.minutes }} />;
        const labels = a.questions.map((q) => q.label).filter(Boolean);
        // fewer than two labels: the challenge count alone (the minutes are already in `status`)
        const steps = labels.length > 1 ? labels.join(" → ") : <UiText k={pluralKey("ui.effort.short-challenges", a.questions.length, "en")} vars={{ n: a.questions.length }} />;
        // the kind words are catalogue strings, each read through the Arabic layer (#705)
        const kinds = kindsOf(a);
        const upNext = a.id === upNextId;
        const current = a.id === currentId;
        return (
          <li key={a.id} className={styles.practiceRow} data-status={own.kind} data-up-next={upNext || undefined} data-current={current || undefined} aria-current={current ? "page" : undefined} data-kinds={kindWords(a)}>
            <div className={styles.practiceText}>
              <h3 className={styles.topicTitle}>{a.title}</h3>
              <p className={`${styles.practiceMeta} ${own.kind === "review" ? styles.topicDone : ""}`}>
                {status}
                {kinds.map((kind) => (
                  <span key={kind}>
                    {" · "}
                    {/* each kind word isolated (Auditor on #702): an Arabic word between English separators keeps its place */}
                    <bdi>{hasMessage(`ui.kind.${kind}`) ? <UiText k={`ui.kind.${kind}`} /> : kind}</bdi>
                  </span>
                ))}
                {steps ? <> · {steps}</> : ""}
              </p>
            </div>
            {current ? (
              <span className={styles.upNext}>
                <UiText k="ui.row.here" />
              </span>
            ) : upNext ? (
              <span className={styles.upNext}>{own.kind === "continue" ? <UiText k="ui.row.in-progress" /> : <UiText k="ui.row.up-next" />}</span>
            ) : (
              <Link href={own.link.href} className={`${styles.quiet} ${styles.rowAction} ${styles.rowActionWrap}`}>
                <ActionText link={own.link} /> <span aria-hidden="true">→</span>
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * "Practices in this topic (3 of 8)" on the practice page (S2, #680; IA §4.3b): a collapsed
 * disclosure under the location line with the same rows as the topic page, the current practice
 * marked. A navigator, not a stage control: it reads progress for the rows' Start / Continue /
 * Review and never writes it, and it never touches the runner. Opening a row enters that practice
 * at challenge 1 (or at a declared entry, S3). Nothing for a one-practice topic.
 */
export function TopicNavigator({ course, topic, activity }: { course: Course; topic: Topic; activity: Activity }) {
  const [progress] = useOfferingProgress(course.offeringId);
  const ready = useHydrated();
  const { t } = useUiText();
  if (topic.activities.length < 2) return null;
  const k = topic.activities.findIndex((a) => a.id === activity.id) + 1;
  const n = topic.activities.length;
  return (
    <details className={styles.navigator} data-testid="topic-navigator">
      <summary className={styles.navigatorSummary} aria-label={t("ui.nav.practices-count", { k, n })}>
        <UiText k="ui.nav.practices-count" vars={{ k, n }} />
        <span aria-hidden="true" className={styles.navigatorChevron} />
      </summary>
      <nav aria-label={t("ui.topic.practices-in")} className={styles.navigatorList} style={ready ? undefined : { visibility: "hidden" }} aria-busy={!ready}>
        <PracticeRows course={course} topic={topic} progress={progress} currentId={activity.id} />
      </nav>
    </details>
  );
}

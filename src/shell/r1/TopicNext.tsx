"use client";

import Link from "next/link";
import type { Course, Topic } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import { effectiveDone, inProgress } from "@/learner/progress";
import { kindWords, kindsOf } from "../kindWords";
import { practiceAction, topicAction } from "../primaryAction";
import { hasMessage } from "@/tutor/messages";
import { ChallengeSteps, stepsFrom } from "./ChallengeSteps";
import { PrimaryAction, effortLine } from "./PrimaryAction";
import { ActionText, LineText, UiText, useUiText } from "./uiText";
import { pluralKey } from "@/tutor/messages";
import { useHydrated } from "../useHydrated";
import styles from "./r1.module.css";

/**
 * "What do I do next" on the topic page: the one primary button (Start practice / Continue /
 * Next topic, from the resolver), the effort cue, and the challenge steps of the practice it is
 * about. A topic with several practices also lists them, each with its own quiet action.
 *
 * Progress lives in this browser, so the block is only shown once it has been read: a returning
 * student never sees "Start practice" flash before "Continue".
 */
export function TopicNext({ course, topic }: { course: Course; topic: Topic }) {
  const [progress] = useOfferingProgress(course.offeringId);
  const ready = useHydrated();
  const action = topicAction(course, topic, progress);
  const { activity } = action;
  const record = progress.activities[activity.id];
  // a finished practice that gained questions shows them open (§6.1 rule 4)
  const done = [...effectiveDone(activity, record).completed];
  const finished = action.kind === "next-topic" || action.kind === "review";
  const several = topic.activities.length > 1;
  const { t } = useUiText();

  return (
    <div className={styles.next} style={ready ? undefined : { visibility: "hidden" }} aria-busy={!ready} data-action={action.kind}>
      <PrimaryAction
        primary={action.primary}
        secondary={action.secondary}
        caption={action.kind !== "review" ? <UiText k="ui.action.recommended" /> : undefined}
        effort={finished ? <UiText k="ui.effort.completed-topic" /> : several ? <UiText k="ui.effort.minutes-lead" vars={{ n: activity.minutes }} /> : <LineText line={effortLine(activity.questions.length, activity.minutes)} />}
      />
      {!finished && (
        <div className={styles.stepsBlock}>
          {/* with several practices, say which one the steps belong to */}
          {several && (
            <p className={styles.stepsLabel}>
              <UiText k={pluralKey("ui.topic.practice-challenges", activity.questions.length, "en")} vars={{ title: activity.title, n: activity.questions.length }} />
            </p>
          )}
          <ChallengeSteps steps={stepsFrom(activity.questions, done, inProgress(record, activity))} label={several ? t("ui.topic.challenges-of", { title: activity.title }) : t("ui.topic.challenges")} />
        </div>
      )}

      {topic.activities.length > 1 && (
        <section className={styles.practices} aria-labelledby="practices-h">
          <h2 id="practices-h" className={styles.h2}>
            <UiText k="ui.topic.practices-in" />
          </h2>
          <ol className={styles.practiceList}>
            {topic.activities.map((a) => {
              const own = practiceAction(course, topic, a, progress);
              const count = effectiveDone(a, progress.activities[a.id]).completed.size;
              // two compact lines (epic #670, QW5 + owner refinement 1): the name, then its status, kind in
              // plain words and the step labels, so the student knows what a practice is before entering
              const status = own.kind === "review" ? <UiText k="ui.status.completed" /> : own.kind === "continue" ? <UiText k="ui.status.challenges-done" vars={{ done: count, total: a.questions.length }} /> : <UiText k="ui.effort.minutes" vars={{ n: a.minutes }} />;
              const labels = a.questions.map((q) => q.label).filter(Boolean);
              // fewer than two labels: the challenge count alone (the minutes are already in `status`)
              const steps = labels.length > 1 ? labels.join(" → ") : <UiText k={pluralKey("ui.effort.short-challenges", a.questions.length, "en")} vars={{ n: a.questions.length }} />;
              // the kind words are catalogue strings, each read through the Arabic layer (#705)
              const kinds = kindsOf(a);
              // The practice the page button is about has no second button: the primary is its button.
              const upNext = !finished && a.id === activity.id;
              return (
                <li key={a.id} className={styles.practiceRow} data-status={own.kind} data-up-next={upNext || undefined} data-kinds={kindWords(a)}>
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
                  {upNext ? (
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
        </section>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import type { Course, Topic } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import { inProgress } from "@/learner/progress";
import { kindWords } from "../kindWords";
import { practiceAction, topicAction } from "../primaryAction";
import { resolveMessage } from "@/tutor/messages";
import { ChallengeSteps, stepsFrom } from "./ChallengeSteps";
import { PrimaryAction, effortCue } from "./PrimaryAction";
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
  const done = record?.status === "completed" ? activity.questions.map((q) => q.id) : (record?.completedQuestions ?? []);
  const finished = action.kind === "next-topic" || action.kind === "review";
  const several = topic.activities.length > 1;

  return (
    <div className={styles.next} style={ready ? undefined : { visibility: "hidden" }} aria-busy={!ready} data-action={action.kind}>
      <PrimaryAction
        primary={action.primary}
        secondary={action.secondary}
        caption={action.kind !== "review" ? resolveMessage("ui.action.recommended") : undefined}
        effort={finished ? "Completed. You can review it any time." : several ? `About ${activity.minutes} min` : effortCue(activity.questions.length, activity.minutes)}
      />
      {!finished && (
        <div className={styles.stepsBlock}>
          {/* with several practices, say which one the steps belong to */}
          {several && (
            <p className={styles.stepsLabel}>
              {activity.title} · {activity.questions.length} short challenge{activity.questions.length === 1 ? "" : "s"}
            </p>
          )}
          <ChallengeSteps steps={stepsFrom(activity.questions, done, inProgress(record))} label={several ? `Challenges of ${activity.title}` : "Challenges"} />
        </div>
      )}

      {topic.activities.length > 1 && (
        <section className={styles.practices} aria-labelledby="practices-h">
          <h2 id="practices-h" className={styles.h2}>
            Practices in this topic
          </h2>
          <ol className={styles.practiceList}>
            {topic.activities.map((a) => {
              const own = practiceAction(course, topic, a, progress);
              const count = progress.activities[a.id]?.completedQuestions?.length ?? 0;
              // two compact lines (epic #670, QW5 + owner refinement 1): the name, then its status, kind in
              // plain words and the step labels, so the student knows what a practice is before entering
              const status = own.kind === "review" ? "Completed" : own.kind === "continue" ? `${count} of ${a.questions.length} challenges done` : `about ${a.minutes} min`;
              const labels = a.questions.map((q) => q.label).filter(Boolean);
              // fewer than two labels: the challenge count alone (the minutes are already in `status`)
              const steps = labels.length > 1 ? labels.join(" → ") : `${a.questions.length} short challenge${a.questions.length === 1 ? "" : "s"}`;
              const meta = [status, kindWords(a), steps].filter(Boolean).join(" · ");
              // The practice the page button is about has no second button: the primary is its button.
              const upNext = !finished && a.id === activity.id;
              return (
                <li key={a.id} className={styles.practiceRow} data-status={own.kind} data-up-next={upNext || undefined} data-kinds={kindWords(a)}>
                  <div className={styles.practiceText}>
                    <h3 className={styles.topicTitle}>{a.title}</h3>
                    <p className={`${styles.practiceMeta} ${own.kind === "review" ? styles.topicDone : ""}`}>{meta}</p>
                  </div>
                  {upNext ? (
                    <span className={styles.upNext}>{own.kind === "continue" ? "In progress" : "Up next"}</span>
                  ) : (
                    <Link href={own.link.href} className={`${styles.quiet} ${styles.rowAction} ${styles.rowActionWrap}`}>
                      {own.link.label} <span aria-hidden="true">→</span>
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

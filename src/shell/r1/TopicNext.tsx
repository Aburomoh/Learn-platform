"use client";

import Link from "next/link";
import type { Course, Topic } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import { practiceAction, topicAction } from "../primaryAction";
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
          <ChallengeSteps steps={stepsFrom(activity.questions, done, record?.status === "started")} label={several ? `Challenges of ${activity.title}` : "Challenges"} />
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
              const line = own.kind === "review" ? "Completed" : own.kind === "continue" ? `${count} of ${a.questions.length} challenges done` : effortCue(a.questions.length, a.minutes);
              // The practice the page button is about has no second button: the primary is its button.
              const upNext = !finished && a.id === activity.id;
              return (
                <li key={a.id} className={styles.practiceRow} data-status={own.kind} data-up-next={upNext || undefined}>
                  <div className={styles.practiceText}>
                    <h3 className={styles.topicTitle}>{a.title}</h3>
                    <p className={`${styles.topicStatus} ${own.kind === "review" ? styles.topicDone : styles.statusMuted}`}>{line}</p>
                  </div>
                  {upNext ? (
                    <span className={styles.upNext}>{own.kind === "continue" ? "In progress" : "Up next"}</span>
                  ) : (
                    <Link href={own.link.href} className={`${styles.quiet} ${styles.rowAction}`} aria-label={`${own.link.label}: ${a.title}`}>
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

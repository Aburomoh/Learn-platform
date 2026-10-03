"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Course, Topic } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import { practiceHref, reviewHref, topicAction } from "../primaryAction";
import { ChallengeSteps, stepsFrom } from "./ChallengeSteps";
import { PrimaryAction, effortCue } from "./PrimaryAction";
import styles from "./r1.module.css";

const noSubscription = () => () => {};

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
  const ready = useSyncExternalStore(noSubscription, () => true, () => false);
  const action = topicAction(course, topic, progress);
  const { activity } = action;
  const record = progress.activities[activity.id];
  const done = record?.status === "completed" ? activity.questions.map((q) => q.id) : (record?.completedQuestions ?? []);
  const finished = action.kind === "next-topic" || action.kind === "review";

  return (
    <div className={styles.next} style={ready ? undefined : { visibility: "hidden" }} aria-busy={!ready} data-action={action.kind}>
      <PrimaryAction
        primary={action.primary}
        secondary={action.secondary}
        effort={finished ? "Completed. You can review it any time." : effortCue(activity.questions.length, activity.minutes)}
      />
      {!finished && <ChallengeSteps steps={stepsFrom(activity.questions, done, record?.status === "started")} />}

      {topic.activities.length > 1 && (
        <section className={styles.practices} aria-labelledby="practices-h">
          <h2 id="practices-h" className={styles.h2}>
            Practices in this topic
          </h2>
          <ol className={styles.practiceList}>
            {topic.activities.map((a) => {
              const status = progress.activities[a.id]?.status ?? "new";
              const count = progress.activities[a.id]?.completedQuestions?.length ?? 0;
              const line =
                status === "completed" ? "Completed" : status === "started" ? `${count} of ${a.questions.length} challenges done` : effortCue(a.questions.length, a.minutes);
              const link =
                status === "completed"
                  ? { label: "Review", href: reviewHref(course, topic, a) }
                  : { label: status === "started" ? "Continue" : "Start", href: practiceHref(course, topic, a) };
              return (
                <li key={a.id} className={styles.practiceRow} data-status={status}>
                  <div className={styles.practiceText}>
                    <h3 className={styles.topicTitle}>{a.title}</h3>
                    <p className={`${styles.topicStatus} ${status === "completed" ? styles.topicDone : styles.statusMuted}`}>{line}</p>
                  </div>
                  <Link href={link.href} className={styles.quiet} aria-label={`${link.label}: ${a.title}`}>
                    {link.label} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

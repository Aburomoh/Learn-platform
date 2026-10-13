"use client";

import type { Course, Topic } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import { effectiveDone, inProgress } from "@/learner/progress";
import { topicAction } from "../primaryAction";
import { ChallengeSteps, stepsFrom } from "./ChallengeSteps";
import { PrimaryAction, effortLine } from "./PrimaryAction";
import { LineText, UiText } from "./uiText";
import { PracticeRows } from "./TopicNavigator";
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
              {activity.title} · <UiText k={pluralKey("ui.effort.short-challenges", activity.questions.length, "en")} vars={{ n: activity.questions.length }} />
            </p>
          )}
          <ChallengeSteps steps={stepsFrom(activity.questions, done, inProgress(record, activity))} label={several ? `Challenges of ${activity.title}` : "Challenges"} />
        </div>
      )}

      {topic.activities.length > 1 && (
        <section id="practices" className={styles.practices} aria-labelledby="practices-h">
          <h2 id="practices-h" className={styles.h2}>
            <UiText k="ui.topic.practices-in" />
          </h2>
          <PracticeRows course={course} topic={topic} progress={progress} upNextId={finished ? undefined : activity.id} />
        </section>
      )}
    </div>
  );
}

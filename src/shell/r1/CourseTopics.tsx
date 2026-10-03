"use client";

import { useSyncExternalStore } from "react";
import type { Course, Topic } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import type { OfferingProgress } from "@/learner/progress";
import { courseAction, topicHref, topicRowAction, type ActionLink, type PrimaryAction } from "../primaryAction";
import { TopicRow } from "./Chrome";
import { PreviewBoard, parsePreview } from "./PreviewBoard";
import { effortCue } from "./PrimaryAction";
import styles from "./r1.module.css";

const noSubscription = () => () => {};

/** Topic-level status line: nothing about single practices (that is the topic page's job). */
export function topicStatus(topic: Topic, progress: Pick<OfferingProgress, "activities">): { text: string; completed: boolean } {
  const total = topic.activities.reduce((n, a) => n + a.questions.length, 0);
  const records = topic.activities.map((a) => ({ a, r: progress.activities[a.id] }));
  if (records.every(({ r }) => r?.status === "completed")) return { text: "Completed", completed: true };
  if (records.some(({ r }) => r && r.status !== "new")) {
    const done = records.reduce((n, { a, r }) => n + (r?.status === "completed" ? a.questions.length : (r?.completedQuestions?.length ?? 0)), 0);
    return { text: `${done} of ${total} challenges done`, completed: false };
  }
  return { text: effortCue(total, topic.activities.reduce((n, a) => n + a.minutes, 0)), completed: false };
}

/** The first and last tile of a topic's preview chain, small enough for a row; nothing if it is not a chain. */
function rowPreview(preview: string | undefined): string | undefined {
  if (!preview) return undefined;
  const tiles = preview.split("→").map((t) => t.trim());
  return parsePreview(preview).length >= 2 ? `${tiles[0]} → ${tiles[tiles.length - 1]}` : undefined;
}

/** A quiet row action uses the short word (the mock-up's "Start →"); the filled button keeps the resolver's label. */
function quietAction(action: PrimaryAction): ActionLink {
  return action.kind === "start" ? { ...action.primary, label: "Start" } : action.primary;
}

/**
 * The course page's chapter map: one section per chapter, one plain row per topic with its
 * status and one action. The topic the student should do next (from the resolver) carries the
 * page's only filled button; the other rows have quiet actions. Shown once local progress has
 * been read, so statuses never flash from "new" to "in progress".
 */
export function CourseTopics({ course }: { course: Course }) {
  const [progress] = useOfferingProgress(course.offeringId);
  const ready = useSyncExternalStore(noSubscription, () => true, () => false);
  const next = courseAction(course, progress);

  return (
    <div className={styles.chapters} style={ready ? undefined : { visibility: "hidden" }} aria-busy={!ready}>
      {course.modules.map((chapter) => (
        <section key={chapter.id} className={styles.chapter} aria-labelledby={`chapter-${chapter.id}`}>
          <h2 id={`chapter-${chapter.id}`} className={styles.h2}>
            {chapter.title}
          </h2>
          <ol className={styles.topicList}>
            {chapter.topics.map((topic) => {
              const isNext = topic.id === next.topic.id;
              const status = topicStatus(topic, progress);
              const preview = rowPreview(topic.preview);
              return (
                <TopicRow
                  key={topic.id}
                  title={topic.title}
                  href={topicHref(course, topic)}
                  route={topic.summary}
                  status={status.text}
                  completed={status.completed}
                  visual={preview ? <PreviewBoard preview={preview} size="sm" bare /> : undefined}
                  action={isNext ? next.primary : quietAction(topicRowAction(course, topic, progress))}
                  emphasis={isNext ? "primary" : "quiet"}
                />
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

"use client";

import type { MouseEvent, ReactNode } from "react";
import type { Course, Module, Topic } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import type { OfferingProgress } from "@/learner/progress";
import {
  courseAction,
  topicHref,
  topicRowAction,
  type ActionLink,
  type PrimaryAction,
} from "../primaryAction";
import { TopicRow } from "./Chrome";
import { PreviewBoard, parsePreview } from "./PreviewBoard";
import { effortCue } from "./PrimaryAction";
import { useHydrated } from "../useHydrated";
import styles from "./r1.module.css";

/** Topic-level status line: nothing about single practices (that is the topic page's job). */
export function topicStatus(
  topic: Topic,
  progress: Pick<OfferingProgress, "activities">,
): { text: string; completed: boolean; started: boolean } {
  const total = topic.activities.reduce((n, a) => n + a.questions.length, 0);
  const records = topic.activities.map((a) => ({
    a,
    r: progress.activities[a.id],
  }));
  if (records.every(({ r }) => r?.status === "completed"))
    return { text: "Completed", completed: true, started: true };
  if (records.some(({ r }) => r && r.status !== "new")) {
    const done = records.reduce(
      (n, { a, r }) =>
        n +
        (r?.status === "completed"
          ? a.questions.length
          : (r?.completedQuestions?.length ?? 0)),
      0,
    );
    return {
      text: `${done} of ${total} challenges done`,
      completed: false,
      started: true,
    };
  }
  // Not started: a topic of several practices is not one long sitting, so count practices (Pedagogy, #172).
  const minutes = topic.activities.reduce((n, a) => n + a.minutes, 0);
  const text =
    topic.activities.length > 1
      ? `${topic.activities.length} short practices · about ${minutes} min`
      : effortCue(total, minutes);
  return { text, completed: false, started: false };
}

/** The first and last tile of a topic's preview chain, small enough for a row; nothing if it is not a chain. */
function rowPreview(preview: string | undefined): string | undefined {
  if (!preview) return undefined;
  const tiles = preview.split("→").map((t) => t.trim());
  return parsePreview(preview).length >= 2
    ? `${tiles[0]} → ${tiles[tiles.length - 1]}`
    : undefined;
}

/** A quiet row action uses the short word (the mock-up's "Start →"); the filled button keeps the resolver's label. */
function quietAction(action: PrimaryAction): ActionLink {
  return action.kind === "start"
    ? { ...action.primary, label: "Start" }
    : action.primary;
}

export type ChapterState = "new" | "progress" | "done";

/**
 * Chapter status from local progress only, never scores (#198 §9): Completed when every topic
 * is, In progress once any practice is started, otherwise Not started.
 */
export function chapterStatus(
  chapter: Module,
  progress: Pick<OfferingProgress, "activities">,
): { state: ChapterState; text: string; done: number; total: number } {
  // a chapter without topics yet (CPET181 C2–C9, #562): never "Completed" (0 of 0)
  if (chapter.comingSoon || chapter.topics.length === 0)
    return {
      state: "new",
      text: "Not started · Coming soon",
      done: 0,
      total: 0,
    };
  const statuses = chapter.topics.map((t) => topicStatus(t, progress));
  const done = statuses.filter((t) => t.completed).length;
  const total = statuses.length;
  if (done === total) return { state: "done", text: "Completed", done, total };
  if (statuses.some((t) => t.started))
    return {
      state: "progress",
      text: `In progress · ${done} of ${total} topic${total === 1 ? "" : "s"} done`,
      done,
      total,
    };
  return { state: "new", text: "Not started", done, total };
}

/** "Chapter 2 · Boolean Algebra and Logic Gates" → "Boolean Algebra and Logic Gates": the number has its own tile. */
export function chapterTitle(chapter: Module): string {
  return chapter.title.replace(/^Chapter\s+\d+\s*·\s*/i, "");
}

const chapterAnchor = (chapter: Module) => `chapter-${chapter.id}`;

/** Ring (not started), half-filled ring (in progress) or a disc with a check (completed): shape as well as colour. */
function StatusShape({ state }: { state: ChapterState }) {
  return (
    <span
      className={styles.statusShape}
      data-state={state}
      aria-hidden="true"
    />
  );
}

/**
 * The course page's chapter map (#198 §9): one collapsible section per chapter with its status;
 * the chapter holding the next step is open. Inside, one plain row per topic with its status and
 * one action. The topic the student should do next (from the resolver) carries the page's only
 * filled button; the other rows have quiet actions. Shown once local progress has been read, so
 * statuses never flash from "new" to "in progress".
 */
export function CourseTopics({ course }: { course: Course }) {
  const [progress] = useOfferingProgress(course.offeringId);
  const ready = useHydrated();
  const next = courseAction(course, progress);

  return (
    <div
      className={styles.chapters}
      style={ready ? undefined : { visibility: "hidden" }}
      aria-busy={!ready}
    >
      {course.modules.map((chapter, i) => {
        const status = chapterStatus(chapter, progress);
        const holdsNext = chapter.topics.some((t) => t.id === next.topic.id);
        return (
          <section
            key={chapter.id}
            aria-labelledby={`${chapterAnchor(chapter)}-h`}
          >
            <details
              id={chapterAnchor(chapter)}
              className={styles.chapterBox}
              open={holdsNext}
            >
              <summary className={styles.chapterSummary}>
                <span className={styles.chapterNum} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={styles.chapterHead}>
                  <h2
                    id={`${chapterAnchor(chapter)}-h`}
                    className={styles.chapterTitle}
                  >
                    <span className="sr-only">Chapter {i + 1}: </span>
                    {chapterTitle(chapter)}
                  </h2>
                  <span
                    className={styles.chapterStatus}
                    data-state={status.state}
                  >
                    <StatusShape state={status.state} />
                    {status.text}
                  </span>
                </span>
                <span className={styles.chapterBar} aria-hidden="true">
                  <i
                    style={{
                      width: `${status.total ? (100 * status.done) / status.total : 0}%`,
                    }}
                  />
                </span>
              </summary>
              {chapter.topics.length > 0 && (
                <ol className={styles.chapterTopics}>
                  {chapter.topics.map((topic) => {
                    const isNext = topic.id === next.topic.id;
                    const topicState = topicStatus(topic, progress);
                    const preview = rowPreview(topic.preview);
                    return (
                      <TopicRow
                        key={topic.id}
                        title={topic.title}
                        href={topicHref(course, topic)}
                        route={topic.summary}
                        status={topicState.text}
                        statusMuted={!topicState.started}
                        completed={topicState.completed}
                        visual={
                          preview ? (
                            <PreviewBoard preview={preview} size="sm" bare />
                          ) : undefined
                        }
                        reserveVisual
                        action={
                          isNext
                            ? next.primary
                            : quietAction(
                                topicRowAction(course, topic, progress),
                              )
                        }
                        emphasis={isNext ? "primary" : "quiet"}
                      />
                    );
                  })}
                </ol>
              )}
            </details>
          </section>
        );
      })}
    </div>
  );
}

/** Opens the chapter a rail link points at, then lets the link scroll to it. */
function openChapter(event: MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById(event.currentTarget.hash.slice(1));
  if (target instanceof HTMLDetailsElement) target.open = true;
}

/**
 * The chapter index beside the map (≥ 900 px, in the page's aside): each chapter with its status
 * shape; the chapter holding the next step is the raised row. A link opens and shows its chapter.
 * `children` (the tutor's line) sit under it, and both stay in view while the map scrolls.
 */
export function ChapterIndex({
  course,
  children,
}: {
  course: Course;
  children?: ReactNode;
}) {
  const [progress] = useOfferingProgress(course.offeringId);
  const ready = useHydrated();
  const next = courseAction(course, progress);
  return (
    <div className={styles.rail}>
      <nav
        className={styles.chapterIndex}
        aria-label="Chapters"
        style={ready ? undefined : { visibility: "hidden" }}
      >
        <p className={styles.eyebrow}>Chapters</p>
        <ol>
          {course.modules.map((chapter, i) => {
            const status = chapterStatus(chapter, progress);
            const here = chapter.topics.some((t) => t.id === next.topic.id);
            return (
              <li key={chapter.id}>
                <a
                  href={`#${chapterAnchor(chapter)}`}
                  onClick={openChapter}
                  className={here ? styles.indexHere : undefined}
                  aria-current={here ? "step" : undefined}
                >
                  <StatusShape state={status.state} />
                  <span>
                    {i + 1} · {chapterTitle(chapter)}
                    <span className="sr-only">, {status.text}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
      {children}
    </div>
  );
}

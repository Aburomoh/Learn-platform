"use client";

import Link from "next/link";
import type { CourseOutline } from "@/content/outline";
import type { Course } from "@/content/schema";
import { getProgressStore } from "@/learner";
import { emptyProgress, type OfferingProgress } from "@/learner/progress";
import { resolveMessage } from "@/tutor";
import { TutorCard } from "@/tutor/ui";
import { product } from "../../../config/product";
import { courseAction, type PrimaryAction as NextAction } from "../primaryAction";
import { ChallengeSteps, stepsFrom } from "./ChallengeSteps";
import { PageHeading } from "./PageHeading";
import { PreviewBoard } from "./PreviewBoard";
import { PrimaryAction, effortCue } from "./PrimaryAction";
import { useHydrated } from "../useHydrated";
import styles from "./r1.module.css";

interface Pick {
  course: Course;
  progress: OfferingProgress;
  action: NextAction;
}

/** The course to lead with: the one with the most recently touched practice in progress, else the first. */
export function pickCourse(courses: Course[], progressOf: (course: Course) => OfferingProgress): Pick {
  const all = courses.map((course) => {
    const progress = progressOf(course);
    return { course, progress, action: courseAction(course, progress) };
  });
  const inProgress = all
    .filter((p) => p.action.kind === "continue")
    .sort((a, b) => (b.progress.activities[b.action.activity.id]?.lastAt ?? 0) - (a.progress.activities[a.action.activity.id]?.lastAt ?? 0));
  return inProgress[0] ?? all[0];
}

/** "Challenge 2 of 4 · about 5 min left": the share of the authored minutes still ahead, never tracked time. */
export function remainingCue(done: number, total: number, minutes: number): string {
  const left = Math.max(1, Math.round((minutes * (total - done)) / total));
  return `Challenge ${done + 1} of ${total} · about ${left} min left`;
}

/**
 * Home (R1 redesign): one clear way in. A returning student gets "Pick up where you left off"
 * with Continue; a first-time student gets "Start here" with Start practice on the first topic.
 * Below it, each course as a plain row with a quiet "Open course". Works with one course or many.
 *
 * Progress lives in this browser, so the content is shown once it has been read; the server
 * renders the first-visit version invisibly.
 */
export function HomeNext({ courses, outlines = [] }: { courses: Course[]; outlines?: CourseOutline[] }) {
  const ready = useHydrated();
  const progressOf = (course: Course) => (ready ? getProgressStore(course.offeringId).get() : emptyProgress(course.offeringId));
  const { course, progress, action } = pickCourse(courses, progressOf);
  const { topic, activity } = action;
  const chapter = course.modules.find((m) => m.topics.some((t) => t.id === topic.id));
  const record = progress.activities[activity.id];
  const done = record?.completedQuestions ?? [];
  const returning = courses.some((c) => Object.values(progressOf(c).activities).some((a) => a.status !== "new"));
  const finishedAll = action.kind === "review";

  return (
    <div className={`${styles.column} ${styles.bands}`} style={ready ? undefined : { visibility: "hidden" }} aria-busy={!ready} data-home={returning ? "returning" : "first"}>
      {returning ? (
        <PageHeading eyebrow="Welcome back" title={finishedAll ? "You have finished every topic" : "Pick up where you left off"} />
      ) : (
        <PageHeading eyebrow={product.tagline} title="Start here" route={`Practice for ${product.owner.displayName}'s courses. No account needed.`} />
      )}

      <section className={styles.panel} aria-labelledby="next-h">
        <div className={styles.panelMain}>
          <p className={styles.panelWhere}>
            {course.code}
            {chapter ? ` · ${chapter.title.split("·")[0].trim()}` : ""}
          </p>
          <h2 id="next-h" className={styles.h2}>
            {topic.title}
          </h2>
          {topic.preview && <PreviewBoard preview={topic.preview} size="sm" bare />}
          {!finishedAll && <ChallengeSteps steps={stepsFrom(activity.questions, done, action.kind === "continue")} />}
          <PrimaryAction
            primary={action.primary}
            secondary={action.secondary}
            effort={
              finishedAll
                ? "Completed. You can review any topic."
                : action.kind === "continue"
                  ? remainingCue(Math.min(done.length, activity.questions.length - 1), activity.questions.length, activity.minutes)
                  : effortCue(activity.questions.length, activity.minutes)
            }
          />
        </div>
        <div className={styles.panelTutor}>
          {/* the welcome pose on a first visit; nothing is fetched before progress is read */}
          <TutorCard
            name={product.owner.shortName}
            message={resolveMessage(returning ? "page.home.returning" : "page.home.first")}
            portrait={product.brand.tutorPortrait}
            pose={ready ? (returning ? "neutral" : "welcome") : null}
          />
        </div>
      </section>

      <section className={styles.chapter} aria-labelledby="courses-h">
        <h2 id="courses-h" className={styles.h2}>
          {courses.length + outlines.length === 1 ? "Your course" : "Your courses"}
        </h2>
        <ol className={styles.topicList}>
          {courses.map((c) => {
            const topics = c.modules.flatMap((m) => m.topics);
            const p = progressOf(c);
            const started = topics.filter((t) => t.activities.some((a) => (p.activities[a.id]?.status ?? "new") !== "new")).length;
            return (
              <li key={c.id} className={styles.practiceRow}>
                <div className={styles.practiceText}>
                  <p className={styles.eyebrow}>{c.code}</p>
                  <h3 className={styles.topicTitle}>{c.title}</h3>
                  <p className={`${styles.topicStatus} ${styles.statusMuted}`}>
                    {c.modules.length} chapter{c.modules.length === 1 ? "" : "s"} · {topics.length} topic{topics.length === 1 ? "" : "s"}
                    {started > 0 ? ` · ${started} started` : ""}
                  </p>
                </div>
                <Link href={`/courses/${c.id}/`} className={`${styles.quiet} ${styles.rowAction}`} aria-label={`Open course: ${c.title}`}>
                  Open course <span aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
          {outlines.map((c) => (
            <li key={c.id} className={styles.practiceRow}>
              <div className={styles.practiceText}>
                <p className={styles.eyebrow}>{c.code}</p>
                <h3 className={styles.topicTitle}>{c.title}</h3>
                <p className={`${styles.topicStatus} ${styles.statusMuted}`}>
                  {c.chapters.length} chapters · Not started · Topics coming soon
                </p>
              </div>
              <Link href={`/courses/${c.id}/`} className={`${styles.quiet} ${styles.rowAction}`} aria-label={`View chapters: ${c.title}`}>
                View chapters <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

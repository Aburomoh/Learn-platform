"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Course } from "@/content/schema";
import { getProgressStore } from "@/learner";
import { effectiveDone, effectiveStatus, emptyProgress, hasProgress, type OfferingProgress } from "@/learner/progress";
// the message catalogue and the card directly, not the tutor barrels: Home must not carry the
// engine or the kinds' logic (#675 size trim)
import { resolveMessage } from "@/tutor/messages";
import { TutorCard } from "@/tutor/ui/TutorCard";
import { product } from "../../../config/product";
import { courseAction, type PrimaryAction as NextAction } from "../primaryAction";
import { PageHeading } from "./PageHeading";
import { PrimaryAction, effortCue } from "./PrimaryAction";
import { useHydrated } from "../useHydrated";
import styles from "./r1.module.css";

interface Pick {
  course: Course;
  progress: OfferingProgress;
  action: NextAction;
}

/** The course to lead with (ADR-0013 rule 5): the one whose practice in progress has the newest meaningful `lastAt`, else the first. */
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

/** A course row's own action (#675): what the course page's button would do, named after its practice (the resolver's label, #673). */
export function rowActionLabel(action: NextAction): string {
  return action.primary.label;
}

/**
 * Home (R1 redesign): one clear way in. A returning student gets "Pick up where you left off"
 * with Continue; a first-time student gets "Start here" with Start practice on the first topic.
 * Below it, each course as a plain row with its own Continue / Start and a quiet "Open course"
 * (#675: the hero is short enough for the first row to sit inside a phone's first screen).
 * Works with one course or many.
 *
 * Progress lives in this browser, so the content is shown once it has been read; the server
 * renders the first-visit version invisibly.
 */
/** `share`: the landing page's QR card (#657), rendered last, under the course list. */
export function HomeNext({ courses, share }: { courses: Course[]; share?: ReactNode }) {
  const ready = useHydrated();
  const progressOf = (course: Course) => (ready ? getProgressStore(course.offeringId).get() : emptyProgress(course.offeringId));
  const { course, progress, action } = pickCourse(courses, progressOf);
  const { topic, activity } = action;
  const chapter = course.modules.find((m) => m.topics.some((t) => t.id === topic.id));
  const record = progress.activities[activity.id];
  const done = [...effectiveDone(activity, record).completed];
  // a visited-only or explained-only record is not "returning" (ADR-0013)
  const returning = courses.some((c) => {
    const p = progressOf(c);
    return c.modules.some((m) => m.topics.some((t) => t.activities.some((a) => hasProgress(p.activities[a.id], a))));
  });
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
          {/* #593: the worked-example tiles live on the topic page; #675: the challenge dots too (the effort line says where you are) */}
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

      <section id="courses" className={styles.chapter} aria-labelledby="courses-h">
        <h2 id="courses-h" className={styles.h2}>
          {courses.length === 1 ? "Your course" : "Your courses"}
        </h2>
        <ol className={styles.topicList}>
          {courses.map((c) => {
            const topics = c.modules.flatMap((m) => m.topics);
            const p = progressOf(c);
            const finished = topics.filter((t) => t.activities.every((a) => effectiveStatus(a, p.activities[a.id]) === "completed")).length;
            const started = topics.filter((t) => t.activities.some((a) => hasProgress(p.activities[a.id], a))).length - finished;
            const own = c.id === course.id ? action : courseAction(c, p);
            return (
              <li key={c.id} className={styles.practiceRow} data-course={c.id} data-action={own.kind}>
                <div className={styles.practiceText}>
                  <p className={styles.eyebrow}>{c.code}</p>
                  <h3 className={styles.topicTitle}>{c.title}</h3>
                  <p className={styles.topicRoute}>{c.summary}</p>
                  <p className={`${styles.topicStatus} ${styles.statusMuted}`}>
                    {c.modules.length} chapter{c.modules.length === 1 ? "" : "s"} · {topics.length} topic{topics.length === 1 ? "" : "s"}
                    {finished > 0 ? ` · ${finished} done` : ""}
                    {started > 0 ? ` · ${started} started` : ""}
                  </p>
                </div>
                <div className={styles.rowActions}>
                  <Link href={own.primary.href} className={`${styles.quiet} ${styles.rowAction}`} aria-label={`${rowActionLabel(own)}: ${c.title}`}>
                    {rowActionLabel(own)} <span aria-hidden="true">→</span>
                  </Link>
                  <Link href={`/courses/${c.id}/`} className={`${styles.quiet} ${styles.rowAction}`} aria-label={`Open course: ${c.title}`}>
                    Open course <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      {share}
    </div>
  );
}

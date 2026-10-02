import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { courses, getCourse } from "@/content";
import { Shell } from "@/shell/Shell";
import styles from "@/shell/Shell.module.css";

type Params = { course: string };

export function generateStaticParams(): Params[] {
  return courses.map((c) => ({ course: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { course } = await params;
  return { title: getCourse(course)?.title ?? "Course" };
}

export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  return (
    <Shell crumbs={[{ href: `/courses/${course.id}/`, label: course.title }]}>
      <h1>{course.title}</h1>
      <p className={styles.lead}>{course.summary}</p>
      {course.modules.map((m) => (
        <section key={m.id} className={styles.section} aria-labelledby={`m-${m.id}`}>
          <h2 id={`m-${m.id}`}>{m.title}</h2>
          <div className={styles.grid}>
            {m.topics.map((t) => (
              <Link key={t.id} href={`/courses/${course.id}/${t.id}/`} className={styles.card}>
                <h3>{t.title}</h3>
                <p>{t.summary}</p>
                <div className={styles.meta}>
                  <span>{t.activities.length} {t.activities.length === 1 ? "activity" : "activities"}</span>
                  <span>{t.activities.reduce((n, a) => n + a.minutes, 0)} min</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Shell>
  );
}

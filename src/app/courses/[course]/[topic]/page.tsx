import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTopic, listTopicParams } from "@/content";
import { Shell } from "@/shell/Shell";
import styles from "@/shell/Shell.module.css";
import { ActivityStatus } from "@/shell/ActivityStatus";

type Params = { course: string; topic: string };

export function generateStaticParams(): Params[] {
  return listTopicParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { course, topic } = await params;
  return { title: getTopic(course, topic)?.topic.title ?? "Topic" };
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { course: courseId, topic: topicId } = await params;
  const ref = getTopic(courseId, topicId);
  if (!ref) notFound();
  const { course, topic } = ref;

  return (
    <Shell
      crumbs={[
        { href: `/courses/${course.id}/`, label: course.title },
        { href: `/courses/${course.id}/${topic.id}/`, label: topic.title },
      ]}
    >
      <h1>{topic.title}</h1>
      <p className={styles.lead}>{topic.summary}</p>

      <section className={styles.section} aria-labelledby="obj-h">
        <h2 id="obj-h">You will be able to</h2>
        <ul className={styles.objectives}>
          {topic.objectives.map((o) => (
            <li key={o.id}>{o.text}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="act-h">
        <h2 id="act-h">Activities</h2>
        <ul className={styles.list}>
          {topic.activities.map((a) => (
            <li key={a.id}>
              <Link href={`/courses/${course.id}/${topic.id}/${a.id}/`} className={styles.card}>
                <h3>{a.title}</h3>
                <p>{a.summary}</p>
                <div className={styles.meta}>
                  <span>{a.minutes} min</span>
                  <span>{a.questions.length} questions</span>
                  {a.authority === "DEMO" && <span className="demo-badge">DEMO</span>}
                  <ActivityStatus offeringId={course.offeringId} activityId={a.id} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

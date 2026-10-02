import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActivity, listActivityParams } from "@/content";
import { Shell } from "@/shell/Shell";
import styles from "@/shell/Shell.module.css";

type Params = { course: string; topic: string; activity: string };

export function generateStaticParams(): Params[] {
  return listActivityParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { course, topic, activity } = await params;
  return { title: getActivity(course, topic, activity)?.activity.title ?? "Activity" };
}

export default async function ActivityPage({ params }: { params: Promise<Params> }) {
  const { course: courseId, topic: topicId, activity: activityId } = await params;
  const ref = getActivity(courseId, topicId, activityId);
  if (!ref) notFound();
  const { course, topic, activity } = ref;

  return (
    <Shell
      wide
      crumbs={[
        { href: `/courses/${course.id}/`, label: course.title },
        { href: `/courses/${course.id}/${topic.id}/`, label: topic.title },
        { href: `/courses/${course.id}/${topic.id}/${activity.id}/`, label: activity.title },
      ]}
    >
      <h1>{activity.title}</h1>
      <p className={styles.lead}>{activity.summary}</p>
      {/* The Learning Stage (ActivityRunner) mounts here in task #8. */}
      <p className={styles.meta} data-testid="stage-placeholder">
        Learning Stage coming in the next task.
      </p>
    </Shell>
  );
}

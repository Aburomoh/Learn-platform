import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActivity, listActivityParams } from "@/content";
import { Shell } from "@/shell/Shell";
import { ActivityRunner } from "@/stage/ActivityRunner";
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
  const topicHref = `/courses/${course.id}/${topic.id}/`;

  return (
    <Shell
      wide
      crumbs={[
        { href: `/courses/${course.id}/`, label: course.title },
        { href: topicHref, label: topic.title },
        { href: `${topicHref}${activity.id}/`, label: activity.title },
      ]}
    >
      <h1>{activity.title}</h1>
      <p className={styles.lead}>{activity.summary}</p>
      <ActivityRunner offeringId={course.offeringId} topic={topic} activity={activity} backHref={topicHref} />
    </Shell>
  );
}

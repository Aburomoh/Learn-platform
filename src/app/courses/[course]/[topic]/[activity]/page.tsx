import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActivity, listActivityParams } from "@/content";
import { Footer, TopBar } from "@/shell/r1";
import shell from "@/shell/r1/r1.module.css";
import { ActivityRunner } from "@/stage/ActivityRunner";
import { ResumeScript } from "@/stage/ResumeScript";

type Params = { course: string; topic: string; activity: string };

export function generateStaticParams(): Params[] {
  return listActivityParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { course, topic, activity } = await params;
  return { title: getActivity(course, topic, activity)?.activity.title ?? "Practice" };
}

/**
 * Activity page (R1 redesign): no introduction. A back link to the topic sits in the top bar; the
 * challenge steps and the first challenge are the first things on screen.
 */
export default async function ActivityPage({ params }: { params: Promise<Params> }) {
  const { course: courseId, topic: topicId, activity: activityId } = await params;
  const ref = getActivity(courseId, topicId, activityId);
  if (!ref) notFound();
  const { course, topic, activity } = ref;

  return (
    <>
      <TopBar back={{ label: topic.title, href: `/courses/${course.id}/${topic.id}/` }} />
      <main className={`${shell.main} ${shell.mainStage}`}>
        {/* the page still has a name for assistive technology and the tab title */}
        <h1 className="sr-only">{activity.title}</h1>
        {/* before the stage, so it runs before the stage can paint (see ResumeScript.tsx) */}
        <ResumeScript offeringId={course.offeringId} activityId={activity.id} />
        <ActivityRunner course={course} topic={topic} activity={activity} />
      </main>
      <Footer demo={activity.authority === "DEMO"} />
    </>
  );
}

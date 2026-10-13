import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActivity, listActivityParams } from "@/content";
import { Footer, TopBar } from "@/shell/r1/Chrome";
import { LocationLine } from "@/shell/r1/LocationLine";
import { chapterShort } from "@/shell/location";
import shell from "@/shell/r1/r1.module.css";
import { KindLogicGate } from "@/kinds/logicGate";
import { ActivityRunner } from "@/stage/ActivityRunner";
import { ResumeScript } from "@/stage/ResumeScript";
import { PreInputScript } from "@/stage/PreInputScript";

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
  const chapter = course.modules.find((m) => m.topics.some((t) => t.id === topic.id));
  // Where am I (epic #670, #674): course · chapter · topic, each a link; then the practice's name
  const location = [
    { label: course.code, href: `/courses/${course.id}/` },
    ...(chapter ? [{ label: chapterShort(chapter.title), href: `/courses/${course.id}/#chapter-${chapter.id}` }] : []),
    { label: topic.title, href: `/courses/${course.id}/${topic.id}/` },
  ];

  return (
    <>
      <TopBar back={{ label: topic.title, href: `/courses/${course.id}/${topic.id}/` }} />
      <main className={`${shell.main} ${shell.mainStage}`}>
        <div className={shell.stageWhere}>
          <LocationLine segments={location} />
          <h1 className={shell.stageTitle}>{activity.title}</h1>
        </div>
        {/* before the stage, so it runs before the stage can paint (see ResumeScript.tsx) */}
        <ResumeScript offeringId={course.offeringId} activityId={activity.id} />
        {/* records a tap or digits made before hydration, so the runner can keep them (#708, preHydration.ts) */}
        <PreInputScript />
        {/* only this practice's kind logic reaches the browser, preloaded with the page (#683) */}
        <KindLogicGate kinds={activity.questions.flatMap((q) => q.variants.map((v) => v.spec.kind))}>
          <ActivityRunner course={course} topic={topic} activity={activity} />
        </KindLogicGate>
      </main>
      <Footer demo={activity.authority === "DEMO"} />
    </>
  );
}

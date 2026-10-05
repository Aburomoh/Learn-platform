import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTopic, listTopicParams } from "@/content";
import { CourseTutor, MeetCard, PageFrame, PageHeading, PreviewBoard, TopicNext } from "@/shell/r1";
import styles from "@/shell/r1/r1.module.css";
import { Notation } from "@/interactions/shared/Notation";

type Params = { course: string; topic: string };

export function generateStaticParams(): Params[] {
  return listTopicParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { course, topic } = await params;
  return { title: getTopic(course, topic)?.topic.title ?? "Topic" };
}

/**
 * Topic page (R1 redesign): where am I, what am I learning, what do I do next. Top to bottom:
 * eyebrow, title, the "Today" route, the preview, the tutor's one line, the primary action with
 * its effort cue, the challenge steps, and the objectives collapsed.
 */
export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { course: courseId, topic: topicId } = await params;
  const ref = getTopic(courseId, topicId);
  if (!ref) notFound();
  const { course, module: chapter, topic } = ref;

  // "ECET 111 · Chapter 1": the course code and the chapter's short name (before its title).
  const eyebrow = `${course.code} · ${chapter.title.split("·")[0].trim()}`;
  // The route names the first practice's challenges in order; unlabeled challenges are left out.
  const labels = topic.activities[0].questions.map((q) => q.label).filter(Boolean);
  const route = labels.length > 1 ? `Today: ${labels.join(" → ")}` : topic.summary;
  const tutor = { course, messageKey: "page.topic.intro" } as const;

  return (
    <PageFrame back={{ label: course.code, href: `/courses/${course.id}/` }} demo={course.authority === "DEMO"} aside={<CourseTutor {...tutor} size="lg" />}>
      <PageHeading eyebrow={eyebrow} title={topic.title} route={route} />
      {/* a device topic shows its symbol card in place of the preview tiles (visual system §11) */}
      {topic.meet ? <MeetCard id={topic.id} meet={topic.meet} /> : topic.preview && <PreviewBoard preview={topic.preview} />}
      {/* on wide screens the tutor sits in the right column instead */}
      <div className={styles.onlyNarrow}>
        <CourseTutor {...tutor} size="md" />
      </div>
      <TopicNext course={course} topic={topic} />
      <details className={styles.more}>
        <summary>What you&apos;ll practise</summary>
        <ul>
          {topic.objectives.map((o) => (
            <li key={o.id}>
              <Notation text={o.text} />
            </li>
          ))}
        </ul>
      </details>
    </PageFrame>
  );
}

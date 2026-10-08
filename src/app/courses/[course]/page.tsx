import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { courses, getCourse, getOutline, outlines } from "@/content";
import { ChapterIndex, CourseOutline, CourseTopics, CourseTutor, PageFrame, PageHeading } from "@/shell/r1";

type Params = { course: string };

export function generateStaticParams(): Params[] {
  return [...courses, ...outlines].map((c) => ({ course: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { course } = await params;
  return { title: (getCourse(course) ?? getOutline(course))?.title ?? "Course" };
}

/**
 * Course page (R1 redesign, #198 §9): a chapter map. Title band, then one collapsible section per
 * chapter with its status and one row per topic. On wide screens the right column holds the
 * chapter index and the tutor's one line.
 */
export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  if (!course) {
    const outline = getOutline(courseId);
    if (!outline) notFound();
    return (
      <PageFrame demo={false}>
        <PageHeading eyebrow={outline.code} title={outline.title} route={outline.summary} />
        <CourseOutline outline={outline} />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      demo={course.authority === "DEMO"}
      aside={
        <ChapterIndex course={course}>
          <CourseTutor course={course} />
        </ChapterIndex>
      }
    >
      <PageHeading eyebrow={course.code} title={course.title} route={course.summary} />
      <CourseTopics course={course} />
    </PageFrame>
  );
}

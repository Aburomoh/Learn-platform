import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { courses, getCourse } from "@/content";
import { product } from "../../../../config/product";
import { ChapterIndex, CourseTopics, PageFrame, PageHeading } from "@/shell/r1";
import { resolveMessage } from "@/tutor";
import { TutorCard } from "@/tutor/ui";

type Params = { course: string };

export function generateStaticParams(): Params[] {
  return courses.map((c) => ({ course: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { course } = await params;
  return { title: getCourse(course)?.title ?? "Course" };
}

/**
 * Course page (R1 redesign, #198 §9): a chapter map. Title band, then one collapsible section per
 * chapter with its status and one row per topic. On wide screens the right column holds the
 * chapter index and the tutor's one line.
 */
export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  return (
    <PageFrame
      demo={course.authority === "DEMO"}
      aside={
        <ChapterIndex course={course}>
          <TutorCard name={product.owner.shortName} message={resolveMessage("page.course.intro")} portraitSrc={product.brand.tutorPortrait} />
        </ChapterIndex>
      }
    >
      <PageHeading eyebrow={course.code} title={course.title} route={course.summary} />
      <CourseTopics course={course} />
    </PageFrame>
  );
}

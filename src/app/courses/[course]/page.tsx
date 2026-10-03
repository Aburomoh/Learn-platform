import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { courses, getCourse } from "@/content";
import { product } from "../../../../config/product";
import { CourseTopics, PageFrame, PageHeading } from "@/shell/r1";
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
 * Course page (R1 redesign): a chapter map. Title band, then one section per chapter with one
 * row per topic. The tutor's one line sits in the right column on wide screens only.
 */
export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  return (
    <PageFrame
      demo={course.authority === "DEMO"}
      aside={<TutorCard name={product.owner.shortName} message={resolveMessage("page.course.intro")} portraitSrc={product.brand.tutorPortrait} />}
    >
      <PageHeading eyebrow={course.code} title={course.title} route={course.summary} />
      <CourseTopics course={course} />
    </PageFrame>
  );
}

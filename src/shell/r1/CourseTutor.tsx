"use client";

import type { Course } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import { hasProgress } from "@/learner/progress";
import { resolveMessage } from "@/tutor/messages";
import { TutorCard, type TutorCardProps } from "@/tutor/ui/TutorCard";
import { product } from "../../../config/product";
import { useHydrated } from "../useHydrated";

export interface CourseTutorProps {
  course: Course;
  /** The catalog line: the course page's or the topic page's intro. */
  messageKey?: "page.course.intro" | "page.topic.intro";
  size?: TutorCardProps["size"];
}

/**
 * The tutor card on the course and topic intro rails (#354): the welcome pose until the student has
 * started any practice in this course (a first visit), then neutral. The pose is chosen once progress
 * is read, so only one is fetched.
 */
export function CourseTutor({ course, messageKey = "page.course.intro", size }: CourseTutorProps) {
  const ready = useHydrated();
  const [progress] = useOfferingProgress(course.offeringId);
  const started = Object.values(progress.activities).some((a) => hasProgress(a));
  return (
    <TutorCard
      name={product.owner.shortName}
      message={resolveMessage(messageKey)}
      course={course.id}
      size={size}
      portrait={product.brand.tutorPortrait}
      pose={ready ? (started ? "neutral" : "welcome") : null}
    />
  );
}

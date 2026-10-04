"use client";

import type { Course } from "@/content/schema";
import { useOfferingProgress } from "@/learner";
import { resolveMessage } from "@/tutor";
import { TutorCard } from "@/tutor/ui";
import { product } from "../../../config/product";
import { useHydrated } from "../useHydrated";

/**
 * The course page's tutor line (#354): the welcome pose until the student has started any practice
 * in this course, then neutral. The pose is chosen once progress is read, so only one is fetched.
 */
export function CourseTutor({ course }: { course: Course }) {
  const ready = useHydrated();
  const [progress] = useOfferingProgress(course.offeringId);
  const started = Object.values(progress.activities).some((a) => a.status !== "new");
  return (
    <TutorCard
      name={product.owner.shortName}
      message={resolveMessage("page.course.intro")}
      portrait={product.brand.tutorPortrait}
      pose={ready ? (started ? "neutral" : "welcome") : null}
    />
  );
}

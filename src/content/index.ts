/**
 * Content registry. Courses are parsed once at module load so every consumer gets validated,
 * defaulted data. Adding a course = adding a module here (ADR-0002).
 */
import { CourseSchema, type Course, type Topic, type Activity, type Module, type CourseInput } from "./schema";
import { ecet111 } from "./ecet111/course";
import { cpet181 } from "./cpet181";
import type { CourseOutline } from "./outline";

const sources: CourseInput[] = [ecet111];

export const courses: Course[] = sources.map((c) => CourseSchema.parse(c));

/** Courses announced but without topics yet (no routes into topics, no progress). */
export const outlines: CourseOutline[] = [cpet181];

export function getOutline(courseId: string): CourseOutline | undefined {
  return outlines.find((c) => c.id === courseId);
}

export function getCourse(courseId: string): Course | undefined {
  return courses.find((c) => c.id === courseId);
}

export interface TopicRef {
  course: Course;
  module: Module;
  topic: Topic;
}
export interface ActivityRef extends TopicRef {
  activity: Activity;
}

export function getTopic(courseId: string, topicId: string): TopicRef | undefined {
  const course = getCourse(courseId);
  if (!course) return undefined;
  for (const mod of course.modules) {
    const topic = mod.topics.find((t) => t.id === topicId);
    if (topic) return { course, module: mod, topic };
  }
  return undefined;
}

export function getActivity(courseId: string, topicId: string, activityId: string): ActivityRef | undefined {
  const ref = getTopic(courseId, topicId);
  if (!ref) return undefined;
  const activity = ref.topic.activities.find((a) => a.id === activityId);
  return activity ? { ...ref, activity } : undefined;
}

/** Every activity route, for generateStaticParams. */
export function listActivityParams(): { course: string; topic: string; activity: string }[] {
  const out: { course: string; topic: string; activity: string }[] = [];
  for (const course of courses)
    for (const mod of course.modules)
      for (const topic of mod.topics)
        for (const activity of topic.activities) out.push({ course: course.id, topic: topic.id, activity: activity.id });
  return out;
}

export function listTopicParams(): { course: string; topic: string }[] {
  return listActivityParams()
    .map(({ course, topic }) => ({ course, topic }))
    .filter((p, i, arr) => arr.findIndex((q) => q.course === p.course && q.topic === p.topic) === i);
}

export type { CourseOutline, OutlineChapter } from "./outline";
export type { Course, Module, Topic, Activity } from "./schema";

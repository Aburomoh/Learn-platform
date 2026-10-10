/**
 * A course whose chapters are planned but have no topics yet. It is a plain list for the Home and
 * course pages ("Not started", "coming soon"); it never enters the learning registry, so progress,
 * routes and the next-step resolver only ever see courses with real topics.
 */
export interface OutlineChapter {
  id: string;
  title: string;
}

export interface CourseOutline {
  id: string;
  code: string;
  title: string;
  summary: string;
  chapters: OutlineChapter[];
}

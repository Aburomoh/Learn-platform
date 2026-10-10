/**
 * CPET 181 as a learning course (#562). Chapters 1 and 2 have topics (chapter1/, chapter2/); the other seven chapters
 * are `comingSoon` modules built from the chapter list in ./index.ts, and each gets its topics when
 * its content lands (add them to that chapter's registry and drop `comingSoon`).
 */
import type { CourseInput, ModuleInput } from "../schema";
import { cpet181 as outline } from "./index";
import { chapter1 } from "./chapter1";
import { chapter2 } from "./chapter2";

const comingSoon: ModuleInput[] = outline.chapters.slice(2).map((c, i) => ({
  id: `chapter-${i + 3}`,
  title: `Chapter ${i + 3} · ${c.title}`,
  comingSoon: true,
  topics: [],
}));

export const cpet181Course: CourseInput = {
  id: outline.id,
  code: outline.code,
  title: outline.title,
  summary: outline.summary,
  authority: "DEMO",
  offeringId: "cpet181.2026-fall",
  modules: [chapter1, chapter2, ...comingSoon],
};

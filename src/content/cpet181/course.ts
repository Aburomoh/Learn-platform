/**
 * CPET 181 as a learning course (#562). Chapter 1 has topics (chapter1/); the other eight chapters
 * are `comingSoon` modules built from the chapter list in ./index.ts, and each gets its topics when
 * its content lands (add them to that chapter's registry and drop `comingSoon`).
 */
import type { CourseInput, ModuleInput } from "../schema";
import { cpet181 as outline } from "./index";
import { chapter1 } from "./chapter1";

const comingSoon: ModuleInput[] = outline.chapters.slice(1).map((c, i) => ({
  id: `chapter-${i + 2}`,
  title: `Chapter ${i + 2} · ${c.title}`,
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
  modules: [chapter1, ...comingSoon],
};

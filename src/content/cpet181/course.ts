/**
 * CPET 181 as a learning course (#562). Chapters 1, 2 and 4 have topics (chapter1/, chapter2/, chapter4/); the other six chapters
 * are `comingSoon` modules built from the chapter list in ./index.ts, and each gets its topics when
 * its content lands (add them to that chapter's registry and drop `comingSoon`).
 */
import type { CourseInput, ModuleInput } from "../schema";
import { cpet181 as outline } from "./index";
import { chapter1 } from "./chapter1";
import { chapter2 } from "./chapter2";
import { chapter4 } from "./chapter4";

/** Chapters with topics, by chapter number; every other chapter is `comingSoon`. */
const live: Record<number, ModuleInput> = { 1: chapter1, 2: chapter2, 4: chapter4 };

const modules: ModuleInput[] = outline.chapters.map((c, i) => {
  const n = i + 1;
  return live[n] ?? { id: `chapter-${n}`, title: `Chapter ${n} · ${c.title}`, comingSoon: true, topics: [] };
});

export const cpet181Course: CourseInput = {
  id: outline.id,
  code: outline.code,
  title: outline.title,
  summary: outline.summary,
  authority: "DEMO",
  offeringId: "cpet181.2026-fall",
  modules,
};

/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT
 * Demo course used to validate the learning architecture. Replace with instructor-approved
 * content before any production release. Every entity below is stamped authority: "DEMO".
 */
import type { CourseInput } from "../schema";
import { chapter1 } from "./chapter1";
import { chapter2 } from "./chapter2";
import { chapter3 } from "./chapter3";
import { chapter4 } from "./chapter4";
import { chapter5 } from "./chapter5";

export const ecet111: CourseInput = {
  id: "ecet111",
  code: "ECET 111",
  title: "Introduction to Digital System Design I",
  summary: "Number systems and binary arithmetic, one step at a time: convert between bases, add, complement and subtract. Plus a first look at logic gates.",
  authority: "DEMO",
  offeringId: "ecet111.2026-fall",
  // Each chapter registers its own topics (chapter<N>/index.ts); empty chapters are left out.
  modules: [chapter1, chapter2, chapter3, chapter4, chapter5].filter((m) => m.topics.length > 0),
};

/**
 * Chapter 3 registry: add a topic here, and only here (course.ts never changes). One import
 * and one entry per topic, in the deck's order. Chapters with no topics yet are left out.
 */
import type { ModuleInput } from "../../schema";
import { threeVariableTopic } from "./three-variable";

export const chapter3: ModuleInput = {
  id: "chapter-3",
  title: "Chapter 3 · K-Map Simplification",
  topics: [
    threeVariableTopic,
  ],
};

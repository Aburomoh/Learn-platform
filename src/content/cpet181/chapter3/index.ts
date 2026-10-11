/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 3: memory management, virtual systems (#611), built from
 * docs/content-packs/cpet181/ch3.md.
 */
import type { ModuleInput } from "../../schema";
import { addressesTopic, compareMemoryTopic } from "./concepts";
import { pagedTranslationTopic, segmentationNumbersTopic } from "./paging";

export const chapter3: ModuleInput = {
  id: "chapter-3",
  title: "Chapter 3 · Memory management: virtual systems",
  topics: [addressesTopic, pagedTranslationTopic, segmentationNumbersTopic, compareMemoryTopic],
};

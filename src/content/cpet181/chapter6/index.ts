/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 6: concurrent processes (#621), built from docs/content-packs/cpet181/ch6.md.
 */
import type { ModuleInput } from "../../schema";
import { multiprocessingTopic, synchronizationTopic, concurrentProgrammingTopic } from "./concurrent";

export const chapter6: ModuleInput = {
  id: "chapter-6",
  title: "Chapter 6 · Concurrent processes",
  topics: [multiprocessingTopic, synchronizationTopic, concurrentProgrammingTopic],
};

/**
 * CPET 181 Chapter 2 registry (#582): add a topic here, and only here, in the deck's order.
 * Source: docs/content-packs/cpet181/ch2.md; answers from src/content/os (allocate, release, compact).
 */
import type { ModuleInput } from "../../schema";
import { memorySchemesTopic } from "./terms";
import { fixedPartitionsTopic, dynamicPartitionsTopic, relocatablePartitionsTopic } from "./maps";

export const chapter2: ModuleInput = {
  id: "chapter-2",
  title: "Chapter 2 · Memory management: simple systems",
  topics: [memorySchemesTopic, fixedPartitionsTopic, dynamicPartitionsTopic, relocatablePartitionsTopic],
};

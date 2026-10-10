/**
 * CPET 181 Chapter 4 registry (#587): add a topic here, and only here, in the deck's order.
 * Source: docs/content-packs/cpet181/ch4.md; schedules from src/content/os (schedule) through the
 * cpu-schedule kind.
 */
import type { ModuleInput } from "../../schema";
import { fcfsSjnTopic, srtTopic, priorityTopic, roundRobinTopic, compareTopic } from "./schedule";

export const chapter4: ModuleInput = {
  id: "chapter-4",
  title: "Chapter 4 · Processor management",
  topics: [fcfsSjnTopic, srtTopic, priorityTopic, roundRobinTopic, compareTopic],
};

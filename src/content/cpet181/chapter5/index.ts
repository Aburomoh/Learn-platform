/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 5: process management, deadlock and starvation (#614), built from
 * docs/content-packs/cpet181/ch5.md.
 */
import type { ModuleInput } from "../../schema";
import { deadlockBasicsTopic, deadlockSketchesTopic, fourConditionsTopic, recoveryStarvationTopic } from "./deadlock";

export const chapter5: ModuleInput = {
  id: "chapter-5",
  title: "Chapter 5 · Process management",
  topics: [deadlockBasicsTopic, deadlockSketchesTopic, fourConditionsTopic, recoveryStarvationTopic],
};

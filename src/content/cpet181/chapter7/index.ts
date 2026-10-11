/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 7: device management (#630), built from docs/content-packs/cpet181/ch7.md.
 */
import type { ModuleInput } from "../../schema";
import { deviceManagerTopic, magneticTapeTopic, magneticDisksTopic, opticalSolidStateTopic } from "./devices";

export const chapter7: ModuleInput = {
  id: "chapter-7",
  title: "Chapter 7 · Device management",
  topics: [deviceManagerTopic, magneticTapeTopic, magneticDisksTopic, opticalSolidStateTopic],
};

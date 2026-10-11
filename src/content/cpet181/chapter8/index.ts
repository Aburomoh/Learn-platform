/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 8: file management (#571), built from docs/content-packs/cpet181/ch8.md.
 */
import type { ModuleInput } from "../../schema";
import { fileBasicsTopic, recordOrganizationTopic, fileSystemsTopic } from "./concepts";
import { compressionTopic } from "./compression";

export const chapter8: ModuleInput = {
  id: "chapter-8",
  title: "Chapter 8 · File management",
  topics: [fileBasicsTopic, recordOrganizationTopic, compressionTopic, fileSystemsTopic],
};

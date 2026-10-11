/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 9: network organization concepts and security (#635), built from
 * docs/content-packs/cpet181/ch9.md.
 */
import type { ModuleInput } from "../../schema";
import { networkBasicsTopic, topologiesTopic, networkTypesTopic, switchingSecurityTopic } from "./networks";

export const chapter9: ModuleInput = {
  id: "chapter-9",
  title: "Chapter 9 · Networks and security",
  topics: [networkBasicsTopic, topologiesTopic, networkTypesTopic, switchingSecurityTopic],
};

/**
 * CPET 181 Chapter 1 registry (#555): add a topic here, and only here. Not yet in a course: registering
 * CPET181 in `courses` needs the shell (#554) and its `comingSoon` chapters.
 */
import type { ModuleInput } from "../../schema";
import { hardwareAndMemoryTopic } from "./hardware-and-memory";
import { osAndManagersTopic } from "./os-and-managers";
import { interfacesAndTypesTopic } from "./interfaces-and-types";

export const chapter1: ModuleInput = {
  id: "chapter-1",
  title: "Chapter 1 · Introduction to Operating Systems",
  topics: [hardwareAndMemoryTopic, osAndManagersTopic, interfacesAndTypesTopic],
};

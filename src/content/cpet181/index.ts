import type { CourseOutline } from "../outline";

/** CPET 181 chapter list (docs/content-packs/cpet181/index.md). Topics arrive chapter by chapter. */
export const cpet181: CourseOutline = {
  id: "cpet181",
  code: "CPET 181",
  title: "Computer Operating Systems Basics",
  summary: "How an operating system manages memory, processes, devices and files. Practice is on its way, chapter by chapter.",
  chapters: [
    { id: "c1", title: "Introduction to operating systems" },
    { id: "c2", title: "Memory management: simple systems" },
    { id: "c3", title: "Memory management: virtual systems" },
    { id: "c4", title: "Processor management" },
    { id: "c5", title: "Process management" },
    { id: "c6", title: "Concurrent processes" },
    { id: "c7", title: "Device management" },
    { id: "c8", title: "File management" },
    { id: "c9", title: "Networks and security" },
  ],
};

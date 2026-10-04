/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 3, don't-cares (#282, content pack ch3 §8): an X may join a group when it makes
 * the group larger, and is left out otherwise. Sets are the slides' maps (s.97–101, s.102, s.103,
 * s.105); their minimal covers are computed and unique. The kind refuses a group of only Xs.
 */
import type { CourseInput } from "../../schema";
import { kmapVariant, type KmapSet } from "./kmap-variant";

type TopicInput = CourseInput["modules"][number]["topics"][number];

const SETS: KmapSet[] = [
  { id: "d157", vars: ["A", "B", "C"], minterms: [1, 5, 7], dontCares: [0, 3, 6] },
  { id: "d2467", vars: ["A", "B", "C"], minterms: [2, 4, 6, 7], dontCares: [1, 5] },
  { id: "d14567", vars: ["x", "y", "z"], minterms: [1, 4, 5, 6, 7], dontCares: [3] },
  { id: "d105", vars: ["A", "B", "C", "D"], minterms: [1, 3, 8, 9, 10, 11, 12, 14, 15], dontCares: [0, 6, 7, 13] },
];

export const dontCaresTopic: TopicInput = {
  id: "kmap-dont-cares",
  title: "Don't-cares",
  summary: "An X can be a 1 or a 0: use it only when it makes a group larger, and never group Xs alone.",
  preview: "x → 1 only if the group grows",
  concepts: [{ id: "km.dont-care", title: "Don't-care", summary: "A don't-care X may be taken as 1 to enlarge a group, or left as 0; every group still needs a 1." }],
  objectives: [{ id: "km.obj.dont-care", conceptId: "km.dont-care", text: "Simplify a map with don't-cares, taking an X only where it enlarges a group." }],
  activities: [
    {
      id: "kmap-dont-cares",
      title: "Don't-cares",
      summary: "Fill (1, 0 and X), group using Xs only where they help, name each group, then F.",
      authority: "DEMO",
      minutes: 20,
      questions: [{ id: "km.q.dont-care", label: "Use the Xs", conceptId: "km.dont-care", objectiveId: "km.obj.dont-care", variants: SETS.map((s, k) => kmapVariant(s, k)) }],
    },
  ],
};

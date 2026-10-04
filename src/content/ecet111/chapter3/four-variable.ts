/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 3, four-variable maps (#279, content pack ch3 §4–5): corners, edges and wraps on
 * a 4 × 4 map (AB rows, CD columns, both in Gray order). Sets are the pack's maps with a single
 * minimal cover each (s.44, s.109 with the four corners, s.45); covers are computed.
 */
import type { CourseInput } from "../../schema";
import { kmapVariant, type KmapSet } from "./kmap-variant";

type TopicInput = CourseInput["modules"][number]["topics"][number];

const SETS: KmapSet[] = [
  { id: "m44", vars: ["A", "B", "C", "D"], minterms: [3, 5, 8, 9, 10, 11, 12, 13, 14, 15] },
  { id: "m109", vars: ["w", "x", "y", "z"], minterms: [0, 2, 4, 6, 8, 10, 11, 13, 14, 15] },
  { id: "m45", vars: ["w", "x", "y", "z"], minterms: [1, 3, 5, 8, 9, 10, 11, 12, 13, 14] },
];

export const fourVariableTopic: TopicInput = {
  id: "kmap-four",
  title: "Four-variable maps",
  summary: "A 4 × 4 map: groups of 8, 4, 2 or 1 that may wrap left to right, top to bottom, or take the four corners.",
  preview: "corners → B′D′",
  concepts: [{ id: "km.four", title: "Four-variable map", summary: "Rows AB and columns CD in Gray order; opposite edges touch, so the four corners form one group." }],
  objectives: [{ id: "km.obj.four", conceptId: "km.four", text: "Simplify a four-variable function with a K-map, using wraps and corners." }],
  activities: [
    {
      id: "kmap-four",
      title: "Four-variable maps",
      summary: "Fill, group (wraps and corners included), name each group, then F.",
      authority: "DEMO",
      minutes: 20,
      questions: [{ id: "km.q.four", label: "Simplify a 4 × 4 map", conceptId: "km.four", objectiveId: "km.obj.four", variants: SETS.map((s, k) => kmapVariant(s, k)) }],
    },
  ],
};

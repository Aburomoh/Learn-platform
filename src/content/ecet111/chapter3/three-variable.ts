/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 3, three-variable maps and the procedure (#277, content pack ch3 §3): fill the
 * map from Σ, group, name each group, write F. Sets are the slides' worked maps; their minimal
 * covers are computed (the owner confirmed the pack's machine-worked answers, #192).
 */
import type { CourseInput } from "../../schema";
import { kmapVariant, type KmapSet } from "./kmap-variant";

type TopicInput = CourseInput["modules"][number]["topics"][number];

/** Ex.1 s.20–25 (BC + AC′), Ex.2 s.26–31 (z′ + x′y), s.32 (y + z′): each has one minimal cover. */
const SETS: KmapSet[] = [
  { id: "m3467", vars: ["A", "B", "C"], minterms: [3, 4, 6, 7] },
  { id: "m02346", vars: ["x", "y", "z"], minterms: [0, 2, 3, 4, 6] },
  { id: "m023467", vars: ["x", "y", "z"], minterms: [0, 2, 3, 4, 6, 7] },
];

export const threeVariableTopic: TopicInput = {
  id: "kmap-three",
  title: "Three-variable maps",
  summary: "Fill a 2 × 4 map from Σ, group the 1s (largest groups, fewest groups, edges touch), and read F.",
  preview: "Σ → map → groups → F",
  concepts: [{ id: "km.procedure", title: "K-map procedure", summary: "Canonical form → fill the map → group 8, 4, 2 or 1 adjacent 1s (wrap allowed) → one term per group → F." }],
  objectives: [{ id: "km.obj.three", conceptId: "km.procedure", text: "Simplify a three-variable function with a K-map, one group at a time." }],
  activities: [
    {
      id: "kmap-three",
      title: "Three-variable maps",
      summary: "Fill, group, name each group, then F.",
      authority: "DEMO",
      minutes: 15,
      questions: [{ id: "km.q.three", label: "Simplify with a map", conceptId: "km.procedure", objectiveId: "km.obj.three", variants: SETS.map((s, k) => kmapVariant(s, k)) }],
    },
  ],
};

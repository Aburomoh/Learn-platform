/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 3, three-variable exercises (#278, content pack ch3 §4): the slides' practice
 * maps, no worked lead-in; hints come only when asked. Answers are machine-worked (the owner
 * confirmed the pack's Chapter 3 answers, #192); s.47 has two minimal covers and both are accepted.
 */
import type { CourseInput } from "../../schema";
import { kmapVariant, type KmapSet } from "./kmap-variant";

type TopicInput = CourseInput["modules"][number]["topics"][number];

const SETS: KmapSet[] = [
  { id: "x46", vars: ["x", "y", "z"], minterms: [0, 1, 2, 4, 6, 7] },
  { id: "x47", vars: ["x", "y", "z"], minterms: [0, 1, 4, 6, 7] },
  { id: "x92", vars: ["A", "B", "C"], minterms: [0, 2, 4, 5, 6, 7] },
  { id: "x94", vars: ["x", "y", "z"], minterms: [0, 1, 3, 5, 7] },
];

export const threeVariableExercisesTopic: TopicInput = {
  id: "kmap-three-exercises",
  title: "Three-variable exercises",
  summary: "Practice maps from the slides: the same steps, no worked example first.",
  preview: "Σ(…) → F, on your own",
  concepts: [{ id: "km.practice", title: "Map practice", summary: "Fill, group, name each group and write F without a worked example; any minimal cover counts." }],
  objectives: [{ id: "km.obj.practice", conceptId: "km.practice", text: "Simplify three-variable functions with a K-map on your own." }],
  activities: [
    {
      id: "kmap-three-exercises",
      title: "Three-variable exercises",
      summary: "Four maps; ask for a hint when you need one.",
      authority: "DEMO",
      minutes: 20,
      questions: [{ id: "km.q.three-exercise", label: "Exercise map", conceptId: "km.practice", objectiveId: "km.obj.practice", variants: SETS.map((s, k) => kmapVariant(s, k)) }],
    },
  ],
};

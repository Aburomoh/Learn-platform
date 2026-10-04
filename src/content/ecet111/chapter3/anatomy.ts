/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 3, map anatomy (#276, content pack ch3 §2): minterm ↔ bits ↔ cell, in Gray
 * order, and which cells make up one literal (A, B′, C, D′ …). Positions come from the kind's
 * layout (`kmapLayout`) and regions from the Boolean module, never typed by hand.
 */
import type { CourseInput, VariantInput } from "../../schema";
import { kmapLayout } from "@/kinds/kmap/logic";
import { envFor, evaluate, parseBool } from "../../boolean";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];

const ORDINAL = ["first", "second", "third", "fourth"];

function rotate<T>(xs: T[], k: number): T[] {
  const r = k % xs.length;
  return [...xs.slice(r), ...xs.slice(0, r)];
}

/* ---------- 1. which minterm sits in a cell (predict one index before filling) ---------- */

/** Variables, row index, column index (display order). Every set lands in a column 11 or 10, where binary order differs. */
const CELL_SETS: [string[], number, number][] = [
  [["A", "B", "C"], 1, 3],
  [["A", "B", "C"], 0, 2],
  [["A", "B", "C", "D"], 2, 3],
];

function cellVariant([vars, row, col]: [string[], number, number], k: number): VariantInput {
  const layout = kmapLayout(vars);
  const right = layout.grid[row][col];
  const colBits = vars.length - layout.rowVars.length;
  const rowBits = layout.rowVars.length;
  // the same position read with the axes in binary order 00 01 10 11
  const binary = ((rowBits === 2 ? row : layout.rowCodes[row]) << colBits) | col;
  const pad = (v: number, b: number) => v.toString(2).padStart(b, "0");
  const near = [...new Set([right, binary, right ^ 1, right ^ (1 << colBits)])].slice(0, 4);
  const options = rotate(near.map((m) => ({ id: `m${m}`, text: `m${m}` })), k + 1);
  const rowLabel = pad(layout.rowCodes[row], rowBits);
  const colLabel = pad(layout.colCodes[col], colBits);
  // the row label read in binary order, or the other row on a one-bit axis
  const altRow = rowBits === 2 && pad(row, 2) !== rowLabel ? pad(row, 2) : pad(layout.rowCodes[row] ^ 1, rowBits);
  return {
    id: `c${vars.length}${row}${col}`,
    prompt: `On the ${vars.length}-variable map (rows ${layout.rowVars.join("")}, columns ${layout.colVars.join("")}), which minterm sits in the ${ORDINAL[row]} row, ${ORDINAL[col]} column?`,
    spec: { kind: "multiple-choice", options, correctOptionId: `m${right}` },
    hints: [
      { rung: 2, text: "Not yet. Read the labels on the map, not the position count." },
      { rung: 3, text: "The column labels run 00, 01, 11, 10: neighbours differ in one bit." },
      { rung: 4, text: `Which label is above the ${ORDINAL[col]} column?` },
      { rung: 9, text: `Row ${rowLabel}, column ${colLabel}: ${rowLabel}${colLabel} is m${right}.` },
    ],
    misconceptions: binary !== right ? [{ id: "km.position-binary", title: "Counted the columns in binary order", nudgeKey: "km.fill-binary-order", detect: { type: "option", optionId: `m${binary}` } }] : [],
    explanation: [
      { id: "s1", say: "A cell's minterm number is its row bits followed by its column bits, read as one binary number." },
      {
        id: "s2",
        say: `The ${ORDINAL[col]} column is labelled ${colLabel}.`,
        ask: { prompt: `The ${ORDINAL[row]} row is labelled…`, options: k % 2 ? [altRow, rowLabel] : [rowLabel, altRow], correctIndex: k % 2, afterCorrect: "Yes.", afterWrong: `It is ${rowLabel}.` },
      },
      { id: "s3", say: `So the bits are ${rowLabel}${colLabel}: m${right}.` },
    ],
  };
}

/* ---------- 2. which cells form one literal ---------- */

/** Literal, map variables: B′ and C on the three-variable map, D′ on the four-variable map (s.13–18, s.54–61). */
const REGION_SETS: [string, string[]][] = [["B'", ["A", "B", "C"]], ["C", ["A", "B", "C"]], ["D'", ["A", "B", "C", "D"]]];

const cellsOf = (literal: string, vars: string[]) => {
  const e = parseBool(literal, { vars });
  return Array.from({ length: 2 ** vars.length }, (_, m) => m).filter((m) => evaluate(e, envFor(vars, m)) === 1);
};

function regionVariant([literal, vars]: [string, string[]], k: number): VariantInput {
  const name = literal.replace("'", "′");
  const right = cellsOf(literal, vars);
  const complement = cellsOf(literal.endsWith("'") ? literal.slice(0, -1) : `${literal}'`, vars);
  const others = vars.filter((v) => v !== literal[0]).slice(0, 2).map((v) => cellsOf(v, vars));
  const choices = [right, complement, ...others].map((ms, j) => ({ id: j === 0 ? "right" : j === 1 ? "complement" : `other${j}`, text: ms.map((m) => `m${m}`).join(", ") }));
  return {
    id: `r${literal.replace("'", "n").toLowerCase()}${vars.length}`,
    prompt: `On the ${vars.length}-variable map, which cells make up ${name}?`,
    spec: { kind: "multiple-choice", options: rotate(choices, k + 1), correctOptionId: "right" },
    hints: [
      { rung: 2, text: `Not yet. ${name} is every cell where ${literal[0]} = ${literal.endsWith("'") ? 0 : 1}.` },
      { rung: 3, text: `Find the bar labelled ${literal[0]} beside the map: ${literal.endsWith("'") ? "the cells outside it" : "the cells inside it"}.` },
      { rung: 9, text: `${name} = ${choices[0].text}.` },
    ],
    misconceptions: [{ id: "km.region-complement", title: "Took the cells of the complement", nudgeKey: "km.region-complement", detect: { type: "option", optionId: "complement" } }],
    explanation: [
      { id: "s1", say: "One literal covers half the map: every cell where that variable has one value." },
      {
        id: "s2",
        say: `The bar labelled ${literal[0]} marks where ${literal[0]} = 1.`,
        ask: { prompt: `Are the cells of ${name} inside the bar?`, options: k % 2 ? ["No", "Yes"] : ["Yes", "No"], correctIndex: !literal.endsWith("'") === (k % 2 === 0) ? 0 : 1, afterCorrect: "Right.", afterWrong: literal.endsWith("'") ? "No: a primed literal is outside the bar." : "Yes: inside the bar." },
      },
      { id: "s3", say: `${name} takes ${right.length} cells, half the map.` },
    ],
  };
}

const anatomyActivity: Activity = {
  id: "kmap-anatomy",
  title: "Map anatomy",
  summary: "Which minterm sits in which cell, and which cells make up one literal.",
  authority: "DEMO",
  minutes: 8,
  questions: [
    { id: "km.q.cell", label: "Which minterm?", conceptId: "km.anatomy", objectiveId: "km.obj.anatomy", variants: CELL_SETS.map((s, k) => cellVariant(s, k)) },
    { id: "km.q.region", label: "Which cells?", conceptId: "km.anatomy", objectiveId: "km.obj.anatomy", variants: REGION_SETS.map((s, k) => regionVariant(s, k)) },
  ],
};

export const anatomyTopic: TopicInput = {
  id: "kmap-anatomy",
  title: "Map anatomy",
  summary: "The K-map's cells in Gray order: a cell's number is its row bits then its column bits, and each literal is half the map.",
  preview: "row 1, column 10 → m6",
  concepts: [{ id: "km.anatomy", title: "Map layout", summary: "Axes in Gray order 00, 01, 11, 10; m-index = row bits then column bits; a literal is the cells inside (or outside) its bar." }],
  objectives: [{ id: "km.obj.anatomy", conceptId: "km.anatomy", text: "Locate a minterm on a 3- or 4-variable map and name the cells of a literal." }],
  activities: [anatomyActivity],
};

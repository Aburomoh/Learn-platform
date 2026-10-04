import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";
import { KarnaughMap, groupPieces } from "./KarnaughMap";
import { cellValues, kmapLayout } from "./logic";

const three = kmapLayout(["A", "B", "C"]);
const four = kmapLayout(["A", "B", "C", "D"]);
const cell = (m: number) => screen.getByRole("gridcell", { name: new RegExp(`^m${m},`) });

describe("groupPieces: outlines in display order", () => {
  it("a plain group is one closed rectangle", () => {
    expect(groupPieces(three, [3, 7])).toEqual([{ row: 0, rows: 2, col: 2, cols: 1, openTop: false, openBottom: false, openLeft: false, openRight: false }]);
  });

  it("a group that wraps left to right is two halves, open towards the edge", () => {
    const pieces = groupPieces(three, [4, 6]); // A = 1, columns 00 and 10
    expect(pieces.map((p) => [p.row, p.col, p.cols, p.openLeft, p.openRight])).toEqual([
      [1, 0, 1, true, false],
      [1, 3, 1, false, true],
    ]);
  });

  it("the four corners of a 4 x 4 map are four quarters", () => {
    const pieces = groupPieces(four, [0, 2, 8, 10]);
    expect(pieces).toHaveLength(4);
    expect(pieces.every((p) => (p.openTop || p.openBottom) && (p.openLeft || p.openRight))).toBe(true);
  });
});

describe("KarnaughMap", () => {
  it("draws the slides' layout: Gray-order axes, minterm numbers, bars and a split corner", () => {
    render(<KarnaughMap id="k" layout={four} values={cellValues({ kind: "kmap", vars: ["A", "B", "C", "D"], minterms: [5], dontCares: [7], fill: false })} mode="read" />);
    const grid = screen.getByRole("grid", { name: "Karnaugh map, AB by CD" });
    expect(within(grid).getAllByRole("columnheader").slice(1).map((h) => h.textContent)).toEqual(["00", "01", "11", "10"]);
    expect(within(grid).getAllByRole("rowheader").map((h) => h.textContent)).toEqual(["00", "01", "11", "10"]);
    // row AB = 01, columns CD in Gray order: m4 m5 m7 m6
    expect(within(grid).getAllByRole("row")[2]).toHaveTextContent("01m40m51m7xm60");
    expect(cell(7)).toHaveAccessibleName("m7, AB = 01, CD = 11: don't care");
    expect(grid).toHaveAttribute("aria-readonly", "true");
  });

  it("fill: typing moves on in reading order, Space cycles, Check sends one value per minterm", async () => {
    const onFill = vi.fn();
    const two = kmapLayout(["A", "B"]);
    render(<KarnaughMap id="k" layout={two} values={[0, 1, 1, 0]} mode="fill" onFill={onFill} />);
    const user = userEvent.setup();
    expect(screen.getByRole("button", { name: "Check map" })).toBeDisabled();
    cell(0).focus();
    await user.keyboard("011");
    expect(cell(3)).toHaveFocus();
    await user.keyboard(" "); // empty → 0
    expect(screen.getAllByRole("gridcell").filter((c) => c.tabIndex === 0)).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Check map" }));
    expect(onFill).toHaveBeenCalledWith([0, 1, 1, 0]);
  });

  it("after a wrong fill only the first wrong cell is marked and focused", () => {
    const two = kmapLayout(["A", "B"]);
    render(<KarnaughMap id="k" layout={two} values={[0, 1, 1, 0]} mode="fill" state="incorrect" wrongCell={2} onFill={() => {}} />);
    const marked = screen.getAllByRole("gridcell").filter((c) => c.getAttribute("aria-invalid") === "true");
    expect(marked).toEqual([cell(2)]);
    expect(cell(2)).toHaveFocus();
    expect(cell(2)).toHaveTextContent("✕");
  });

  it("group: cells toggle with tap or Space, Escape clears, Check sends the picked minterms", async () => {
    const onGroup = vi.fn();
    render(<KarnaughMap id="k" layout={three} values={cellValues({ kind: "kmap", vars: ["A", "B", "C"], minterms: [3, 4, 6, 7], dontCares: [], fill: false })} mode="group" onGroup={onGroup} />);
    const user = userEvent.setup();
    await user.click(cell(4));
    await user.keyboard("{Escape}");
    expect(cell(4)).toHaveAttribute("aria-selected", "false");
    // touch: the quiet Clear selection action does the same, and the count follows the picks (#384)
    const clear = screen.getByRole("button", { name: "Clear selection" });
    expect(clear).toBeDisabled();
    await user.click(cell(4));
    await user.click(cell(6));
    expect(screen.getByText(/2 cells selected/)).toHaveTextContent("Group 1: 2 cells selected");
    await user.click(clear);
    expect(screen.getByText(/0 cells selected/)).toBeInTheDocument();
    expect(cell(6)).toHaveAttribute("aria-selected", "false");
    await user.click(cell(7));
    cell(3).focus();
    await user.keyboard(" ");
    expect(cell(3)).toHaveAccessibleName("m3, A = 0, BC = 11: 1, in the group");
    await user.click(screen.getByRole("button", { name: "Check group" }));
    expect(onGroup).toHaveBeenCalledWith([3, 7]);
  });

  it("accepted groups are outlined and numbered, each with its own line style", () => {
    render(<KarnaughMap id="k" layout={three} values={[0, 0, 0, 1, 1, 0, 1, 1]} mode="read" groups={[{ cells: [3, 7] }, { cells: [4, 6] }]} />);
    const outlines = [...document.querySelectorAll("[data-group]")];
    expect(outlines.map((o) => [o.getAttribute("data-group"), o.getAttribute("data-open"), o.textContent])).toEqual([
      ["0", null, "1"],
      ["1", "left", "2"],
      ["1", "right", "2"],
    ]);
  });
});

// Σ(3,4,6,7) over A, B, C → BC + AC′ (given map: groups, terms, then F), through the stage.
const v = VariantSchema.parse({
  id: "v-k",
  prompt: "Simplify F(A, B, C) = Σ(3, 4, 6, 7) with the map.",
  spec: { kind: "kmap", vars: ["A", "B", "C"], minterms: [3, 4, 6, 7], fill: false },
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
});
const activity: Activity = { id: "km", title: "K-map", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [v] }] };
const reducer = createRunnerReducer(activity);

function Harness() {
  const [state, dispatch] = useReducer(reducer, activity, (a) => reducer(initialRunnerState(a), { type: "OPEN" }));
  const variant = currentVariant(activity, state);
  return (
    <QuestionView
      key={questionViewKey(variant, state)}
      variant={variant}
      last={state.last}
      stepIndex={state.stepIndex}
      locked={state.tutor.stage === "complete"}
      explanation={null}
      onSubmit={(answer) => dispatch({ type: "SUBMIT", answer })}
      onPredict={() => {}}
      onContinue={() => {}}
    />
  );
}

describe("kmap kind in the stage (#235)", () => {
  it("mark a group, write its term, the next group (wrapping), then F", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await screen.findByRole("grid", { name: "Karnaugh map, A by BC" });
    const term = async (label: RegExp, text: string) => {
      await user.type(await screen.findByRole("textbox", { name: label }), text);
      await user.click(screen.getByRole("button", { name: "Check" }));
    };

    // a single cell is too small a group: retried in place, nothing outlined
    await user.click(cell(7));
    await user.click(screen.getByRole("button", { name: "Check group" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-group]")).toHaveLength(0);
    await user.click(cell(3));
    await user.click(screen.getByRole("button", { name: "Check group" }));

    // its term: the group is outlined, its entry in the list still "?"
    expect(await screen.findByText("Group 1 of 2: write its term.")).toBeInTheDocument();
    // a term is one product: the key row offers the variables, the prime and delete only (#384)
    const keyNames = () => within(screen.getByRole("group", { name: "Expression keys" })).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(keyNames()).toEqual(["A", "B", "C", "complement (NOT)", "delete"]);
    expect(document.querySelectorAll("[data-group='0']")).toHaveLength(1);
    expect(screen.getByRole("list", { name: "Groups" })).toHaveTextContent("Group 1: ?");
    await term(/Term for group 1/, "BC");

    // second group wraps around the sides
    await screen.findByText("Group 2 of 2: tap its cells, then check.");
    expect(screen.getByRole("list", { name: "Groups" })).toHaveTextContent("Group 1: BC");
    await user.click(cell(4));
    await user.click(cell(6));
    await user.click(screen.getByRole("button", { name: "Check group" }));
    await term(/Term for group 2/, "AC'");
    expect([...document.querySelectorAll("[data-group='1']")].map((o) => o.getAttribute("data-open"))).toEqual(["left", "right"]);

    // F is a sum of terms: the full key row is back
    await screen.findByRole("textbox", { name: /F, the simplified function/ });
    expect(keyNames()).toContain("OR");
    await term(/F, the simplified function/, "AC' + BC");
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Groups" })).toHaveTextContent("F = AC' + BC");
  });
});

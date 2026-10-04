import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TruthTable, type TruthColumn, type TruthTableProps } from "./TruthTable";

// F = AB′ + A′B (XOR), column by column, as in the UX mock-up (#198 §2)
const col = (id: string, header: string, role: TruthColumn["role"], bits: string, given = false): TruthColumn => ({ id, header, role, given, values: [...bits].map(Number) as (0 | 1)[] });
const columns = [col("a", "A", "input", "0011", true), col("b", "B", "input", "0101", true), col("na", "A′", "derived", "1100"), col("nb", "B′", "derived", "1010"), col("ab", "AB′", "derived", "0010"), col("ba", "A′B", "derived", "0100"), col("f", "F", "output", "0110")];
const rowNames = ["0 0", "0 1", "1 0", "1 1"];
const table = (props: Partial<TruthTableProps> = {}) => <TruthTable id="t" columns={columns} rowNames={rowNames} activeColumn={4} onCheck={() => {}} {...props} />;
const editable = () => screen.getAllByRole("gridcell").filter((c) => c.hasAttribute("tabindex"));

describe("TruthTable, fill mode", () => {
  it("done columns show values, the active one is editable, later ones are empty and announced as later", () => {
    render(table());
    const grid = screen.getByRole("grid", { name: "Truth table, filling column AB′" });
    const rows = within(grid).getAllByRole("row");
    expect(rows[1]).toHaveTextContent(/^0011$/); // A B A′ B′ for row 0 0; active and later cells empty
    expect(editable()).toHaveLength(4);
    expect(editable()[0]).toHaveAccessibleName("Row 0 0, column AB′, empty");
    expect(within(rows[1]).getAllByRole("gridcell")[6]).toHaveAccessibleName("Row 0 0, column F, later");
    expect(editable().filter((c) => c.tabIndex === 0)).toHaveLength(1); // one tab stop
  });

  it("fills by keyboard: typing moves down, Space cycles, arrows move; Check sends the column", async () => {
    const onCheck = vi.fn();
    render(table({ onCheck }));
    const user = userEvent.setup();
    const check = screen.getByRole("button", { name: "Check column" });
    expect(check).toBeDisabled();
    editable()[0].focus();
    await user.keyboard("001");
    expect(editable()[3]).toHaveFocus();
    await user.keyboard(" "); // empty → 0
    await user.keyboard("{ArrowUp}{ArrowUp} "); // row 1 0: 0 → 1
    expect(editable()[1]).toHaveAccessibleName("Row 0 1, column AB′, 1");
    await user.click(check);
    expect(onCheck).toHaveBeenCalledWith({ values: [0, 1, 1, 0] });
  });

  it("tapping cycles empty → 0 → 1 → empty, with X only when allowed", async () => {
    const user = userEvent.setup();
    const { rerender } = render(table());
    const cell = editable()[0];
    for (const expected of ["0", "1", "empty"]) {
      await user.click(cell);
      expect(cell).toHaveAccessibleName(`Row 0 0, column AB′, ${expected}`);
    }
    rerender(table({ id: "t2", allowX: true }));
    editable()[0].focus();
    await user.keyboard("x");
    expect(editable()[0]).toHaveAccessibleName("Row 0 0, column AB′, X");
  });

  it("after a wrong check only the first wrong cell is marked and focused; entries stay", async () => {
    const user = userEvent.setup();
    const { rerender } = render(table());
    editable()[0].focus();
    await user.keyboard("0110");
    rerender(table({ state: "incorrect", wrongRow: 1 }));
    const cells = editable();
    expect(cells.filter((c) => c.getAttribute("aria-invalid") === "true")).toEqual([cells[1]]);
    expect(cells[1]).toHaveFocus();
    expect(cells[3]).toHaveAccessibleName("Row 1 1, column AB′, 0");
  });

  it("explain mode is read-only and reveals the active column from the top", () => {
    render(table({ onCheck: undefined, revealed: 2 }));
    expect(screen.getByRole("grid")).toHaveAttribute("aria-readonly", "true");
    expect(editable()).toHaveLength(0);
    expect(screen.queryByRole("button")).toBeNull();
    const rows = screen.getAllByRole("row");
    expect(within(rows[2]).getAllByRole("gridcell")[4]).toHaveTextContent("0");
    expect(within(rows[3]).getAllByRole("gridcell")[4]).toHaveTextContent("?");
  });

  it("a finished table shows every column", () => {
    render(table({ activeColumn: undefined, onCheck: undefined }));
    expect(screen.getAllByRole("row")[4]).toHaveTextContent(/^1100000$/);
  });

  it("state tables get a two-level header with one band per group", () => {
    const grouped = columns.map((c, i) => ({ ...c, group: i < 2 ? "Present state" : i < 6 ? "Work" : "Output" }));
    render(table({ columns: grouped }));
    const bands = screen.getAllByRole("columnheader").filter((h) => h.getAttribute("scope") === "colgroup");
    expect(bands.map((b) => [b.textContent, b.getAttribute("colspan")])).toEqual([
      ["Present state", "2"],
      ["Work", "4"],
      ["Output", "1"],
    ]);
  });
});

describe("TruthTable, row-select mode", () => {
  const full = columns.map((c) => ({ ...c, given: true }));

  it("a pick column toggles rows by tap or Space; Check sends the picked rows", async () => {
    const onCheck = vi.fn();
    render(<TruthTable id="s" columns={full} rowNames={rowNames} select={{ label: "F = 1?" }} onCheck={onCheck} />);
    const user = userEvent.setup();
    expect(screen.getByRole("grid", { name: "Truth table, F = 1?" })).toBeInTheDocument();
    const picks = editable();
    expect(picks).toHaveLength(4);
    await user.click(picks[1]);
    picks[2].focus();
    await user.keyboard(" ");
    expect(picks[1]).toHaveAttribute("aria-selected", "true");
    expect(picks[2]).toHaveAccessibleName("Row 1 0, picked");
    await user.click(screen.getByRole("button", { name: "Check rows" }));
    expect(onCheck).toHaveBeenCalledWith({ rows: [1, 2] });
  });
});

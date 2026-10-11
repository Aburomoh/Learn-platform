import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";

const figure = (f: object) => FigureSpec.parse(f);
// Ch5 s.30: the JK characteristic table, Q(t+1) = JQ′ + K′Q
const jk = {
  type: "table",
  title: "JK characteristic table",
  columns: [
    { header: "J", values: [0, 0, 0, 0, 1, 1, 1, 1] },
    { header: "K", values: [0, 0, 1, 1, 0, 0, 1, 1] },
    { header: "Q", values: [0, 1, 0, 1, 0, 1, 0, 1] },
    { header: "Q(t+1)", values: [0, 1, 0, 0, 1, 1, 1, 0], role: "output" },
  ],
  symbol: { ff: "jk" },
};

describe("table figure: a given table, read-only (#617)", () => {
  it("spec: equal column lengths, distinct headers, outputs after inputs; no focus pins; nothing is computed", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok(jk)).toBe(true);
    expect(ok({ ...jk, symbol: undefined })).toBe(true);
    expect(ok({ ...jk, columns: [jk.columns[0], { header: "K", values: [0, 1] }] })).toBe(false); // ragged
    expect(ok({ ...jk, columns: [jk.columns[0], { ...jk.columns[1], header: "J" }] })).toBe(false); // duplicate header
    expect(ok({ ...jk, columns: [jk.columns[3], jk.columns[0]] })).toBe(false); // an input after an output
    expect(ok({ ...jk, columns: [jk.columns[0]] })).toBe(false); // one column is a list, not a table
    expect(ok({ type: "table", title: "SR excitation table", columns: [{ header: "Q", values: [0, 0, 1, 1] }, { header: "Q(t+1)", values: [0, 1, 0, 1] }, { header: "S", values: [0, 1, 0, "X"], role: "output" }, { header: "R", values: ["X", 0, 1, 0], role: "output" }] })).toBe(true);
    expect(figurePins(figure(jk))).toEqual([]);
    expect(FigureSpec.parse({ ...jk, revealedRows: [1] })).not.toHaveProperty("revealedRows");
  });

  it("draws a real table with a caption, the output column behind a rule, and the symbol beside it", async () => {
    render(<FigureView id="f" figure={figure(jk)} />);
    const table = await screen.findByRole("table", { name: "JK characteristic table" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["J", "K", "Q", "Q(t+1)"]);
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(8);
    expect(within(rows[4]).getAllByRole("cell").map((c) => c.textContent)).toEqual(["1", "0", "0", "1"]);
    expect(within(table).getAllByRole("columnheader")[3].className).toMatch(/rule/);
    expect(within(table).getAllByRole("columnheader")[2].className).not.toMatch(/rule/);
    // the flip-flop symbol alone: no given, no result
    expect(screen.getByRole("img")).toHaveAccessibleName(/JK flip-flop/);
    expect(screen.getByRole("img").textContent).not.toMatch(/Q\(t\+1\) = [01]/);
  });

  it("nothing is highlighted, and the result state changes nothing: the student finds the rows", async () => {
    const f = figure({ ...jk, symbol: undefined });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const table = await screen.findByRole("table");
    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelectorAll("[data-on]")).toHaveLength(0);
    const before = table.innerHTML;
    rerender(<FigureView id="f" figure={f} revealed focus="Q" />);
    expect(screen.getByRole("table").innerHTML).toBe(before);
  });
});

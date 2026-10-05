import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TruthTable, type TruthColumn } from "./TruthTable";

const bits = (n: number, width: number) => n.toString(2).padStart(width, "0");
function table(inputs: number, given = true): { columns: TruthColumn[]; rowNames: string[] } {
  const rows = 2 ** inputs;
  const names = ["A", "B", "C", "x"].slice(4 - inputs);
  const columns: TruthColumn[] = [
    ...names.map((header, i) => ({ id: `in-${i}`, header, role: "input" as const, values: Array.from({ length: rows }, (_, r) => bits(r, inputs)[i]), given })),
    { id: "ja", header: "JA", role: "derived", values: Array.from({ length: rows }, () => 0), given: true },
    { id: "a", header: "A⁺", role: "output", values: Array.from({ length: rows }, () => 1) },
  ];
  return { columns, rowNames: Array.from({ length: rows }, (_, r) => bits(r, inputs).split("").join(" ")) };
}
const stuck = () => [...document.querySelectorAll("thead tr:last-child [data-stick]")].map((th) => th.textContent);

describe("wide state tables (#508)", () => {
  it("given input columns are marked to stay put; the first derived column leaves its rule to them", () => {
    render(<TruthTable id="t" {...table(3)} activeColumn={4} onCheck={() => {}} />);
    expect(stuck()).toEqual(["B", "C", "x"]);
    // every body cell of a stuck column carries the mark too
    expect(document.querySelectorAll("tbody [data-stick]")).toHaveLength(8 * 3);
    expect(document.querySelector("[data-sticky]")).not.toBeNull();
  });

  it("inputs the student fills are not stuck", () => {
    render(<TruthTable id="t" {...table(2, false)} activeColumn={0} onCheck={() => {}} />);
    expect(stuck()).toEqual([]);
    expect(document.querySelector("[data-sticky]")).toBeNull();
  });

  it("more than 8 rows: the column labels are repeated after every 8 rows, outside the accessibility tree", () => {
    render(<TruthTable id="t" {...table(4)} activeColumn={5} onCheck={() => {}} />);
    const repeats = [...document.querySelectorAll("tbody [data-repeat]")];
    expect(repeats).toHaveLength(2);
    expect(repeats[0].textContent).toBe("ABCxJAA⁺");
    expect(repeats.every((r) => r.getAttribute("aria-hidden") === "true")).toBe(true);
    // header row + 16 data rows
    expect(screen.getAllByRole("row")).toHaveLength(17);
  });

  it("8 rows or fewer: no repeated labels", () => {
    render(<TruthTable id="t" {...table(3)} activeColumn={4} onCheck={() => {}} />);
    expect(document.querySelectorAll("[data-repeat]")).toHaveLength(0);
  });
});

describe("compact columns on a phone (#508, point 3)", () => {
  const phone = (matches: boolean) => {
    window.matchMedia = ((query: string) => ({ matches, media: query, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
  };
  const heads = () => [...document.querySelectorAll("thead tr:last-child th")].map((th) => th.textContent);
  // A B x | JA KA JB | A⁺ (needs JA, KA)
  const columns: TruthColumn[] = [
    ...table(2).columns.slice(0, 2),
    { id: "ja", header: "JA", role: "derived", values: [0, 1, 0, 1], given: true, group: "Flip-flop inputs" },
    { id: "ka", header: "KA", role: "derived", values: [1, 1, 0, 0], given: true, group: "Flip-flop inputs" },
    { id: "jb", header: "JB", role: "derived", values: [1, 0, 0, 1], given: true, group: "Flip-flop inputs" },
    { id: "na", header: "A⁺", role: "output", values: [1, 0, 0, 1], group: "Next state", needs: ["ja", "ka"] },
  ];
  const rowNames = table(2).rowNames;

  it("keeps the inputs, the needed columns and the active one; the rest unfold from a toggle", async () => {
    phone(true);
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<TruthTable id="t" columns={columns} rowNames={rowNames} activeColumn={5} onCheck={() => {}} />);
    expect(heads()).toEqual(["C", "x", "JA", "KA", "A⁺"]);
    expect(screen.getByRole("grid", { name: "Truth table, filling column A⁺" })).toBeInTheDocument();
    // the group header spans what is left of its group
    expect([...document.querySelectorAll("thead tr:first-child th")].map((th) => `${th.textContent}:${(th as HTMLTableCellElement).colSpan}`)).toEqual([":2", "Flip-flop inputs:2", "Next state:1"]);
    await user.click(screen.getByRole("button", { name: "Show all columns" }));
    expect(heads()).toEqual(["C", "x", "JA", "KA", "JB", "A⁺"]);
    expect(screen.getByRole("button", { name: "Show only the columns for A⁺" })).toHaveAttribute("aria-pressed", "true");
  });

  it("wide screens and columns without needs are never folded", () => {
    phone(false);
    const { unmount } = render(<TruthTable id="t" columns={columns} rowNames={rowNames} activeColumn={5} onCheck={() => {}} />);
    expect(heads()).toHaveLength(6);
    expect(screen.queryByRole("button", { name: "Show all columns" })).toBeNull();
    unmount();
    phone(true);
    render(<TruthTable id="t" columns={columns.map((c) => ({ ...c, needs: undefined }))} rowNames={rowNames} activeColumn={5} onCheck={() => {}} />);
    expect(heads()).toHaveLength(6);
  });
});

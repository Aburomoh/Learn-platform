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

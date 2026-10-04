import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseBool } from "@/content/boolean";
import { ExpressionEntry, renderBool } from "./ExpressionEntry";

const vars = ["A", "B", "C"];

describe("ExpressionEntry", () => {
  it("typing shows the overbar reading; Check sends the text", async () => {
    const onAnswer = vi.fn();
    render(<ExpressionEntry id="e" label="Write F." vars={vars} onAnswer={onAnswer} />);
    const user = userEvent.setup();
    const field = screen.getByRole("textbox", { name: "Write F." });
    await user.type(field, "A'B + C");
    const reads = screen.getByText(/Reads as:/);
    expect(reads).toHaveTextContent("Reads as: AB + C");
    expect(reads.querySelector("[class*='bar']")).toHaveTextContent("A");
    expect(field).toHaveAccessibleDescription(/Reads as/);
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(onAnswer).toHaveBeenCalledWith("A'B + C");
  });

  it("the key row inserts variables and operators at the cursor; delete removes one character", async () => {
    render(<ExpressionEntry id="e" label="Write F." vars={vars} onAnswer={() => {}} />);
    const user = userEvent.setup();
    const field = screen.getByRole("textbox", { name: "Write F." }) as HTMLInputElement;
    for (const name of ["A", "complement (NOT)", "OR", "B"]) await user.click(screen.getByRole("button", { name }));
    expect(field.value).toBe("A' + B");
    await user.click(screen.getByRole("button", { name: "delete" }));
    expect(field.value).toBe("A' + ");
    // every key is a 48 px target with a name
    const keys = screen.getAllByRole("button").filter((b) => b.closest("[role='group']"));
    expect(keys.map((k) => k.getAttribute("aria-label") ?? k.textContent)).toEqual(["A", "B", "C", "complement (NOT)", "OR", "XOR", "open parenthesis", "close parenthesis", "delete"]);
  });

  it("text that does not parse yet shows an ellipsis instead of a reading", async () => {
    render(<ExpressionEntry id="e" label="Write F." vars={vars} onAnswer={() => {}} />);
    await userEvent.setup().type(screen.getByRole("textbox"), "A + (");
    expect(screen.getByText(/Reads as:/)).toHaveTextContent("Reads as: …");
  });

  it("read-only for Explain Slowly: no keys, no Check", () => {
    render(<ExpressionEntry id="e" label="Expression" vars={vars} shown="(A + B)'" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("renderBool", () => {
  it("draws one bar over a complemented group and keeps the operators", () => {
    const { container } = render(<p>{renderBool(parseBool("(A + B)' ⊕ C", { vars }))}</p>);
    expect(container).toHaveTextContent("A + B ⊕ C");
    expect(container.querySelector("[class*='bar']")).toHaveTextContent("A + B");
  });
});

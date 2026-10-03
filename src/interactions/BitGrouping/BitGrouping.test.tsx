import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BitGrouping } from "./BitGrouping";

// 26 = 11010 → octal: 011 010 → 32
const base = { id: "g", bits: "11010", groupSize: 3 as const, groups: ["011", "010"], digits: ["3", "2"] };

describe("BitGrouping: mark the groups (step 0)", () => {
  it("reports the groups the student marked, with the zeros they added", async () => {
    const onGroups = vi.fn();
    render(<BitGrouping {...base} stepIndex={0} onGroups={onGroups} />);
    const user = userEvent.setup();
    expect(screen.getByRole("button", { name: "Check groups" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Add a leading zero" }));
    // padded: 0 1 1 0 1 0 → cut before bit 4
    await user.click(screen.getByRole("button", { name: /Bit 4 of 6: 0\. Start a new group here/ }));
    await user.click(screen.getByRole("button", { name: "Check groups" }));
    expect(onGroups).toHaveBeenCalledWith(["011", "010"]);
  });

  it("reports a wrong grouping as marked, so the grader can recognise it (from the left, no padding)", async () => {
    const onGroups = vi.fn();
    render(<BitGrouping {...base} stepIndex={0} onGroups={onGroups} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Bit 4 of 5: 1\. Start a new group here/ }));
    await user.click(screen.getByRole("button", { name: "Check groups" }));
    expect(onGroups).toHaveBeenCalledWith(["110", "10"]);
  });

  it("keeps a cut in place when zeros are added afterwards, and toggles by keyboard", async () => {
    const onGroups = vi.fn();
    render(<BitGrouping {...base} stepIndex={0} onGroups={onGroups} />);
    const user = userEvent.setup();
    const cut = screen.getByRole("button", { name: /Bit 3 of 5: 0\. Start a new group here/ });
    cut.focus();
    await user.keyboard("{Enter}");
    expect(cut).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Add a leading zero" }));
    expect(screen.getByRole("button", { name: /Bit 4 of 6: 0\. Start a new group here/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Remove a leading zero" }));
    screen.getByRole("button", { name: /Bit 3 of 5: 0\. Start a new group here/ }).focus();
    await user.keyboard(" ");
    expect(screen.queryByRole("button", { pressed: true })).toBeNull();
  });

  it("does not show the groups or any digit before the grouping is done", () => {
    render(<BitGrouping {...base} stepIndex={0} onGroups={() => {}} />);
    expect(screen.queryByText("011")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

describe("BitGrouping: one digit per group", () => {
  it("asks only for the active group and shows nothing for later groups", () => {
    render(<BitGrouping {...base} stepIndex={1} onDigit={() => {}} />);
    expect(screen.getAllByText("011").length).toBeGreaterThan(0);
    expect(screen.getByText("010")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByLabelText("Group 1 of 2, 011: octal digit")).toHaveFocus();
    expect(document.querySelector("[data-focus-target='group-1']")).not.toHaveTextContent(/[2?]/);
  });

  it("submits the typed digit by keyboard and keeps earlier digits", async () => {
    const onDigit = vi.fn();
    render(<BitGrouping {...base} stepIndex={2} onDigit={onDigit} />);
    expect(document.querySelector("[data-focus-target='group-0']")).toHaveTextContent("3");
    await userEvent.setup().keyboard("2{Enter}");
    expect(onDigit).toHaveBeenCalledWith("2");
  });

  it("accepts only digits of the base; hex is upper-cased and may be two characters (to catch 13 for D)", async () => {
    const onDigit = vi.fn();
    const { unmount } = render(<BitGrouping {...base} stepIndex={1} onDigit={onDigit} />);
    const user = userEvent.setup();
    await user.keyboard("9a7");
    expect(screen.getByRole("textbox")).toHaveValue("7");
    unmount();
    render(<BitGrouping id="h" bits="11010" groupSize={4} groups={["0001", "1010"]} digits={["1", "A"]} stepIndex={2} onDigit={onDigit} />);
    await user.keyboard("a");
    expect(screen.getByRole("textbox")).toHaveValue("A");
    await user.clear(screen.getByRole("textbox"));
    await user.keyboard("10{Enter}");
    expect(onDigit).toHaveBeenLastCalledWith("10");
  });

  it("when done shows every digit and the joined result, with no input", () => {
    render(<BitGrouping {...base} stepIndex={3} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.querySelector("[data-focus-target='group-result']")).toHaveTextContent("(32)8 in octal");
  });

  it("is read-only without onDigit (explanation mode)", () => {
    render(<BitGrouping {...base} stepIndex={1} attention={0} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByText("?")).toHaveLength(1);
  });
});

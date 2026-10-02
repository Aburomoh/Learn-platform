import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DragToTarget } from "./DragToTarget";

const items = [{ id: "one", label: "1", reusable: true }];
const targets = [
  { id: "s32", label: "32 slot", itemId: null },
  { id: "s16", label: "16 slot", itemId: null },
  { id: "s8", label: "8 slot", itemId: "one" },
];

describe("DragToTarget keyboard path", () => {
  it("grabs with Space, moves with arrows, places with Enter", async () => {
    const onPlace = vi.fn();
    render(<DragToTarget id="d" items={items} targets={targets} onPlace={onPlace} />);
    const user = userEvent.setup();
    const piece = screen.getByRole("button", { name: "1" });
    piece.focus();
    await user.keyboard(" ");
    expect(piece).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{Enter}");
    expect(onPlace).toHaveBeenCalledWith("one", "s16");
    expect(piece).not.toHaveAttribute("aria-pressed");
  });

  it("cancels with Escape", async () => {
    const onPlace = vi.fn();
    render(<DragToTarget id="d" items={items} targets={targets} onPlace={onPlace} />);
    const user = userEvent.setup();
    screen.getByRole("button", { name: "1" }).focus();
    await user.keyboard(" ");
    await user.keyboard("{Escape}");
    expect(onPlace).not.toHaveBeenCalled();
  });

  it("removes a placed item when its target is activated", async () => {
    const onRemove = vi.fn();
    render(<DragToTarget id="d" items={items} targets={targets} onPlace={() => {}} onRemove={onRemove} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /8 slot: 1/ }));
    expect(onRemove).toHaveBeenCalledWith("s8");
  });

  it("does nothing when disabled", async () => {
    const onPlace = vi.fn();
    render(<DragToTarget id="d" items={items} targets={targets} onPlace={onPlace} disabled />);
    const piece = screen.getByRole("button", { name: "1" });
    expect(piece).toBeDisabled();
  });
});

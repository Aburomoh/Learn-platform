import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

// jsdom has no layout: elementFromPoint and pointer capture are stubbed; the real-browser path is e2e.
describe("DragToTarget pointer path", () => {
  let under: Element | null = null;
  beforeEach(() => {
    document.elementFromPoint = () => under;
    HTMLElement.prototype.setPointerCapture = () => {};
    HTMLElement.prototype.releasePointerCapture = () => {};
  });
  afterEach(() => {
    under = null;
  });

  function drag(piece: HTMLElement, overSelector: string | null) {
    fireEvent.pointerDown(piece, { button: 0, pointerId: 1, clientX: 5, clientY: 5 });
    under = overSelector ? document.querySelector(overSelector) : document.body;
    fireEvent.pointerMove(piece, { pointerId: 1, clientX: 50, clientY: 50 });
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 50, clientY: 50 });
  }

  it("places an item released over a target", () => {
    const onPlace = vi.fn();
    render(<DragToTarget id="d" items={items} targets={targets} onPlace={onPlace} />);
    drag(screen.getByRole("button", { name: "1" }), "[data-drop-target='s16']");
    expect(onPlace).toHaveBeenCalledWith("one", "s16");
  });

  it("cancels when released outside any target", () => {
    const onPlace = vi.fn();
    render(<DragToTarget id="d" items={items} targets={targets} onPlace={onPlace} />);
    drag(screen.getByRole("button", { name: "1" }), null);
    expect(onPlace).not.toHaveBeenCalled();
    expect(screen.getByText("Cancelled.")).toBeInTheDocument();
  });

  it("ignores a non-primary button", () => {
    const onPlace = vi.fn();
    render(<DragToTarget id="d" items={items} targets={targets} onPlace={onPlace} />);
    const piece = screen.getByRole("button", { name: "1" });
    fireEvent.pointerDown(piece, { button: 2, pointerId: 1 });
    under = document.querySelector("[data-drop-target='s16']");
    fireEvent.pointerUp(piece, { pointerId: 1 });
    expect(onPlace).not.toHaveBeenCalled();
  });
});

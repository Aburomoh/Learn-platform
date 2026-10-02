import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { TutorBubble } from "./TutorBubble";

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  });
}

describe("TutorBubble", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("types gradually and exposes the full text to assistive tech at once", () => {
    mockReducedMotion(false);
    render(<TutorBubble text="Look here." speed={100} />);
    const bubble = screen.getByRole("button", { name: "Show the whole message" });
    expect(bubble).toHaveAttribute("data-complete", "false");
    expect(screen.getByText("Look here.", { selector: ".sr-only" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(50));
    expect(bubble.querySelector("[aria-hidden]")?.textContent).toBe("Look ");
    act(() => vi.advanceTimersByTime(200));
    expect(bubble).toHaveAttribute("data-complete", "true");
  });

  it("reveals everything immediately on click", () => {
    mockReducedMotion(false);
    const onDone = vi.fn();
    render(<TutorBubble text="A longer message." speed={10} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Show the whole message" }));
    expect(screen.queryByRole("button")).toBeNull();
    expect(onDone).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("renders instantly under reduced motion", () => {
    mockReducedMotion(true);
    render(<TutorBubble text="Instant." speed={10} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByText("Instant.").length).toBeGreaterThan(0);
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaceValueDiagram } from "./PlaceValueDiagram";

describe("PlaceValueDiagram", () => {
  it("renders place values most-significant first with focus targets", () => {
    render(<PlaceValueDiagram id="pv" slots={6} digits={[null, null, null, null, null, null]} />);
    const slots = document.querySelectorAll("[data-focus-target^='slot-']");
    expect([...slots].map((s) => s.getAttribute("data-focus-target"))).toEqual(["slot-32", "slot-16", "slot-8", "slot-4", "slot-2", "slot-1"]);
  });

  it("sets a bit via the keyboard drag path and reports digits", async () => {
    const onChange = vi.fn();
    render(<PlaceValueDiagram id="pv" slots={6} digits={[null, null, null, null, null, null]} onChange={onChange} />);
    const user = userEvent.setup();
    screen.getByRole("button", { name: "1" }).focus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith([1, null, null, null, null, null]);
  });

  it("shows the running total of lit places", () => {
    render(<PlaceValueDiagram id="pv" slots={6} digits={[1, 0, 1, 1, 0, 1]} />);
    expect(screen.getByText("Total so far:").parentElement).toHaveTextContent("45");
  });

  it("in explanation mode lights only the given places and locks dragging", () => {
    render(<PlaceValueDiagram id="pv" slots={6} digits={[null, null, null, null, null, null]} lit={[32, 8]} remainder={5} />);
    expect(screen.getByText("Total so far:").parentElement).toHaveTextContent("40");
    expect(screen.getByText("Remaining:").parentElement).toHaveTextContent("5");
    expect(screen.getByRole("button", { name: "1" })).toBeDisabled();
  });
});

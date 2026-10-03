import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TutorPanel } from "./TutorPanel";

const panel = () => screen.getByRole("complementary", { name: "Tutor" });
const show = (message: string, seq = 1, speed = 0) => (
  <>
    <TutorPanel name="Dr. M" expression="neutral" message={message} messageSeq={seq} typingSpeed={speed} />
    <input aria-label="answer" />
    <button type="button">Continue</button>
  </>
);

describe("TutorPanel strip: unread text is never clamped", () => {
  it("shows a new message in full, with a toggle that reports it as expanded", () => {
    render(show("A long explanation step"));
    expect(panel()).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("button", { name: "Show less of the tutor message" })).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses once the message is stale: typing, a click elsewhere, or a page scroll", async () => {
    const user = userEvent.setup();
    const { unmount } = render(show("Read me"));
    await user.type(screen.getByLabelText("answer"), "1");
    expect(panel()).toHaveAttribute("data-expanded", "false");
    unmount();

    const second = render(show("Read me"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(panel()).toHaveAttribute("data-expanded", "false");
    second.unmount();

    render(show("Read me"));
    // programmatic scrolling (focus moving, layout settling) is not the student moving on
    act(() => { fireEvent.scroll(window); });
    expect(panel()).toHaveAttribute("data-expanded", "true");
    act(() => { fireEvent.wheel(document.body); });
    expect(panel()).toHaveAttribute("data-expanded", "false");
  });

  it("opens again for the next message, even when the text repeats", async () => {
    const { rerender } = render(show("Not quite.", 1));
    await userEvent.setup().type(screen.getByLabelText("answer"), "1");
    expect(panel()).toHaveAttribute("data-expanded", "false");
    rerender(show("Not quite.", 2));
    expect(panel()).toHaveAttribute("data-expanded", "true");
  });

  it("reopens a stale message by tap or toggle, and Escape collapses it", async () => {
    const user = userEvent.setup();
    render(show("Read me"));
    await user.type(screen.getByLabelText("answer"), "1");
    await user.click(panel());
    expect(panel()).toHaveAttribute("data-expanded", "true");
    const toggle = screen.getByRole("button", { name: "Show less of the tutor message" });
    toggle.focus();
    await user.keyboard("{Escape}");
    expect(panel()).toHaveAttribute("data-expanded", "false");
    await user.keyboard("{Enter}");
    expect(panel()).toHaveAttribute("data-expanded", "true");
  });

  it("a tap that skips the typing does not also collapse the message", async () => {
    render(show("A long message that is still being typed", 1, 1));
    const bubble = document.querySelector("[data-complete='false']")!;
    await userEvent.setup().click(bubble);
    expect(document.querySelector("[data-complete='true']")).not.toBeNull();
    expect(panel()).toHaveAttribute("data-expanded", "true");
  });

  it("has no toggle while the tutor is quiet", () => {
    render(<TutorPanel name="Dr. M" expression="neutral" message="" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

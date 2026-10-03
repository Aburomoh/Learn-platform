import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TutorPanel } from "./TutorPanel";

const panel = () => screen.getByRole("complementary", { name: "Tutor" });

describe("TutorPanel compact strip", () => {
  it("starts collapsed and expands with the toggle, by keyboard", async () => {
    render(<TutorPanel name="Dr. M" expression="neutral" message="A long message" typingSpeed={0} />);
    const toggle = screen.getByRole("button", { name: "Show the whole tutor message" });
    expect(panel()).toHaveAttribute("data-expanded", "false");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    toggle.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(panel()).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("button", { name: "Show less of the tutor message" })).toHaveAttribute("aria-expanded", "true");
  });

  it("expands on tap and collapses with Escape", async () => {
    render(<TutorPanel name="Dr. M" expression="neutral" message="A long message" typingSpeed={0} />);
    const user = userEvent.setup();
    await user.click(panel());
    expect(panel()).toHaveAttribute("data-expanded", "true");
    screen.getByRole("button", { name: "Show less of the tutor message" }).focus();
    await user.keyboard("{Escape}");
    expect(panel()).toHaveAttribute("data-expanded", "false");
  });

  it("collapses again when a new message arrives", async () => {
    const { rerender } = render(<TutorPanel name="Dr. M" expression="neutral" message="First" typingSpeed={0} />);
    await userEvent.setup().click(panel());
    expect(panel()).toHaveAttribute("data-expanded", "true");
    rerender(<TutorPanel name="Dr. M" expression="neutral" message="Second" typingSpeed={0} />);
    expect(panel()).toHaveAttribute("data-expanded", "false");
  });

  it("has no toggle while the tutor is quiet", () => {
    render(<TutorPanel name="Dr. M" expression="neutral" message="" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

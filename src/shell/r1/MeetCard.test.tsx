import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getCourse } from "@/content";
import { FigureSpec } from "@/kinds/shared/figures/figureSpec";
import { MeetCard } from "./MeetCard";

const meet = { figure: FigureSpec.parse({ type: "device", device: "decoder", bits: 2, given: 2, names: ["x", "y"] }), callouts: ["A code comes in: x y = 10.", "10 is 2, so line D2 goes to 1.", "Every other line stays 0."] };

describe("MeetCard (visual system §11)", () => {
  it("shows the worked case in its result state, with 1 2 3 on the figure and on the callouts", async () => {
    render(<MeetCard id="t" meet={meet} />);
    expect(await screen.findByRole("img")).toHaveAccessibleName("2 to 4 DEC. Given: x = 1, y = 0. Answer: D2.");
    expect([...document.querySelectorAll("[data-mark]")].map((m) => m.textContent)).toEqual(["1", "2", "3"]);
    expect(within(screen.getByRole("list")).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["11. A code comes in: x y = 10.", "22. 10 is 2, so line D2 goes to 1.", "33. Every other line stays 0."]);
  });

  it("phones: the callouts open from 'How it works'", async () => {
    render(<MeetCard id="t" meet={meet} />);
    const user = userEvent.setup();
    const toggle = screen.getByRole("button", { name: "How it works" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("list")).toHaveAttribute("data-open", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("list")).toHaveAttribute("data-open", "true");
  });

  it("the P0 device topics carry a card", () => {
    const withCard = getCourse("ecet111")!.modules.flatMap((m) => m.topics).filter((t) => t.meet).map((t) => t.id);
    expect(withCard).toEqual(expect.arrayContaining(["decoders-encoders", "multiplexers", "half-adder", "full-adder", "flip-flops"]));
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HintReveal } from "./HintReveal";

describe("HintReveal", () => {
  it("shows only hints the engine granted and requests more on click", async () => {
    const onRequest = vi.fn();
    render(<HintReveal revealed={[{ rung: 2, text: "Not yet." }]} canRequest onRequest={onRequest} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    await userEvent.setup().click(screen.getByRole("button", { name: "Another hint" }));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it("locks the button with a reason", () => {
    render(<HintReveal revealed={[]} canRequest={false} lockedReason="Try once first" onRequest={() => {}} />);
    expect(screen.getByRole("button", { name: "Hint" })).toBeDisabled();
    expect(screen.getByText("Try once first")).toBeInTheDocument();
  });

  it("offers Explain slowly when a handler is given", async () => {
    const onExplain = vi.fn();
    render(<HintReveal revealed={[]} canRequest onRequest={() => {}} onExplainSlowly={onExplain} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Explain slowly" }));
    expect(onExplain).toHaveBeenCalled();
  });
});

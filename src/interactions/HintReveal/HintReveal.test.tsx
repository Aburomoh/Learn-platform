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

  it("list only (the stage renders its own controls, #691): nothing with no hints, the named mistake as the first card beside every hint (#700)", () => {
    const { container, rerender } = render(<HintReveal revealed={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<HintReveal revealed={[]} diagnosis={{ text: "They are swapped." }} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("What went wrong");
    expect(screen.getByRole("listitem")).toHaveTextContent("They are swapped.");
    rerender(<HintReveal revealed={[{ rung: 2, text: "Not yet." }]} diagnosis={{ text: "They are swapped." }} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("data-diagnosis");
    expect(items[1]).toHaveTextContent("Nudge");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("a hint granted before any Check shows without its verdict, in English and in Arabic (#717)", async () => {
    const { _setArabicMap, SHARED, _resetArabic } = await import("@/l10n/arabic");
    const { _setPrefs } = await import("@/learner/store");
    const { act } = await import("@testing-library/react");
    _resetArabic();
    const template = "Not yet. Do {n} ÷ 2 carefully.";
    render(<HintReveal revealed={[{ rung: 2, text: "Do 26 ÷ 2 carefully.", template, vars: { n: 26 }, unchecked: true }]} />);
    expect(screen.getByRole("listitem")).toHaveTextContent("Do 26 ÷ 2 carefully.");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("Not yet");
    _setArabicMap(SHARED, { [template]: "ليس بعد. احسب {n} ÷ 2 بدقة." });
    act(() => {
      _setPrefs({ locale: "ar" });
    });
    expect(screen.getByRole("listitem")).toHaveTextContent("احسب 26 ÷ 2 بدقة.");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("ليس بعد");
    act(() => {
      _setPrefs({ locale: "en" });
    });
    _resetArabic();
  });

  it("offers Explain slowly when a handler is given", async () => {
    const onExplain = vi.fn();
    render(<HintReveal revealed={[]} canRequest onRequest={() => {}} onExplainSlowly={onExplain} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Explain slowly" }));
    expect(onExplain).toHaveBeenCalled();
  });
});

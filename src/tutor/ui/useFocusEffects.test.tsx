import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { useFocusEffects, FOCUS_CLASS, HIGHLIGHT_CLASS, PULSE_CLASS } from "./useFocusEffects";
import type { TutorAction } from "../engine/actions";
import { EXPRESSIONS } from "../engine/actions";
import { TutorAvatar } from "./TutorAvatar";

function Harness({ actions }: { actions: TutorAction[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { apply } = useFocusEffects(ref);
  return (
    <div ref={ref}>
      <span data-focus-target="slot-32">32</span>
      <span data-focus-target="slot-16">16</span>
      <button type="button" onClick={() => actions.forEach(apply)}>
        go
      </button>
    </div>
  );
}

describe("useFocusEffects", () => {
  it("applies focus, highlight and pulse classes and clears on reset", () => {
    render(<Harness actions={[{ type: "FOCUS", target: "slot-32" }, { type: "HIGHLIGHT", target: "slot-16" }, { type: "PULSE", target: "slot-16" }]} />);
    screen.getByText("go").click();
    expect(screen.getByText("32")).toHaveClass(FOCUS_CLASS);
    expect(screen.getByText("16")).toHaveClass(HIGHLIGHT_CLASS, PULSE_CLASS);
  });

  it("moves focus and clears everything on RESET_INTERACTION", () => {
    render(<Harness actions={[{ type: "FOCUS", target: "slot-32" }, { type: "FOCUS", target: "slot-16" }, { type: "RESET_INTERACTION" }]} />);
    screen.getByText("go").click();
    expect(screen.getByText("32")).not.toHaveClass(FOCUS_CLASS);
    expect(screen.getByText("16")).not.toHaveClass(FOCUS_CLASS);
  });
});

describe("TutorAvatar", () => {
  it("renders every expression with an accessible label", () => {
    for (const e of EXPRESSIONS) {
      const { unmount } = render(<TutorAvatar expression={e} name="Dr. Demo" />);
      expect(screen.getByRole("img", { name: /Dr\. Demo/ })).toBeInTheDocument();
      expect(document.querySelector(`[data-expression="${e}"]`)).not.toBeNull();
      // the monogram, and no developer caption for students to read (#162)
      expect(screen.getByRole("img")).toHaveTextContent("DD");
      expect(document.body.textContent).not.toMatch(/placeholder/i);
      unmount();
    }
  });
});

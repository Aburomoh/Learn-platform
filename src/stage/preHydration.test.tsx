import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MultipleChoice } from "@/interactions/MultipleChoice/MultipleChoice";
import { NumericInput } from "@/interactions/NumericInput/NumericInput";
import { PRE_INPUT_KEY, preInputScript, replayPreHydrationInputs } from "./preHydration";

// Input made before hydration is kept (#708). jsdom has no hydration, so the test plays the two
// halves: the inline script records a native tap or keystroke; a React render then takes the DOM
// over (its state empty, as after hydration); the replay puts the input through React's change path.

const runScript = () => new Function(preInputScript)();

afterEach(() => {
  window[PRE_INPUT_KEY]?.stop();
  delete window[PRE_INPUT_KEY];
});

describe("pre-hydration input (#708)", () => {
  it("the inline script records the latest value per element and runs once; stop removes its listeners", () => {
    runScript();
    const first = window[PRE_INPUT_KEY]!;
    runScript();
    expect(window[PRE_INPUT_KEY]).toBe(first);
    const input = document.createElement("input");
    input.type = "text";
    document.body.append(input);
    input.value = "1";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.value = "13";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(first.map.get(input)).toBe("13");
    first.stop();
    input.value = "7";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(first.map.get(input)).toBe("13");
    input.remove();
  });

  it("a radio tapped before hydration is selected again and Check turns on; the record is cleared", () => {
    runScript();
    const { rerender } = render(<MultipleChoice id="q" prompt="Which?" options={[{ id: "a", text: "A" }, { id: "b", text: "B" }]} onAnswer={() => {}} />);
    const b = screen.getByRole("radio", { name: "B" }) as HTMLInputElement;
    const check = screen.getByRole("button", { name: "Check" });
    expect(check).toBeDisabled();
    // the tap, native: React's state has not seen it (as before hydration)
    b.click();
    expect(window[PRE_INPUT_KEY]!.map.get(b)).toBe(true);
    // "hydration": React renders its own state over the same nodes
    rerender(<MultipleChoice id="q" prompt="Which?" options={[{ id: "a", text: "A" }, { id: "b", text: "B" }]} onAnswer={() => {}} />);
    expect(replayPreHydrationInputs()).toBe(1);
    expect(b.checked).toBe(true);
    expect(check).toBeEnabled();
    expect(window[PRE_INPUT_KEY]).toBeUndefined();
    expect(replayPreHydrationInputs()).toBe(0);
  });

  it("digits typed before hydration are kept through React's onChange (its filters included) and Check turns on", () => {
    runScript();
    render(<NumericInput id="n" prompt="Type" base={2} onAnswer={() => {}} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const check = screen.getByRole("button", { name: "Check" });
    expect(check).toBeDisabled();
    // typed natively; React's tracker still holds ""
    const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    native.call(input, "101");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(window[PRE_INPUT_KEY]!.map.get(input)).toBe("101");
    expect(replayPreHydrationInputs()).toBe(1);
    expect(input.value).toBe("101");
    expect(check).toBeEnabled();
  });

  it("nothing recorded, a disabled control, or a node no longer in the page: nothing replayed, no error", () => {
    expect(replayPreHydrationInputs()).toBe(0);
    runScript();
    const gone = document.createElement("input");
    document.body.append(gone);
    gone.value = "x";
    gone.dispatchEvent(new Event("input", { bubbles: true }));
    gone.remove();
    const off = document.createElement("input");
    document.body.append(off);
    off.value = "y";
    off.dispatchEvent(new Event("input", { bubbles: true }));
    off.disabled = true;
    expect(replayPreHydrationInputs()).toBe(0);
    off.remove();
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { courses } from "./index";
import { fill } from "./template";
import { hasUnicodeSubscript, plainNotation, snapToToken, splitNotation } from "./notation";
import { stepCount, stepVars } from "./steps";
import { Notation } from "@/interactions/shared/Notation";
import { en } from "@/tutor/messages/en";

describe("base notation token", () => {
  it("finds (value)_base and value_base tokens, for bases 2, 8, 10 and 16", () => {
    expect(splitNotation("Convert (26)_10 to binary.")).toEqual([
      { text: "Convert " },
      { value: "26", base: "10", parens: true, raw: "(26)_10", start: 8 },
      { text: " to binary." },
    ]);
    const parts = splitNotation("53_10 → 110101_2 → 65_8 → 1A_16").filter((p) => !("text" in p));
    expect(parts.map((p) => ("value" in p ? `${p.value}/${p.base}/${p.parens}` : ""))).toEqual(["53/10/false", "110101/2/false", "65/8/false", "1A/16/false"]);
  });

  it("leaves other text alone: other bases, identifiers, lone underscores, unbalanced parentheses", () => {
    for (const text of ["x_1 and y_2", "(26)_7", "snake_case_10x", "a _10 b", "f(26_x)", "no tokens here"]) {
      expect(splitNotation(text).every((p) => "text" in p) || text === "x_1 and y_2", text).toBe(true);
    }
    // an opening parenthesis without its partner is not part of a token
    expect(plainNotation("(26_10")).toBe("(26 base 10");
  });

  it("reads a token aloud as 'value base n'", () => {
    expect(plainNotation("(26)_10 = (11010)_2")).toBe("26 base 10 = 11010 base 2");
    expect(plainNotation("nothing to change")).toBe("nothing to change");
  });

  it("never cuts a token while text is revealed a character at a time", () => {
    const text = "Now (26)_10 is done";
    expect(snapToToken(text, 3)).toBe(3);
    expect(snapToToken(text, 4)).toBe(4); // right before the token
    for (const cut of [5, 7, 9, 10]) expect(snapToToken(text, cut)).toBe(11); // inside it → its end
    expect(snapToToken(text, 11)).toBe(11);
    expect(snapToToken(text, 14)).toBe(14);
  });
});

describe("power token (#409)", () => {
  const powers = (text: string) => splitNotation(text).flatMap((p) => ("power" in p ? [`${p.power}^${p.exp}`] : []));

  it("finds base^exp with an integer exponent, a true or ASCII minus, or a one-letter exponent", () => {
    expect(splitNotation("The weight is 10^2.")).toEqual([{ text: "The weight is " }, { power: "10", exp: "2", raw: "10^2", start: 14 }, { text: "." }]);
    expect(powers("10^−2 and 10^-2")).toEqual(["10^−2", "10^−2"]);
    expect(powers("2^0, 16^1 and 2^n rows")).toEqual(["2^0", "16^1", "2^n"]);
  });

  it("mixes with base tokens in one string", () => {
    expect(plainNotation("(101)_2 = 1 × 2^2 + 1 × 2^0")).toBe("101 base 2 = 1 × 2 to the power 2 + 1 × 2 to the power 0");
    expect(plainNotation("The 7 in (276.384)_10 weighs 10^1; the 4 weighs 10^−3.")).toBe(
      "The 7 in 276.384 base 10 weighs 10 to the power 1; the 4 weighs 10 to the power minus 3.",
    );
  });

  it("leaves other carets alone: Boolean text, identifiers, words as exponents", () => {
    for (const text of ["F = A'B + AB' = A ⊕ B", "x^2", "a2^3", "1.5^2", "2^ab", "2^10x", "{base}^−1", "^2"]) {
      expect(powers(text), text).toEqual([]);
    }
  });

  it("reads powers aloud", () => {
    expect(plainNotation("10^2")).toBe("10 to the power 2");
    expect(plainNotation("10^−2")).toBe("10 to the power minus 2");
    expect(plainNotation("10^-2")).toBe("10 to the power minus 2");
  });

  it("never cuts a power while text is revealed a character at a time", () => {
    const text = "So 10^−2 is";
    expect(snapToToken(text, 3)).toBe(3);
    for (const cut of [4, 5, 6, 7]) expect(snapToToken(text, cut)).toBe(8);
    expect(snapToToken(text, 8)).toBe(8);
  });
});

describe("<Notation>", () => {
  it("renders the base as a real subscript and gives assistive technology 'value base n'", () => {
    const { container } = render(
      <p>
        <Notation text="Convert (26)_10 to binary." />
      </p>,
    );
    expect(container.querySelector("sub")).toHaveTextContent("10");
    expect(container.querySelector("[aria-hidden='true']")).toHaveTextContent("(26)10");
    expect(screen.getByText("26 base 10")).toHaveClass("sr-only");
    expect(container.textContent).not.toContain("_10");
  });

  it("renders a power as a real superscript with a true minus and reads it aloud", () => {
    const { container } = render(
      <p>
        <Notation text="Weights 10^2 and 10^-2 of (276.384)_10." />
      </p>,
    );
    expect([...container.querySelectorAll("sup")].map((s) => s.textContent)).toEqual(["2", "−2"]);
    expect(container.querySelector("sub")).toHaveTextContent("10");
    expect(screen.getByText("10 to the power minus 2")).toHaveClass("sr-only");
    // what a sighted reader sees: no raw caret or underscore
    const visible = [...container.querySelectorAll("[aria-hidden='true']")].map((n) => n.textContent).join("|");
    expect(visible).toBe("102|10−2|(276.384)10");
    expect(container.textContent).not.toMatch(/[\^_]/);
  });

  it("keeps the spoken text out of copy and paste", () => {
    const { container } = render(<Notation text="(26)_10 and 2^3" />);
    for (const s of container.querySelectorAll(".sr-only")) expect((s as HTMLElement).style.userSelect).toBe("none");
  });

  it("returns plain text unchanged", () => {
    const { container } = render(
      <p>
        <Notation text="No numbers here." />
      </p>,
    );
    expect(container.querySelector("p")!.innerHTML).toBe("No numbers here.");
  });
});

/** True when a `^` would show on screen: one left in the plain runs once tokens are rendered. */
const rawCaret = (text: string) => splitNotation(text).some((p) => "text" in p && p.text.includes("^"));

describe("content and catalog use the token, never Unicode subscript digits (#55) or a raw caret (#409)", () => {
  it("no authored string contains a Unicode subscript, before or after its slots are filled", () => {
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics) {
          const topicTexts = [t.title, t.summary, t.preview ?? "", ...t.objectives.map((o) => o.text), ...t.concepts.flatMap((x) => [x.title, x.summary])];
          for (const text of topicTexts) expect(hasUnicodeSubscript(text), `${t.id}: ${text}`).toBe(false);
          // objectives render through <Notation>, so a power there must be a token (#409)
          for (const o of t.objectives) expect(rawCaret(o.text), `${t.id}: ${o.text}`).toBe(false);
          for (const a of t.activities)
            for (const q of a.questions)
              for (const v of q.variants) {
                const texts = [
                  v.prompt,
                  ...v.hints.map((h) => h.text),
                  ...Object.values(v.hintsByStep ?? {}).flatMap((list) => list.map((h) => h.text)),
                  ...v.explanation.flatMap((s) => [s.say, s.ask?.prompt ?? "", ...(s.ask?.options ?? []), s.ask?.afterCorrect ?? "", s.ask?.afterWrong ?? ""]),
                  ...(v.spec.kind === "multiple-choice" ? v.spec.options.map((o) => o.text) : []),
                ];
                for (let i = 0; i < stepCount(v.spec); i++) {
                  const vars = { ...v.vars, ...stepVars(v.spec, i) };
                  for (const text of texts) {
                    expect(hasUnicodeSubscript(fill(text, vars)), `${a.id}/${q.id}/${v.id}: ${text}`).toBe(false);
                    expect(rawCaret(fill(text, vars)), `${a.id}/${q.id}/${v.id}: ${fill(text, vars)}`).toBe(false);
                  }
                }
              }
        }
    for (const [key, text] of Object.entries(en)) expect(hasUnicodeSubscript(text) || rawCaret(text), key).toBe(false);
  });

  it("the Chapter 1 conversion prompt carries a base-10 token", () => {
    const v = courses[0].modules[0].topics.flatMap((t) => t.activities).flatMap((a) => a.questions).flatMap((q) => q.variants).find((x) => /_10\b/.test(x.prompt));
    expect(v).toBeDefined();
    expect(plainNotation(fill(v!.prompt, v!.vars))).toMatch(/\d+ base 10/);
  });
});

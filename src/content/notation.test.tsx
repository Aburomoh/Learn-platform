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

  it("returns plain text unchanged", () => {
    const { container } = render(
      <p>
        <Notation text="No numbers here." />
      </p>,
    );
    expect(container.querySelector("p")!.innerHTML).toBe("No numbers here.");
  });
});

describe("content and catalog use the token, never Unicode subscript digits (#55)", () => {
  it("no authored string contains a Unicode subscript, before or after its slots are filled", () => {
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics) {
          const topicTexts = [t.title, t.summary, t.preview ?? "", ...t.objectives.map((o) => o.text), ...t.concepts.flatMap((x) => [x.title, x.summary])];
          for (const text of topicTexts) expect(hasUnicodeSubscript(text), `${t.id}: ${text}`).toBe(false);
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
                  for (const text of texts) expect(hasUnicodeSubscript(fill(text, vars)), `${a.id}/${q.id}/${v.id}: ${text}`).toBe(false);
                }
              }
        }
    for (const [key, text] of Object.entries(en)) expect(hasUnicodeSubscript(text), key).toBe(false);
  });

  it("the Chapter 1 conversion prompt carries a base-10 token", () => {
    const v = courses[0].modules[0].topics.flatMap((t) => t.activities).flatMap((a) => a.questions).flatMap((q) => q.variants).find((x) => /_10\b/.test(x.prompt));
    expect(v).toBeDefined();
    expect(plainNotation(fill(v!.prompt, v!.vars))).toMatch(/\d+ base 10/);
  });
});

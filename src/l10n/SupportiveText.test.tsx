import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { _setPrefs } from "@/learner/store";
import { TopBar } from "@/shell/r1/Chrome";
import { _resetArabic, _setArabicMap, SHARED } from "./arabic";
import { SupportiveText } from "./SupportiveText";

describe("SupportiveText (ADR-0011 §5)", () => {
  beforeEach(() => {
    _resetArabic();
    _setPrefs({ locale: "en" });
    _setArabicMap(SHARED, {
      "Look at {bits}. The sum is A + B.": "انظر إلى {bits}. المجموع هو A + B.",
      "Correct.": "صحيح.",
    });
    _setArabicMap("ecet111", { "So (26)_10 is {bits}_2.": "إذاً (26)_10 تساوي {bits}_2." });
  });

  it("with English on: the filled English, notation rendered, nothing marked rtl", () => {
    render(<SupportiveText template="So (26)_10 is {bits}_2." vars={{ bits: "11010" }} course="ecet111" />);
    expect(document.querySelector("[dir='rtl']")).toBeNull();
    expect(document.querySelector("[data-base='10']")).toHaveTextContent("(26)10");
    expect(document.body.textContent).toContain("11010");
  });

  it("with Arabic on: the Arabic template filled, dir and lang on the text element only, English runs in <bdi dir=ltr>", () => {
    _setPrefs({ locale: "ar" });
    const { container } = render(
      <p>
        <SupportiveText template="Look at {bits}. The sum is A + B." vars={{ bits: "0110" }} />
      </p>,
    );
    const ar = container.querySelector("[dir='rtl']")!;
    expect(ar.tagName).toBe("SPAN");
    expect(ar).toHaveAttribute("lang", "ar");
    expect(ar.textContent).toBe("انظر إلى 0110. المجموع هو A + B.");
    const runs = [...ar.querySelectorAll("bdi")].map((b) => [b.getAttribute("dir"), b.textContent]);
    expect(runs).toEqual([["ltr", "0110"], ["ltr", "A + B"]]);
    // the paragraph itself is not mirrored
    expect(container.querySelector("p")).not.toHaveAttribute("dir");
    // Western digits only, as authored
    expect(ar.textContent).not.toMatch(/[٠-٩]/);
  });

  it("notation inside an Arabic sentence keeps its subscript and reads as English", () => {
    _setPrefs({ locale: "ar" });
    render(<SupportiveText template="So (26)_10 is {bits}_2." vars={{ bits: "11010" }} course="ecet111" />);
    const ar = document.querySelector("[dir='rtl']")!;
    expect(ar.querySelector("bdi [data-base='10']")).toHaveTextContent("(26)10");
    expect(ar.querySelector("bdi [data-base='2']")).toHaveTextContent("110102");
  });

  it("a template with no Arabic falls back to the English, untouched and LTR", () => {
    _setPrefs({ locale: "ar" });
    render(<SupportiveText template="Written after the inventory: {n}." vars={{ n: 7 }} course="ecet111" />);
    expect(screen.getByText("Written after the inventory: 7.")).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeNull();
  });

  it("no layout mirroring: with Arabic on, nothing above the text level carries dir=rtl (top bar, page, question)", () => {
    _setPrefs({ locale: "ar" });
    render(
      <main>
        <TopBar />
        <section aria-label="Question">
          <p>What is 26 in binary?</p>
        </section>
        <p>
          <SupportiveText template="Correct." inline />
        </p>
      </main>,
    );
    const rtl = [...document.querySelectorAll("[dir='rtl']")];
    expect(rtl.length).toBe(1);
    for (const el of rtl) {
      expect(el.tagName).toBe("SPAN");
      // only text and <bdi> runs inside, never a layout element
      expect([...el.children].every((c) => c.tagName === "BDI")).toBe(true);
    }
    expect(document.documentElement).not.toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("banner")).not.toHaveAttribute("dir");
    expect(screen.getByRole("region", { name: "Question" })).not.toHaveAttribute("dir");
  });
});

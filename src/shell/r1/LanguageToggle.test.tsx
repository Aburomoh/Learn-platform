import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { flushPendingWrites, PREFS_KEY } from "@/learner";
import { _setPrefs } from "@/learner/store";
import { _resetArabic, _setArabicMap, SHARED } from "@/l10n/arabic";
import { SupportiveText } from "@/l10n/SupportiveText";
import { LanguageToggle } from "./LanguageToggle";

describe("EN | عربي (ADR-0011 §4)", () => {
  beforeEach(() => {
    _resetArabic();
    _setPrefs({ locale: "en" });
    _setArabicMap(SHARED, { "Give it a try.": "جرّب بنفسك." });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("two text buttons in a labelled group, the active one pressed; the Arabic label is lang=ar", () => {
    render(<LanguageToggle />);
    const group = screen.getByRole("group", { name: "Language" });
    const en = screen.getByRole("button", { name: "EN" });
    const ar = screen.getByRole("button", { name: "عربي" });
    expect(group).toContainElement(en);
    expect(en).toHaveAttribute("aria-pressed", "true");
    expect(ar).toHaveAttribute("aria-pressed", "false");
    expect(ar).toHaveAttribute("lang", "ar");
    expect(en.textContent).toBe("EN");
  });

  it("applies at once to supportive text on the page, and persists in the prefs record", async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageToggle />
        <p>
          <SupportiveText template="Give it a try." />
        </p>
      </>,
    );
    expect(screen.getByText("Give it a try.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "عربي" }));
    expect(screen.getByRole("button", { name: "عربي" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("جرّب بنفسك.")).toBeInTheDocument();
    expect(screen.queryByText("Give it a try.")).toBeNull();
    flushPendingWrites();
    expect(JSON.parse(window.localStorage.getItem(PREFS_KEY)!).locale).toBe("ar");
    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByText("Give it a try.")).toBeInTheDocument();
    flushPendingWrites();
    expect(JSON.parse(window.localStorage.getItem(PREFS_KEY)!).locale).toBe("en");
  });
});

import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationLine, chapterShort } from "./LocationLine";

const segments = [
  { label: "ECET 111", href: "/courses/ecet111/" },
  { label: "Chapter 1", href: "/courses/ecet111/#chapter-ch1" },
  { label: "Binary arithmetic", href: "/courses/ecet111/binary-arithmetic/" },
  { label: "Subtraction by 2's complement" },
];

describe("LocationLine (epic #670, #674)", () => {
  it("is a 'You are here' list: every level a link, the current place plain text with aria-current", () => {
    render(<LocationLine segments={segments} />);
    const nav = screen.getByRole("navigation", { name: "You are here" });
    const links = within(nav).getAllByRole("link");
    // next/link normalises the trailing slash in tests; the path and hash are what matter
    expect(links.map((l) => [l.textContent, l.getAttribute("href")!.replace(/\/(?=#|$)/, "")])).toEqual([
      ["ECET 111", "/courses/ecet111"],
      ["Chapter 1", "/courses/ecet111#chapter-ch1"],
      ["Binary arithmetic", "/courses/ecet111/binary-arithmetic"],
    ]);
    expect(within(nav).getByText("Subtraction by 2's complement")).toHaveAttribute("aria-current", "page");
    expect(nav).toHaveTextContent("ECET 111 · Chapter 1 · Binary arithmetic · Subtraction by 2's complement");
  });

  it("marks all but the two nearest segments as collapsed (phones hide them) until the … button opens the whole path", async () => {
    render(<LocationLine segments={segments} />);
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.hasAttribute("data-collapsed"))).toEqual([false, true, true, false, false]);
    const more = screen.getByRole("button", { name: "Show the whole path" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await userEvent.setup().click(more);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("listitem").every((li) => !li.hasAttribute("data-collapsed"))).toBe(true);
  });

  it("two segments or fewer: nothing collapses and there is no button", () => {
    render(<LocationLine segments={segments.slice(0, 2)} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shortens a chapter title to its number", () => {
    expect(chapterShort("Chapter 2 · Boolean Algebra and Logic Gates")).toBe("Chapter 2");
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getTopic } from "@/content";
import { ChallengeSteps, PageHeading, PreviewBoard, PrimaryAction, effortCue, parsePreview, stepsFrom } from "./index";

describe("PageHeading", () => {
  it("renders where, what and the route line, with one h1", () => {
    render(<PageHeading eyebrow="ECET 111 · Chapter 1" title="Number-base conversions" route="Today: Decimal → Binary → Octal → Hex" />);
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Number-base conversions");
    expect(screen.getByText("ECET 111 · Chapter 1")).toBeInTheDocument();
    expect(screen.getByText(/Today:/)).toBeInTheDocument();
  });

  it("omits the eyebrow and route when not given", () => {
    const { container } = render(<PageHeading title="Settings" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("PrimaryAction", () => {
  it("is one real link for the button, plus an optional quiet secondary and the effort cue", () => {
    render(<PrimaryAction primary={{ label: "Next topic", href: "/courses/ecet111/logic-gates/" }} secondary={{ label: "Review", href: "/x/?review=1" }} effort={effortCue(4, 10)} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Next topic", "Review"]);
    // next/link normalises the trailing slash per runtime config
    expect(links[0].getAttribute("href")).toMatch(/^\/courses\/ecet111\/logic-gates\/?$/);
    expect(document.querySelectorAll("[data-primary-action]")).toHaveLength(1);
    expect(screen.getByText("4 short challenges · about 10 min")).toBeInTheDocument();
  });

  it("words the effort cue with 'about', and handles one challenge", () => {
    expect(effortCue(1, 5)).toBe("1 short challenge · about 5 min");
    expect(effortCue(4, 10)).toContain("about 10 min");
  });
});

describe("ChallengeSteps", () => {
  const questions = [
    { id: "a", label: "Divide" },
    { id: "b", label: "Read off" },
    { id: "c", label: "Octal" },
    { id: "d" },
  ];

  it("derives done, current and not started from the finished challenges", () => {
    expect(stepsFrom(questions, ["a"]).map((s) => s.state)).toEqual(["done", "current", "todo", "todo"]);
    expect(stepsFrom(questions, []).map((s) => s.state)).toEqual(["current", "todo", "todo", "todo"]);
    expect(stepsFrom(questions, [], false).map((s) => s.state)).toEqual(["todo", "todo", "todo", "todo"]);
    expect(stepsFrom(questions, ["a", "b", "c", "d"]).every((s) => s.state === "done")).toBe(true);
    expect(stepsFrom(questions, [])[3].label).toBe("Challenge 4");
  });

  it("gives every state text as well as a shape, and marks the current step", () => {
    render(<ChallengeSteps steps={stepsFrom(questions, ["a"])} />);
    const items = screen.getAllByRole("listitem");
    expect(screen.getByRole("list", { name: "Challenges" })).toBeInTheDocument();
    expect(items.map((i) => i.textContent)).toEqual(["Divide — done", "Read off — current", "Octal — not started", "Challenge 4 — not started"]);
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items.filter((i) => i.hasAttribute("aria-current"))).toHaveLength(1);
  });
});

describe("PreviewBoard", () => {
  it("parses a chain with base subscripts into tiles", () => {
    expect(parsePreview("53₁₀ → 110101₂ → 65₈ → 35₁₆")).toEqual([
      { value: "53", base: "10" },
      { value: "110101", base: "2" },
      { value: "65", base: "8" },
      { value: "35", base: "16" },
    ]);
    expect(parsePreview("A → B")).toEqual([{ value: "A" }, { value: "B" }]);
  });

  it("is one image read out in words, with bases as <sub> markup", () => {
    render(<PreviewBoard preview="53₁₀ → 110101₂" />);
    const img = screen.getByRole("img", { name: "53 base 10, then 110101 base 2" });
    expect(img.querySelectorAll("sub")).toHaveLength(2);
    expect(img.textContent).not.toMatch(/[₀-₉]/);
  });

  it("renders the preview authored for the Chapter 1 topic, which never reuses the practice's numbers", () => {
    const topic = getTopic("ecet111", "number-systems")!.topic;
    expect(topic.preview).toBeDefined();
    const values = parsePreview(topic.preview!).map((t) => t.value);
    expect(values.length).toBeGreaterThanOrEqual(3);
    for (const used of ["26", "37", "88", "73"]) expect(values).not.toContain(used);
  });

  it("can render the tiles alone, for a topic row", () => {
    const { container } = render(<PreviewBoard preview="53₁₀ → 35₁₆" size="sm" bare />);
    expect(screen.getByRole("img", { name: "53 base 10, then 35 base 16" })).toBeInTheDocument();
    expect(container.querySelectorAll("sub")).toHaveLength(2);
  });
});

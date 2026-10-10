import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { courses } from "@/content";
import { cpet181 } from "@/content/cpet181";
import { CourseOutline } from "./CourseOutline";
import { HomeNext } from "./HomeNext";

describe("CPET181 outline", () => {
  it("lists nine chapters, each Not started and Coming soon", () => {
    render(<CourseOutline outline={cpet181} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(9);
    expect(screen.getAllByText("Not started · Coming soon")).toHaveLength(9);
    expect(screen.getByRole("heading", { name: /Chapter 9:\s*Networks and security/ })).toBeTruthy();
  });

  it("is registered as a course now (#562): chapter 1 has topics, the other eight are coming soon", () => {
    const c = courses.find((x) => x.id === "cpet181")!;
    expect(c.modules).toHaveLength(9);
    expect(c.modules[0].topics.length).toBeGreaterThan(0);
    expect(c.modules.slice(1).every((m) => m.comingSoon === true && m.topics.length === 0)).toBe(true);
  });

  it("shows as a second course on Home, next to ECET 111", async () => {
    render(<HomeNext courses={courses} />);
    expect(await screen.findByRole("link", { name: /Open course: Computer Operating Systems Basics/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open course: Introduction to Digital System Design I/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Your courses" })).toBeTruthy();
  });
});

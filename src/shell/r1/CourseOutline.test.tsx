import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { courses, outlines, getOutline } from "@/content";
import { CourseOutline } from "./CourseOutline";
import { HomeNext } from "./HomeNext";

const cpet181 = getOutline("cpet181")!;

describe("CPET181 outline", () => {
  it("lists nine chapters, each Not started and Coming soon", () => {
    render(<CourseOutline outline={cpet181} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(9);
    expect(screen.getAllByText("Not started · Coming soon")).toHaveLength(9);
    expect(screen.getByRole("heading", { name: /Chapter 9:\s*Networks and security/ })).toBeTruthy();
  });

  it("stays out of the learning registry", () => {
    expect(courses.some((c) => c.id === "cpet181")).toBe(false);
  });

  it("shows as a second course on Home, next to ECET 111", async () => {
    render(<HomeNext courses={courses} outlines={outlines} />);
    expect(await screen.findByRole("link", { name: /View chapters: Computer Operating Systems Basics/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open course: Introduction to Digital System Design I/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Your courses" })).toBeTruthy();
  });
});

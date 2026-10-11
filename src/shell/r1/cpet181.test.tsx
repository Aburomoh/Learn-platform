import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { courses } from "@/content";
import { HomeNext } from "./HomeNext";

describe("CPET181 as a registered course (#562)", () => {
  it("is registered as a course now (#562): chapters 1, 2 and 4 have topics, the other six are coming soon", () => {
    const c = courses.find((x) => x.id === "cpet181")!;
    expect(c.modules).toHaveLength(9);
    const live = [0, 1, 3];
    expect(c.modules.filter((_, i) => live.includes(i)).every((m) => m.topics.length > 0 && m.comingSoon === undefined)).toBe(true);
    expect(c.modules.filter((_, i) => !live.includes(i)).every((m) => m.comingSoon === true && m.topics.length === 0)).toBe(true);
  });

  it("shows as a second course on Home, next to ECET 111", async () => {
    render(<HomeNext courses={courses} />);
    expect(await screen.findByRole("link", { name: /Open course: Computer Operating Systems Basics/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open course: Introduction to Digital System Design I/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Your courses" })).toBeTruthy();
  });
});

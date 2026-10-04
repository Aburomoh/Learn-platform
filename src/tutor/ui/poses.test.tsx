import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { product } from "../../../config/product";
import { EXPRESSIONS } from "../engine/actions";
import { poseSrc, stageCrops, type PoseKey } from "./poses";
import { TutorAvatar } from "./TutorAvatar";

const table = product.brand.tutorPortrait!;
const KEYS: PoseKey[] = [...EXPRESSIONS, "welcome"];
const file = (src: string) => join(process.cwd(), "public", src);

describe("tutor pose table (#354)", () => {
  it("maps every expression, and welcome, to a pose", () => {
    expect(table).not.toBeNull();
    for (const key of KEYS) expect(table.poses[key], key).toBeTruthy();
    expect(table.poses.curious).toBe("focus");
    expect(table.poses.concern).toBe("try_again");
    expect(table.poses.pleased).toBe("correct");
  });

  it("points every pose at committed files within the size budget", () => {
    for (const key of KEYS) {
      const crop = file(poseSrc(table, key));
      const waist = file(poseSrc(table, key, "waist"));
      expect(existsSync(crop), crop).toBe(true);
      expect(existsSync(waist), waist).toBe(true);
      expect(statSync(crop).size).toBeLessThanOrEqual(15_000);
      expect(statSync(waist).size).toBeLessThanOrEqual(45_000);
    }
  });

  it("prefetches each stage crop once, never the welcome pose", () => {
    const crops = stageCrops(table);
    expect(new Set(crops).size).toBe(crops.length);
    expect(crops).not.toContain(poseSrc(table, "welcome"));
  });
});

describe("TutorAvatar with pose art", () => {
  it("shows the crop for the current expression, labelled with the expression", () => {
    for (const e of EXPRESSIONS) {
      const { unmount } = render(<TutorAvatar expression={e} name="Dr. Demo" portrait={table} />);
      const img = screen.getByRole("img", { name: /^Dr\. Demo, / });
      expect(img).toHaveAttribute("src", poseSrc(table, e));
      expect(img).toHaveAttribute("width", "168");
      unmount();
    }
  });

  it("swaps the pose when the expression changes, and falls back to the monogram if a file fails", () => {
    const { rerender } = render(<TutorAvatar expression="neutral" name="Dr. Demo" portrait={table} />);
    rerender(<TutorAvatar expression="pleased" name="Dr. Demo" portrait={table} />);
    expect(screen.getByRole("img", { name: "Dr. Demo, pleased" })).toHaveAttribute("src", "/tutor/correct.webp");
    act(() => {
      screen.getByRole("img", { name: "Dr. Demo, pleased" }).dispatchEvent(new Event("error"));
    });
    expect(screen.getByRole("img", { name: "Dr. Demo, pleased" })).toHaveTextContent("DD");
  });
});

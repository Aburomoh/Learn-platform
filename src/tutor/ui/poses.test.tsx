import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { product } from "../../../config/product";
import { EXPRESSIONS } from "../engine/actions";
import { COLUMN_MEDIA, poseFor, poseSrc, type PoseKey } from "./poses";
import { TutorAvatar } from "./TutorAvatar";
import { TutorPanel } from "./TutorPanel";
import { TutorPosePreload, STRIP_MEDIA } from "./TutorPosePreload";

const table = product.brand.tutorPortrait!;
const KEYS: PoseKey[] = [...EXPRESSIONS, "welcome"];
const file = (src: string) => join(process.cwd(), "public", src);
const WAIST = /-waist\.webp$/;

/** The `<picture>` for the current pose: its column source and its fallback (head crop) image. */
function picture(name: RegExp | string) {
  const img = screen.getByRole("img", { name });
  const source = img.parentElement!.querySelector("source")!;
  return { img, source };
}

describe("tutor pose table (#354, DESIGN_SYSTEM.md Tutor area)", () => {
  it("maps every expression, and welcome, to a pose", () => {
    expect(table).not.toBeNull();
    for (const key of KEYS) expect(table.poses[key], key).toBeTruthy();
    expect(table.poses.curious).toBe("curious"); // predict-first prompts (#378)
    expect(table.poses.concern).toBe("try_again");
    expect(table.poses.pleased).toBe("correct");
  });

  it("points toward the stage only where the tutor has its column; attention keeps its own pose", () => {
    expect(poseFor(table, "pointing", "column")).toBe("point_left");
    expect(poseFor(table, "pointing", "compact")).toBe("explaining");
    for (const place of ["column", "compact"] as const) {
      expect(poseFor(table, "attention-left", place)).toBe("point_left");
      expect(poseFor(table, "attention-right", place)).toBe("point_right");
    }
    // every other key is the same at both places
    for (const key of KEYS.filter((k) => k !== "pointing")) expect(poseFor(table, key, "compact"), key).toBe(poseFor(table, key, "column"));
  });

  it("uses the waist-up file in the column and the head crop when compact", () => {
    expect(poseSrc(table, "pleased", "column")).toBe("/tutor/correct-waist.webp");
    expect(poseSrc(table, "pleased", "compact")).toBe("/tutor/correct.webp");
    expect(poseSrc(table, "pointing", "column")).toBe("/tutor/point_left-waist.webp");
    expect(poseSrc(table, "pointing", "compact")).toBe("/tutor/explaining.webp");
  });

  it("points every pose at committed files within the size budget", () => {
    for (const key of KEYS) {
      const crop = file(poseSrc(table, key, "compact"));
      const waist = file(poseSrc(table, key, "column"));
      expect(existsSync(crop), crop).toBe(true);
      expect(existsSync(waist), waist).toBe(true);
      expect(statSync(crop).size).toBeLessThanOrEqual(15_000);
      expect(statSync(waist).size).toBeLessThanOrEqual(45_000);
    }
  });
});

describe("TutorAvatar with pose art", () => {
  it("offers the waist-up pose from 1200 px and the head crop below, labelled with the expression", () => {
    for (const e of EXPRESSIONS) {
      const { unmount } = render(<TutorAvatar expression={e} name="Dr. Demo" portrait={table} />);
      const { img, source } = picture(/^Dr\. Demo, /);
      expect(source).toHaveAttribute("media", COLUMN_MEDIA.stage);
      expect(source).toHaveAttribute("srcset", poseSrc(table, e, "column"));
      // the <img> src is what phones and the strip fetch: never a waist-up file
      expect(img).toHaveAttribute("src", poseSrc(table, e, "compact"));
      expect(img.getAttribute("src")).not.toMatch(WAIST);
      unmount();
    }
  });

  it("maps pointing per breakpoint: point_left beside the stage, explaining in the strip", () => {
    render(<TutorAvatar expression="pointing" name="Dr. Demo" portrait={table} />);
    const { img, source } = picture("Dr. Demo, pointing");
    expect(source).toHaveAttribute("srcset", "/tutor/point_left-waist.webp");
    expect(img).toHaveAttribute("src", "/tutor/explaining.webp");
  });

  it("keeps the old pose until the new one loads, then crossfades; falls back to the monogram if a file fails", () => {
    const { rerender, container } = render(<TutorAvatar expression="neutral" name="Dr. Demo" portrait={table} />);
    rerender(<TutorAvatar expression="pleased" name="Dr. Demo" portrait={table} />);
    const next = screen.getByRole("img", { name: "Dr. Demo, pleased" });
    expect(next).toHaveAttribute("src", "/tutor/correct.webp");
    // the neutral pose stays (decorative) underneath while the new one loads
    expect(container.querySelectorAll("img")).toHaveLength(2);
    const pending = next.closest("span")!.className;
    act(() => {
      next.dispatchEvent(new Event("load"));
    });
    // loaded: the new pose switches from hidden (pending) to fading in
    expect(next.closest("span")!.className).not.toBe(pending);
    act(() => {
      next.dispatchEvent(new Event("error"));
    });
    expect(screen.getByRole("img", { name: "Dr. Demo, pleased" })).toHaveTextContent("DD");
  });
});

describe("TutorPanel", () => {
  it("renders one avatar, so the strip and the column never both fetch", () => {
    render(<TutorPanel name="Dr. Demo" expression="pointing" message="" />);
    const imgs = document.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute("src")).not.toMatch(WAIST);
    // waist-up files appear only in a media-conditioned <source>
    for (const source of document.querySelectorAll("source")) expect(source).toHaveAttribute("media", COLUMN_MEDIA.stage);
  });
});

describe("TutorPosePreload", () => {
  it("preloads only neutral, at the size each layout uses", () => {
    const html = renderToStaticMarkup(<TutorPosePreload portrait={table} />);
    const links = [...html.matchAll(/<link [^>]*>/g)].map((m) => m[0]);
    expect(links).toHaveLength(2);
    expect(links[0]).toContain('href="/tutor/neutral-waist.webp"');
    expect(links[0]).toContain(`media="${COLUMN_MEDIA.stage}"`);
    expect(links[1]).toContain('href="/tutor/neutral.webp"');
    expect(links[1]).toContain(`media="${STRIP_MEDIA}"`);
    expect(renderToStaticMarkup(<TutorPosePreload portrait={null} />)).toBe("");
  });
});

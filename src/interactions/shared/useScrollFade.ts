"use client";

import { useEffect, useState, type RefObject } from "react";

export type ScrollFade = "none" | "start" | "end" | "both";

/**
 * Which edge(s) of a sideways-scrolling box hide content: "end" = more to the right, "start" =
 * more to the left. Put the value in `data-fade` and fade that edge so scrolling is discoverable.
 */
export function useScrollFade(ref: RefObject<HTMLElement | null>): ScrollFade {
  const [fade, setFade] = useState<ScrollFade>("none");
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const update = () => {
      const max = box.scrollWidth - box.clientWidth;
      setFade(max <= 1 ? "none" : box.scrollLeft <= 1 ? "end" : box.scrollLeft >= max - 1 ? "start" : "both");
    };
    update();
    box.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(box);
    return () => {
      box.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [ref]);
  return fade;
}

"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { TutorAction } from "../engine/actions";
import { FOCUS_ATTR } from "@/interactions/shared/types";

export const FOCUS_CLASS = "tutor-focus";
export const HIGHLIGHT_CLASS = "tutor-highlight";
export const PULSE_CLASS = "tutor-pulse";

/**
 * Applies FOCUS / HIGHLIGHT / PULSE actions to elements carrying data-focus-target inside
 * `container`. Only one focus and one highlight are active at a time; RESET_INTERACTION,
 * ADVANCE_EXPLANATION and COMPLETE clear both. Pulse is a short CSS animation (no-op under
 * reduced motion via the stylesheet).
 */
export function useFocusEffects(container: RefObject<HTMLElement | null>) {
  const current = useRef<{ focus?: Element; highlight?: Element }>({});

  const clear = useCallback(() => {
    current.current.focus?.classList.remove(FOCUS_CLASS);
    current.current.highlight?.classList.remove(HIGHLIGHT_CLASS, PULSE_CLASS);
    current.current = {};
  }, []);

  const find = useCallback(
    (target: string) => container.current?.querySelector(`[${FOCUS_ATTR}="${CSS.escape(target)}"]`) ?? null,
    [container],
  );

  const apply = useCallback(
    (action: TutorAction) => {
      switch (action.type) {
        case "FOCUS": {
          const el = find(action.target);
          current.current.focus?.classList.remove(FOCUS_CLASS);
          current.current.focus = el ?? undefined;
          el?.classList.add(FOCUS_CLASS);
          el?.scrollIntoView?.({ block: "nearest", behavior: "auto" });
          break;
        }
        case "HIGHLIGHT": {
          const el = find(action.target);
          current.current.highlight?.classList.remove(HIGHLIGHT_CLASS, PULSE_CLASS);
          current.current.highlight = el ?? undefined;
          el?.classList.add(HIGHLIGHT_CLASS);
          break;
        }
        case "PULSE": {
          const el = find(action.target);
          if (!el) break;
          el.classList.remove(PULSE_CLASS);
          // restart the animation if it is already running
          void (el as HTMLElement).offsetWidth;
          el.classList.add(PULSE_CLASS);
          break;
        }
        case "RESET_INTERACTION":
        case "ADVANCE_EXPLANATION":
        case "COMPLETE":
          clear();
          break;
      }
    },
    [clear, find],
  );

  useEffect(() => clear, [clear]);

  return { apply, clear };
}

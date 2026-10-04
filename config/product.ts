import type { TutorPoseTable } from "../src/tutor/ui/poses";

/**
 * The tutor's pose art (#354), one pose per expression. `pointing` uses `point_left`: the stage sits
 * to the viewer's left of the tutor column at `lg` (below `lg` the strip sits above the stage).
 */
const tutorPoses: TutorPoseTable = {
  dir: "/tutor",
  poses: {
    neutral: "neutral",
    explaining: "explaining",
    thinking: "thinking",
    curious: "focus",
    encouraging: "encouraging",
    concern: "try_again",
    pleased: "correct",
    pointing: "point_left",
    "attention-left": "point_left",
    "attention-right": "point_right",
    welcome: "welcome",
  },
};

/**
 * Product identity. The only place where naming, domain and owner display text live.
 * Application logic must not hard-code any of these values.
 */
export const product = {
  name: "CET Learn",
  tagline: "Interactive course companion",
  /** Public origin for metadata; change here when the domain moves. */
  origin: "https://learn.aburomoh.com",
  owner: { displayName: "Dr. Mohannad Abu-Romoh", shortName: "Dr. Mohannad" },
  brand: {
    /** The mark beside the name in the top bar (a file under /public). */
    markSrc: "/brand/mark.svg",
    /** Tutor pose table (files under /public/tutor); null shows the monogram disc (courses without art). */
    tutorPortrait: tutorPoses as TutorPoseTable | null,
  },
  defaultLocale: "en" as const,
  supportedLocales: ["en", "ar"] as const,
  /** Namespace for browser storage keys (ADR-0005). */
  storagePrefix: "cet-learn:v1",
} as const;

export type Locale = (typeof product.supportedLocales)[number];

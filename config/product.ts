import type { TutorPoseTable } from "../src/tutor/ui/poses";

/**
 * The tutor's pose art (#354), one pose per expression (DESIGN_SYSTEM.md, Tutor area). `pointing` uses
 * `point_left` in the column (the stage is to the viewer's left from 1200 px) and `explaining` in the
 * compact strip, which sits above the stage.
 */
const tutorPoses: TutorPoseTable = {
  dir: "/tutor",
  poses: {
    neutral: "neutral",
    explaining: "explaining",
    thinking: "thinking",
    curious: "curious",
    encouraging: "encouraging",
    concern: "try_again",
    pleased: "correct",
    pointing: "point_left",
    "attention-left": "point_left",
    "attention-right": "point_right",
    welcome: "welcome",
  },
  compact: { pointing: "explaining" },
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
    /**
     * The owner's logo (#591, guide in the handoff): the horizontal lockup for the light header from
     * 640 px, the icon mark beside the text name on phones and in dark mode (no approved dark lockup yet).
     * Sized exports from scripts/brand-assets.py; 1x and 2x of the rendered height.
     */
    logo: { lockup: "/brand/cet-learn-horizontal-48.webp", lockup2x: "/brand/cet-learn-horizontal-96.webp", icon: "/brand/cet-learn-icon-48.webp", icon2x: "/brand/cet-learn-icon-96.webp" },
    /** Tutor pose table (files under /public/tutor); null shows the monogram disc (courses without art). */
    tutorPortrait: tutorPoses as TutorPoseTable | null,
  },
  defaultLocale: "en" as const,
  supportedLocales: ["en", "ar"] as const,
  /** Namespace for browser storage keys (ADR-0005). */
  storagePrefix: "cet-learn:v1",
} as const;

export type Locale = (typeof product.supportedLocales)[number];

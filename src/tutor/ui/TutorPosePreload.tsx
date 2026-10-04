import { COLUMN_MEDIA, poseSrc, type TutorPoseTable } from "./poses";

/** The compact strip: everything below the stage column (matches the `max-width: 1199px` CSS). */
export const STRIP_MEDIA = "(max-width: 1199px)";

/**
 * Activity pages (DESIGN_SYSTEM.md, Tutor area): preloads the neutral pose at the size the layout
 * uses, the waist-up file beside the stage, the head crop in the strip. Each `<link>` carries a media
 * query, so the browser fetches only the matching one. Other poses are fetched only when shown.
 * React hoists these links into `<head>`.
 */
export function TutorPosePreload({ portrait }: { portrait: TutorPoseTable | null }) {
  if (!portrait) return null;
  return (
    <>
      <link rel="preload" as="image" href={poseSrc(portrait, "neutral", "column")} media={COLUMN_MEDIA.stage} fetchPriority="low" />
      <link rel="preload" as="image" href={poseSrc(portrait, "neutral", "compact")} media={STRIP_MEDIA} fetchPriority="low" />
    </>
  );
}

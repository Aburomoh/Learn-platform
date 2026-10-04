import { COLUMN_MEDIA, poseSrc, type PoseKey, type TutorPoseTable } from "./poses";

export interface PosePictureProps {
  portrait: TutorPoseTable;
  pose: PoseKey;
  /** Which column rule applies: beside the stage (1200 px) or rails and the home card (900 px). */
  column: keyof typeof COLUMN_MEDIA;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * One pose as a `<picture>`: the waist-up file when the media query for the tutor column matches,
 * else the head crop. The browser fetches only the source it selects, so phones never download a
 * waist-up file (a `display: none` `<img>` would still be fetched).
 */
export function PosePicture({ portrait, pose, column, alt, className, onLoad, onError }: PosePictureProps) {
  return (
    <picture>
      <source media={COLUMN_MEDIA[column]} srcSet={poseSrc(portrait, pose, "column")} width={168} height={224} />
      <img
        src={poseSrc(portrait, pose, "compact")}
        alt={alt}
        width={168}
        height={168}
        decoding="async"
        className={className}
        data-pose={pose}
        onLoad={onLoad}
        onError={onError}
      />
    </picture>
  );
}

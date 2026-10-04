"use client";

import { useEffect } from "react";
import { preload } from "react-dom";
import { poseSrc, stageCrops, type TutorPoseTable } from "./poses";

/**
 * Pose loading on activity pages (#354): the neutral crop is preloaded with the page; once the
 * browser is idle (`idle`, as for kind prefetch) the other stage poses are fetched into the cache,
 * so a pose change does not wait on the network. Renders nothing.
 */
export function TutorPosePrefetch({ portrait, idle }: { portrait: TutorPoseTable | null; idle: boolean }) {
  if (portrait) preload(poseSrc(portrait, "neutral"), { as: "image", fetchPriority: "low" });
  useEffect(() => {
    if (!portrait || !idle) return;
    for (const src of stageCrops(portrait)) new Image().src = src;
  }, [portrait, idle]);
  return null;
}

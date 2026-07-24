"use client";
import { useState } from "react";
import { getUpgradeMedia } from "@/lib/Upgrademedia";

/**
 * Small badge image for an already-owned upgrade chip
 * (e.g. "🎨 Fresh Paint Job" in the property modal).
 * Falls back to the emoji if /public/upgrades/icons/<id>.png doesn't exist.
 */
export function UpgradeIcon({
  upgradeId,
  className = "w-4 h-4 rounded-sm object-cover inline-block align-[-2px] mr-1",
}: {
  upgradeId: string;
  className?: string;
}) {
  const media = getUpgradeMedia(upgradeId);
  const [failed, setFailed] = useState(false);

  if (failed) return <span>{media.emoji}</span>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.iconSrc}
      alt=""
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

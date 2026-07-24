"use client";
import { useState } from "react";
import { getUpgradeMedia } from "@/lib/Upgrademedia";

/**
 * Looping video shown at the top of the "next upgrade" panel inside the
 * property modal — mirrors PropertyMediaHeader.tsx, one tier down.
 * Falls back to the emoji if /public/upgrades/videos/<id>.mp4 doesn't exist.
 */
export function UpgradeMediaHeader({
  upgradeId,
  heightClass = "h-24",
}: {
  upgradeId: string;
  heightClass?: string;
}) {
  const media = getUpgradeMedia(upgradeId);
  const [videoFailed, setVideoFailed] = useState(false);

  if (videoFailed) {
    return (
      <div
        className={`w-full ${heightClass} flex items-center justify-center text-4xl mb-2 rounded-xl bg-black/20`}
      >
        {media.emoji}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} rounded-xl overflow-hidden mb-2`}
    >
      <video
        key={media.videoSrc}
        src={media.videoSrc}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setVideoFailed(true)}
        className="w-full h-full object-cover block"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
}

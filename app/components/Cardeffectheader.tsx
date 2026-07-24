"use client";
import { useState } from "react";
import {
  getCardEffectMedia,
  type CardEffectVariant,
} from "@/lib/Cardeffectmedia";

/**
 * Looping video shown at the top of the life-event / gamble result modal
 * in Gameboard.tsx — replaces the plain `<div className="text-5xl">💸</div>`
 * emoji block with real motion when the clip exists, and falls back to that
 * exact same emoji if /public/effects/videos/<variant>.mp4 is missing.
 */
export function CardEffectHeader({
  variant,
  heightClass = "h-28",
}: {
  variant: CardEffectVariant;
  heightClass?: string;
}) {
  const media = getCardEffectMedia(variant);
  const [videoFailed, setVideoFailed] = useState(false);

  if (videoFailed) {
    return (
      <div
        className={`w-full ${heightClass} flex items-center justify-center text-5xl mb-2`}
      >
        {media.emoji}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden mb-2`}
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
    </div>
  );
}

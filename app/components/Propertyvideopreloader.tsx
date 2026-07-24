"use client";

import { useEffect } from "react";
import { PROPERTIES } from "@/lib/Properties";
import { getPropertyMedia } from "@/lib/Propertymedia";
import { PROPERTY_UPGRADES } from "@/lib/PropertyUpgrades";
import { getUpgradeMedia } from "@/lib/Upgrademedia";
import {
  getCardEffectMedia,
  type CardEffectVariant,
} from "@/lib/Cardeffectmedia";

// Every card-effect variant, deduped by getCardEffectMedia — since the loss
// variants now share one file, this naturally only preloads it once instead
// of fetching the same clip three times.
const CARD_EFFECT_VARIANTS: CardEffectVariant[] = [
  "life-gain",
  "life-loss",
  "gamble-wipeout",
  "gamble-jackpot",
  "gamble-gain",
  "gamble-loss",
];

/**
 * Drop this in once, near the top of Gameboard.tsx (or WaitingRoom.tsx, if
 * you want the head start to begin even earlier --- while players are still
 * waiting for the game to start).
 *
 * It renders nothing. On mount it creates a hidden, muted <video preload=
 * "auto"> for every property clip, every upgrade clip, and every card-effect
 * clip (life events + Gamble stack) so the browser fetches and buffers each
 * file into cache in the background. By the time an actual <video> tag
 * (PropertyIcon / PropertyMediaHeader / UpgradeMediaHeader / CardEffectHeader
 * / UnoCard) wants to show that same src, the browser serves it from cache
 * instead of starting a fresh network fetch --- which is what was causing
 * the delay before it appeared.
 *
 * If an asset doesn't exist yet (still on the emoji fallback), the hidden
 * <video> just 404s quietly --- same as the visible ones already handle it
 * via onError.
 */
export function PropertyVideoPreloader() {
  useEffect(() => {
    const created: HTMLVideoElement[] = [];

    // Collect every src we care about first, then dedupe --- the loss
    // variants above all resolve to the same money-loss.mp4, so this stops
    // us creating three identical hidden <video> tags for it.
    const allSrcs = new Set<string>();

    for (const property of PROPERTIES) {
      allSrcs.add(getPropertyMedia(property.id).videoSrc);
    }

    for (const upgrade of PROPERTY_UPGRADES) {
      allSrcs.add(getUpgradeMedia(upgrade.id).videoSrc);
    }

    for (const variant of CARD_EFFECT_VARIANTS) {
      allSrcs.add(getCardEffectMedia(variant).videoSrc);
    }

    for (const videoSrc of allSrcs) {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.src = videoSrc;
      video.style.position = "absolute";
      video.style.width = "0";
      video.style.height = "0";
      video.style.opacity = "0";
      video.style.pointerEvents = "none";

      // Expected for assets without a real file yet --- ignore.
      video.addEventListener("error", () => {});

      document.body.appendChild(video);
      created.push(video);
    }

    return () => {
      for (const v of created) {
        v.remove();
      }
    };
  }, []);

  return null;
}

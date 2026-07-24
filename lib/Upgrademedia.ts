// ─── Property upgrade visuals ──────────────────────────────────────────────
// Same pattern as Lib/Propertymedia.ts, but for individual upgrades
// (Fresh Paint Job, Swimming Pool, Guest Wing, etc.) instead of properties.
//
// Badge icon  → drop a small square image at
//               /public/upgrades/icons/<id>.png (png/jpg/webp all fine) and
//               it's used automatically instead of the emoji fallback below.
// Modal video → drop a short looping clip at
//               /public/upgrades/videos/<id>.mp4 and it autoplays (muted,
//               looped) as the header of the "next upgrade" panel in the
//               property modal.
//
// Nothing else in the app needs to change when you add real assets — just
// add the files using the upgrade id as the filename. Until then everything
// gracefully falls back to the emoji so the UI never shows a broken image.

import { PROPERTY_UPGRADES } from "./PropertyUpgrades";

export interface UpgradeMedia {
  /** Emoji shown until a real icon/video exists for this upgrade. */
  emoji: string;
  /** Small badge image shown on the owned-upgrades chip list. */
  iconSrc: string;
  /** Short looping clip shown as the "next upgrade" panel header. */
  videoSrc: string;
}

// Reuses the emoji already defined per-upgrade in PropertyUpgrades.ts so
// there's only one place to update the fallback character.
const EMOJI_BY_UPGRADE: Record<string, string> = Object.fromEntries(
  PROPERTY_UPGRADES.map((u) => [u.id, u.emoji]),
);

export function getUpgradeMedia(upgradeId: string): UpgradeMedia {
  return {
    emoji: EMOJI_BY_UPGRADE[upgradeId] ?? "🛠️",
    iconSrc: `/upgrades/icons/${upgradeId}.png`,
    videoSrc: `/upgrades/videos/${upgradeId}.mp4`,
  };
}

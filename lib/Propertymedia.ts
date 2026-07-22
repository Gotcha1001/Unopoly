// ─── Property visuals ──────────────────────────────────────────────────
// Central place that decides what each property *looks* like.
//
// Board icon  → drop a small square image at /public/properties/icons/<id>.png
//               (png/jpg/webp all fine) and it's used automatically instead
//               of the emoji fallback below.
// Modal video → drop a short looping clip at
//               /public/properties/videos/<id>.mp4 and it autoplays (muted,
//               looped) as the header of the property modal.
//
// Nothing else in the app needs to change when you add real assets — just
// add the files using the property id as the filename. Until then everything
// gracefully falls back to the emoji so the UI never shows a broken image.

import { PROPERTIES } from "./Properties";

export interface PropertyMedia {
  /** Emoji shown until a real icon/video exists for this property. */
  emoji: string;
  /** Small badge image shown on the board's owned-property chip. */
  iconSrc: string;
  /** Short looping clip shown as the property modal header. */
  videoSrc: string;
}

// One emoji per tier so the board reads at a glance even before real
// icons are added — ordered to match the escalating price ladder in
// Lib/Properties.ts.
const EMOJI_BY_PROPERTY: Record<string, string> = {
  property_wendyhouse: "🏠",
  property_studio: "🏢",
  property_apartment: "🏬",
  property_cottage: "🛖",
  property_house: "🏡",
  property_townhouse: "🏘️",
  property_cabin: "🌲",
  property_condo: "🏖️",
  property_villa: "🌴",
  property_hotel: "🏨",
  property_penthouse: "🌆",
  property_mansion: "🏰",
  property_castle: "👑",
  property_island: "🏝️",
};

export function getPropertyMedia(propertyId: string): PropertyMedia {
  return {
    emoji: EMOJI_BY_PROPERTY[propertyId] ?? "🏠",
    iconSrc: `/properties/icons/${propertyId}.png`,
    videoSrc: `/properties/videos/${propertyId}.mp4`,
  };
}

// Dev-time safety net: warns if Lib/Properties.ts ever gets a new property
// that this file doesn't have an emoji for yet.
if (process.env.NODE_ENV !== "production") {
  for (const p of PROPERTIES) {
    if (!EMOJI_BY_PROPERTY[p.id]) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PropertyMedia] "${p.id}" has no emoji fallback configured — add one to EMOJI_BY_PROPERTY.`,
      );
    }
  }
}

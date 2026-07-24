// ─── Card effect visuals ────────────────────────────────────────────────
// Central place that decides what plays in the header of a money-change
// result modal: the "Life event" card (rent, bills, windfalls) and the
// "Gamble Stack" card (wipeouts, jackpots, small swings).
//
// Modal video → drop a short looping clip at
//               /public/effects/videos/<variant>.mp4 and it autoplays
//               (muted, looped) as the header of that result modal.
//
// Nothing else needs to change when you add real assets — just add the
// files using the variant name as the filename. Until then everything
// gracefully falls back to the emoji already used in Gameboard.tsx today,
// so the UI never shows a broken image.

export type CardEffectVariant =
  | "life-gain" // positive life event total (e.g. Work Bonus)
  | "life-loss" // negative life event total (e.g. Medical Bill, Rent Due)
  | "gamble-wipeout" // gamble card that zeroes your cash out
  | "gamble-jackpot" // gamble card with a big flat win
  | "gamble-gain" // small/modest positive gamble swing
  | "gamble-loss"; // small/modest negative gamble swing

export interface CardEffectMedia {
  /** Emoji shown until a real clip exists for this variant. */
  emoji: string;
  /** Short looping clip shown as the modal header. */
  videoSrc: string;
}

const LOSS_VIDEO = "/effects/videos/money-loss.mp4";

const EFFECT_MEDIA: Record<CardEffectVariant, CardEffectMedia> = {
  "life-gain": { emoji: "💰", videoSrc: "/effects/videos/life-gain.mp4" },
  "life-loss": { emoji: "💸", videoSrc: LOSS_VIDEO },
  "gamble-wipeout": { emoji: "💥", videoSrc: LOSS_VIDEO },
  "gamble-jackpot": {
    emoji: "🎰",
    videoSrc: "/effects/videos/gamble-jackpot.mp4",
  },
  "gamble-gain": { emoji: "🎲", videoSrc: "/effects/videos/gamble-gain.mp4" },
  "gamble-loss": { emoji: "🎲", videoSrc: LOSS_VIDEO },
};

export function getCardEffectMedia(
  variant: CardEffectVariant,
): CardEffectMedia {
  return EFFECT_MEDIA[variant];
}

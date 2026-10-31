// lib/formatActionText.ts
// Display-only helper: turns raw card ids in the "last action" text into
// friendly names. Game logic still stores "blue_8" — nothing else changes.
//
//   "Bot Alex played blue_8"            -> "Bot Alex played Blue 8"
//   "You played red_draw2"              -> "You played Red Draw 2"
//   "Sam played wild_draw4"             -> "Sam played Wild Draw 4"
//   "Sam played wild — Color changed to green!"
//                                       -> "Sam played Wild — Color changed to Green!"

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const VALUE_LABELS: Record<string, string> = {
  skip: "Skip",
  reverse: "Reverse",
  draw2: "Draw 2",
};

export function formatCardName(cardId: string): string {
  if (cardId === "wild") return "Wild";
  if (cardId === "wild_draw4") return "Wild Draw 4";
  const [color, value] = cardId.split("_");
  if (!color || !value) return cardId;
  return `${cap(color)} ${VALUE_LABELS[value] ?? value}`;
}

export function formatActionText(text: string): string {
  return (
    text
      // wild_draw4 first, so it isn't partially matched
      .replace(/\bwild_draw4\b/g, "Wild Draw 4")
      // red_5, blue_skip, green_reverse, yellow_draw2 ...
      .replace(
        /\b(red|blue|green|yellow)_(\d|skip|reverse|draw2)\b/g,
        (_m, color: string, value: string) =>
          formatCardName(`${color}_${value}`),
      )
      // "played wild" -> "played Wild"
      .replace(/\b(played) wild\b/g, "$1 Wild")
      // "Color changed to blue" / "color is red" -> capitalised
      .replace(
        /\b(changed to|color is) (red|blue|green|yellow)\b/gi,
        (_m, lead: string, color: string) =>
          `${lead} ${cap(color.toLowerCase())}`,
      )
  );
}

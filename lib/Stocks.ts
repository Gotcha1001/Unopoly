// ─── Stock catalog ──────────────────────────────────────────────────────
// Static definitions only — live prices are NOT stored here. They live in
// games.stockPrices (see convex/schema.ts + convex/stocks.ts) so they can
// fluctuate independently per room without touching this file.
//
// `volatility` is the max fraction a price can swing in a single payday
// (e.g. 0.12 = up to ±12%, before the slight upward nudge applied in
// convex/stocks.ts's fluctuatePrices). Higher volatility = more exciting,
// riskier stock.
export const STOCKS = [
  {
    id: "stock_evergreen",
    symbol: "EVG",
    name: "Evergreen Holdings",
    emoji: "🌲",
    basePrice: 40,
    volatility: 0.12,
  },
  {
    id: "stock_nimbus",
    symbol: "NIM",
    name: "Nimbus Cloud Systems",
    emoji: "☁️",
    basePrice: 85,
    volatility: 0.18,
  },
  {
    id: "stock_anchor",
    symbol: "ANC",
    name: "Anchor Bank & Trust",
    emoji: "⚓",
    basePrice: 60,
    volatility: 0.08,
  },
  {
    id: "stock_ember",
    symbol: "EMB",
    name: "Ember Energy Co.",
    emoji: "🔥",
    basePrice: 30,
    volatility: 0.25,
  },
  {
    id: "stock_quartz",
    symbol: "QTZ",
    name: "Quartz Mining Corp",
    emoji: "💎",
    basePrice: 120,
    volatility: 0.2,
  },
  {
    id: "stock_meadow",
    symbol: "MDW",
    name: "Meadow Foods Inc.",
    emoji: "🌾",
    basePrice: 22,
    volatility: 0.06,
  },
] as const;

export function stockDef(stockId: string) {
  return STOCKS.find((s) => s.id === stockId);
}

// ─── Stock visuals ──────────────────────────────────────────────────────
// Same fallback pattern as Lib/Propertymedia.ts and Lib/Upgrademedia.ts.
// Board/chip icon → drop /public/stocks/icons/<id>.png and it's used
// automatically instead of the emoji. Nothing else needs to change.
import { STOCKS } from "./Stocks";
export interface StockMedia {
  emoji: string;
  iconSrc: string;
}
export function getStockMedia(stockId: string): StockMedia {
  const stock = STOCKS.find((s) => s.id === stockId);
  return {
    emoji: stock?.emoji ?? "📈",
    iconSrc: `/stocks/icons/${stockId}.png`,
  };
}

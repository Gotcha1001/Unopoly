"use client";
import { StockRow, type MarketStock } from "./Stockrow";
import type { StockHolding, StockTradeResult } from "@/hooks/useStocks";
export function StockList({
  stocks,
  isLoading,
  holdings,
  onBuy,
  onSell,
}: {
  stocks: MarketStock[];
  isLoading: boolean;
  holdings: StockHolding[];
  onBuy: (stockId: string, quantity: number) => Promise<StockTradeResult>;
  onSell: (stockId: string, quantity: number) => Promise<StockTradeResult>;
}) {
  const holdingById = new Map(holdings.map((h) => [h.stockId, h]));
  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F2ECDD]/60">
        Market
      </p>
      {isLoading && (
        <p className="text-sm text-[#F2ECDD]/40">Loading prices…</p>
      )}
      {stocks.map((s) => (
        <StockRow
          key={s.id}
          stock={s}
          holding={holdingById.get(s.id)}
          onBuy={onBuy}
          onSell={onSell}
        />
      ))}
    </div>
  );
}

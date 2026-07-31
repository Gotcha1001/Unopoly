"use client";
import { getStockMedia } from "@/lib/Stockmedia";
import type { StockHolding } from "@/hooks/useStocks";
import type { MarketStock } from "./Stockrow";
export function PortfolioPanel({
  holdings,
  market,
  portfolioValue,
  totalGainLoss,
}: {
  holdings: StockHolding[];
  market: MarketStock[];
  portfolioValue: number;
  totalGainLoss: number;
}) {
  const priceById = new Map(market.map((s) => [s.id, s.price]));
  const nameById = new Map(market.map((s) => [s.id, s]));
  const up = totalGainLoss >= 0;
  return (
    <div className="rounded-xl border border-[#C9A227]/20 bg-[#06170F] p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F2ECDD]/60">
        Your portfolio
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold text-[#F2ECDD]">
        ${portfolioValue.toLocaleString()}
      </p>
      <p
        className={`mt-0.5 font-mono text-xs ${up ? "text-emerald-400" : "text-red-400"}`}
      >
        {up ? "+" : ""}${totalGainLoss.toLocaleString()} all-time
      </p>
      {holdings.length === 0 ? (
        <p className="mt-4 text-sm text-[#F2ECDD]/40">
          You don&apos;t own any shares yet — buy some from the market.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {holdings.map((h) => {
            const stock = nameById.get(h.stockId);
            const price = priceById.get(h.stockId) ?? h.avgCost;
            const value = price * h.quantity;
            const gain = (price - h.avgCost) * h.quantity;
            const media = getStockMedia(h.stockId);
            return (
              <li
                key={h.stockId}
                className="flex items-center justify-between gap-2 text-xs text-[#F2ECDD]/80"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span>{media.emoji}</span>
                  <span className="truncate">
                    {stock?.symbol ?? h.stockId} × {h.quantity}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-mono">
                    ${value.toLocaleString()}
                  </span>
                  <span
                    className={`block font-mono ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {gain >= 0 ? "+" : ""}${gain.toLocaleString()}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { getStockMedia } from "@/lib/Stockmedia";
import { StockPriceBadge } from "./Stockpricebadge";
import { StockTradeModal } from "./Stocktrademodal";
import type { StockHolding, StockTradeResult } from "@/hooks/useStocks";
export interface MarketStock {
  id: string;
  symbol: string;
  name: string;
  emoji: string;
  price: number;
  pctChange?: number;
}
export function StockRow({
  stock,
  holding,
  onBuy,
  onSell,
}: {
  stock: MarketStock;
  holding?: StockHolding;
  onBuy: (stockId: string, quantity: number) => Promise<StockTradeResult>;
  onSell: (stockId: string, quantity: number) => Promise<StockTradeResult>;
}) {
  const [open, setOpen] = useState(false);
  const media = getStockMedia(stock.id);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-[#C9A227]/20 bg-[#06170F] p-3 text-left transition hover:border-[#C9A227]/50"
      >
        <span className="text-2xl">{media.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-sm font-semibold text-[#F2ECDD]">
            {stock.name}
          </span>
          <span className="block font-mono text-[11px] uppercase tracking-wider text-[#F2ECDD]/50">
            {stock.symbol}
            {holding ? ` · ${holding.quantity} owned` : ""}
          </span>
        </span>
        <StockPriceBadge price={stock.price} pctChange={stock.pctChange} />
      </button>
      <StockTradeModal
        open={open}
        onClose={() => setOpen(false)}
        stock={stock}
        holding={holding}
        onBuy={onBuy}
        onSell={onSell}
      />
    </>
  );
}

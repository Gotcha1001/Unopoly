"use client";
import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
export interface StockHolding {
  stockId: string;
  quantity: number;
  avgCost: number;
}
export interface StockTradeResult {
  success: boolean;
  message?: string;
}
export interface UseStocksOptions {
  roomId: Id<"rooms">;
  userId: string;
  /** The player's current share holdings — owned by the caller (player doc), not this hook. */
  holdings: StockHolding[];
}
/**
 * Thin wrapper around convex/stocks.ts, same shape as useBank: no local
 * cash/shares state (that lives in the players table and flows in via
 * `holdings`), just derived portfolio numbers plus buy/sell actions that
 * normalize thrown errors into {success, message}.
 */
export function useStocks({ roomId, userId, holdings }: UseStocksOptions) {
  const market = useQuery(api.stocks.getMarket, { roomId });
  const buy = useMutation(api.stocks.buyShares);
  const sell = useMutation(api.stocks.sellShares);
  const priceById = useMemo(() => {
    const m = new Map<string, number>();
    market?.forEach((s) => m.set(s.id, s.price));
    return m;
  }, [market]);
  const portfolioValue = useMemo(
    () =>
      holdings.reduce(
        (sum, h) => sum + (priceById.get(h.stockId) ?? h.avgCost) * h.quantity,
        0,
      ),
    [holdings, priceById],
  );
  const totalGainLoss = useMemo(
    () =>
      holdings.reduce((sum, h) => {
        const price = priceById.get(h.stockId) ?? h.avgCost;
        return sum + (price - h.avgCost) * h.quantity;
      }, 0),
    [holdings, priceById],
  );
  async function buyShares(
    stockId: string,
    quantity: number,
  ): Promise<StockTradeResult> {
    try {
      await buy({ roomId, userId, stockId, quantity });
      return { success: true };
    } catch (e: unknown) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "Couldn't buy shares",
      };
    }
  }
  async function sellShares(
    stockId: string,
    quantity: number,
  ): Promise<StockTradeResult> {
    try {
      await sell({ roomId, userId, stockId, quantity });
      return { success: true };
    } catch (e: unknown) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "Couldn't sell shares",
      };
    }
  }
  return {
    market: market ?? [],
    isLoading: market === undefined,
    portfolioValue,
    totalGainLoss,
    buyShares,
    sellShares,
  };
}

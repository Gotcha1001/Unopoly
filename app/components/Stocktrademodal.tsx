"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { getStockMedia } from "@/lib/Stockmedia";
import type { StockHolding, StockTradeResult } from "@/hooks/useStocks";
import type { MarketStock } from "./Stockrow";
export function StockTradeModal({
  open,
  onClose,
  stock,
  holding,
  onBuy,
  onSell,
}: {
  open: boolean;
  onClose: () => void;
  stock: MarketStock;
  holding?: StockHolding;
  onBuy: (stockId: string, quantity: number) => Promise<StockTradeResult>;
  onSell: (stockId: string, quantity: number) => Promise<StockTradeResult>;
}) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [qtyInput, setQtyInput] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const media = getStockMedia(stock.id);
  const qty = Math.floor(Number(qtyInput));
  const validQty = Number.isFinite(qty) && qty > 0;
  const maxSellable = holding?.quantity ?? 0;
  const estTotal = validQty ? qty * stock.price : 0;
  async function submit() {
    if (!validQty) {
      setError("Enter a whole number of shares greater than 0.");
      return;
    }
    if (mode === "sell" && qty > maxSellable) {
      setError("You don't own that many shares.");
      return;
    }
    setPending(true);
    const result =
      mode === "buy" ? await onBuy(stock.id, qty) : await onSell(stock.id, qty);
    setPending(false);
    if (!result.success) {
      setError(result.message ?? "That didn't work.");
      return;
    }
    setError(null);
    setQtyInput("1");
    onClose();
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[#C9A227]/30 bg-[#0B3D2E] p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{media.emoji}</span>
                <div>
                  <p className="font-serif text-base font-semibold text-[#F2ECDD]">
                    {stock.name}
                  </p>
                  <p className="font-mono text-[11px] text-[#C9A227]">
                    ${stock.price.toLocaleString()} / share
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-[#F2ECDD]/60 hover:bg-white/10 hover:text-[#F2ECDD]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 flex rounded-full bg-[#06170F] p-1">
              <button
                onClick={() => {
                  setMode("buy");
                  setError(null);
                }}
                className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                  mode === "buy"
                    ? "bg-[#C9A227] text-[#06170F]"
                    : "text-[#F2ECDD]/60"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => {
                  setMode("sell");
                  setError(null);
                }}
                disabled={maxSellable === 0}
                className={`flex-1 rounded-full py-2 text-xs font-semibold transition disabled:opacity-30 ${
                  mode === "sell"
                    ? "bg-[#F2ECDD] text-[#06170F]"
                    : "text-[#F2ECDD]/60"
                }`}
              >
                Sell {maxSellable > 0 ? `(${maxSellable})` : ""}
              </button>
            </div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-[#F2ECDD]/60">
              Shares
            </label>
            <input
              inputMode="numeric"
              value={qtyInput}
              onChange={(e) => {
                setQtyInput(e.target.value.replace(/[^0-9]/g, ""));
                setError(null);
              }}
              className="mb-2 w-full rounded-lg border border-[#C9A227]/30 bg-[#06170F] px-3 py-2 font-mono text-lg text-[#F2ECDD] outline-none focus:border-[#C9A227]"
            />
            <p className="mb-3 text-xs text-[#F2ECDD]/60">
              Estimated total:{" "}
              <span className="font-mono text-[#C9A227]">
                ${estTotal.toLocaleString()}
              </span>
            </p>
            {error && <p className="mb-3 text-xs text-[#E0665A]">{error}</p>}
            <button
              onClick={submit}
              disabled={pending || !validQty}
              className="w-full rounded-lg bg-[#C9A227] py-2.5 font-serif text-sm font-semibold text-[#06170F] transition hover:brightness-110 disabled:opacity-40"
            >
              {pending
                ? "Working…"
                : mode === "buy"
                  ? "Buy shares"
                  : "Sell shares"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

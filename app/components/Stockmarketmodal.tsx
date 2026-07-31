"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { useStocks, type StockHolding } from "@/hooks/useStocks";
import { StockMarketHeader } from "./Stockmarketheader";
import { StockList } from "./Stocklist";
import { PortfolioPanel } from "./Portfoliopanel";
export interface StockMarketModalProps {
  open: boolean;
  onClose: () => void;
  roomId: Id<"rooms">;
  userId: string;
  /** The player's current share holdings — pass player.shares ?? [] from Gameboard. */
  holdings: StockHolding[];
  videoSrc?: string;
  posterSrc?: string;
}
/**
 * Drop this once near <BankModal />, alongside <StockButton />. Owns no
 * game state itself — money/shares changes flow through convex mutations,
 * same as BankModal flows cash changes through onCashChange.
 */
export function StockMarketModal({
  open,
  onClose,
  roomId,
  userId,
  holdings,
  videoSrc,
  posterSrc,
}: StockMarketModalProps) {
  const stocks = useStocks({ roomId, userId, holdings });
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Stock Market"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#C9A227]/30 bg-[#0B3D2E] shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <StockMarketHeader
              onClose={onClose}
              videoSrc={videoSrc}
              posterSrc={posterSrc}
            />
            <div className="grid gap-6 overflow-y-auto p-6 sm:grid-cols-[1.3fr_1fr] sm:p-8">
              <StockList
                stocks={stocks.market}
                isLoading={stocks.isLoading}
                holdings={holdings}
                onBuy={stocks.buyShares}
                onSell={stocks.sellShares}
              />
              <PortfolioPanel
                holdings={holdings}
                market={stocks.market}
                portfolioValue={stocks.portfolioValue}
                totalGainLoss={stocks.totalGainLoss}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

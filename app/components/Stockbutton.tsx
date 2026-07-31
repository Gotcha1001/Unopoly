"use client";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
export interface StockButtonProps {
  onClick: () => void;
  /** Optional small badge, e.g. current portfolio value, shown under the label. */
  portfolioValue?: number;
  className?: string;
}
/**
 * Lives on the gameboard HUD next to <BankButton />. All the real UI lives
 * in StockMarketModal.
 */
export function StockButton({
  onClick,
  portfolioValue,
  className,
}: StockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 rounded-full border border-[#C9A227]/40",
        "bg-gradient-to-b from-[#0F4A38] to-[#0B3D2E] px-4 py-2.5",
        "shadow-[0_2px_0_0_#062318,0_6px_16px_-4px_rgba(0,0,0,0.5)]",
        "transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/70",
        className,
      )}
      aria-label="Open the Stock Market"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A227] text-[#0B3D2E] shadow-inner">
        <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="flex flex-col items-start leading-none">
        <span className="font-serif text-sm font-semibold tracking-wide text-[#F2ECDD]">
          Market
        </span>
        {typeof portfolioValue === "number" && (
          <span className="mt-0.5 font-mono text-[11px] text-[#C9A227]">
            ${portfolioValue.toLocaleString()}
          </span>
        )}
      </span>
    </button>
  );
}

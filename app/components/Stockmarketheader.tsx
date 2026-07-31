"use client";
import { motion } from "framer-motion";
import { X } from "lucide-react";
export interface StockMarketHeaderProps {
  onClose: () => void;
  videoSrc?: string;
  posterSrc?: string;
  title?: string;
  subtitle?: string;
}
export function StockMarketHeader({
  onClose,
  videoSrc,
  posterSrc,
  title = "The Market",
  subtitle = "Buy low. Sell whenever you like.",
}: StockMarketHeaderProps) {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-t-2xl sm:h-60">
      {videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <TickerFallback />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06170F] via-[#06170F]/40 to-transparent" />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close the Market"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-[#F2ECDD] backdrop-blur transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/70"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="absolute inset-x-0 bottom-0 px-6 pb-5">
        <p className="font-serif text-3xl font-semibold tracking-tight text-[#F2ECDD] sm:text-4xl">
          {title}
        </p>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[#C9A227]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
/** Animated scrolling ticker-tape sheen used when no video is supplied. */
function TickerFallback() {
  const symbols = [
    "EVG +2.1%",
    "NIM -0.8%",
    "ANC +0.4%",
    "EMB +5.6%",
    "QTZ -1.2%",
    "MDW +0.2%",
  ];
  return (
    <div className="absolute inset-0 bg-[#0B3D2E]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#12583F_0%,#0B3D2E_55%,#06170F_100%)]" />
      <motion.div
        className="absolute top-1/2 flex -translate-y-1/2 gap-8 whitespace-nowrap font-mono text-sm text-[#C9A227]/70"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      >
        {[...symbols, ...symbols, ...symbols].map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </motion.div>
      <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(115deg,#F2ECDD_0px,transparent_2px,transparent_60px)]" />
    </div>
  );
}

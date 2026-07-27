"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface BankVideoHeaderProps {
  onClose: () => void;
  /** Path to a video file, e.g. "/videos/bank-vault.mp4". Optional. */
  videoSrc?: string;
  posterSrc?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Header strip for the Bank modal. Plays a looping muted video behind the
 * title if `videoSrc` is provided; otherwise falls back to an animated
 * "vault door" gradient so the modal still looks intentional with no
 * asset wired up yet. Drop a real clip in /public/videos and pass its
 * path once you have one.
 */
export function BankVideoHeader({
  onClose,
  videoSrc,
  posterSrc,
  title = "The Bank",
  subtitle = "Grow it, stash it, cash it out.",
}: BankVideoHeaderProps) {
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
        <VaultFallback />
      )}

      {/* Scrim so the title stays legible over either video or fallback */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06170F] via-[#06170F]/40 to-transparent" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close the Bank"
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

/** Animated brass dial + vault-door sheen used when no video is supplied. */
function VaultFallback() {
  return (
    <div className="absolute inset-0 bg-[#0B3D2E]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#12583F_0%,#0B3D2E_55%,#06170F_100%)]" />
      <motion.div
        className="absolute right-10 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border-4 border-[#C9A227]/70 sm:h-36 sm:w-36"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-3 rounded-full border-2 border-[#C9A227]/40" />
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 origin-center bg-[#C9A227]/60"
            style={{ transform: `rotate(${i * 45}deg) translateY(-52px)` }}
          />
        ))}
      </motion.div>
      <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(115deg,#F2ECDD_0px,transparent_2px,transparent_60px)]" />
    </div>
  );
}

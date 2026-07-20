"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number; // vw start position
  rotate: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  drift: number; // horizontal drift in px as it falls
  shape: "rect" | "circle";
}

const COLOR_SETS = {
  win: ["#facc15", "#f59e0b", "#a855f7", "#7c3aed", "#22c55e", "#ffffff"],
  money: ["#22c55e", "#4ade80", "#facc15", "#fde047", "#34d399"],
};

function makePieces(count: number, palette: string[]): ConfettiPiece[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    rotate: Math.random() * 360,
    color: palette[Math.floor(Math.random() * palette.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.4,
    duration: 2.2 + Math.random() * 1.4,
    drift: (Math.random() - 0.5) * 160,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));
}

interface ConfettiBurstProps {
  /**
   * Any value that changes to fire a new burst — e.g. a timestamp, a
   * winnerId, or an incrementing counter. Passing the same value twice in a
   * row will NOT re-fire (React state dedup), so use Date.now() or similar
   * if you need to guarantee a fresh burst each time.
   */
  trigger: string | number | null | undefined;
  /** "win" = big celebratory burst, "money" = smaller green/gold burst for cash events */
  variant?: "win" | "money";
  /** Number of pieces. Defaults: win=140, money=60 */
  pieceCount?: number;
}

export function ConfettiBurst({
  trigger,
  variant = "win",
  pieceCount,
}: ConfettiBurstProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [burstId, setBurstId] = useState<string | number | null>(null);
  const count = pieceCount ?? (variant === "win" ? 140 : 60);
  const palette = useMemo(
    () => (variant === "win" ? COLOR_SETS.win : COLOR_SETS.money),
    [variant],
  );
  useEffect(() => {
    if (trigger === null || trigger === undefined) return;
    if (trigger === burstId) return;
    setBurstId(trigger);
    setPieces(makePieces(count, palette));
    const longest = 2.2 + 1.4 + 0.4; // duration + delay ceiling
    const timeout = setTimeout(() => setPieces([]), longest * 1000 + 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  if (pieces.length === 0) return null;
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.span
            key={`${burstId}-${p.id}`}
            initial={{
              top: "-5vh",
              left: `${p.x}vw`,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              top: "105vh",
              left: `calc(${p.x}vw + ${p.drift}px)`,
              opacity: [1, 1, 0.9, 0],
              rotate: p.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeIn",
            }}
            className="absolute"
            style={{
              width: p.size,
              height: p.shape === "rect" ? p.size * 0.4 : p.size,
              background: p.color,
              borderRadius: p.shape === "circle" ? "9999px" : "2px",
              boxShadow: `0 0 6px ${p.color}80`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

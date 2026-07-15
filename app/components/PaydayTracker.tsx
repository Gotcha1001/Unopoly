"use client";

import { motion } from "framer-motion";

// Must match the SALARY_INTERVAL constant in convex/game.ts --- if that
// value changes server-side, update it here too (no shared import between
// client and server code in this project, so this has to be kept in sync
// by hand).
const SALARY_INTERVAL = 8;

interface PaydayTrackerProps {
  turnCount: number;
  numPlayers: number;
}

export function PaydayTracker({ turnCount, numPlayers }: PaydayTrackerProps) {
  const scaledInterval = SALARY_INTERVAL * Math.max(numPlayers, 1);
  const dayNumber =
    Math.floor((turnCount % scaledInterval) / Math.max(numPlayers, 1)) + 1; // 1-8
  const turnsUntilPayday = scaledInterval - (turnCount % scaledInterval);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 border border-white/15 backdrop-blur-sm">
      <span className="text-[10px] text-white/50 uppercase tracking-wider mr-1">
        Payday
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: SALARY_INTERVAL }).map((_, i) => {
          const isPast = i < dayNumber - 1;
          const isToday = i === dayNumber - 1;
          const isPaydayDot = i === SALARY_INTERVAL - 1;
          return (
            <motion.div
              key={i}
              className="rounded-full flex items-center justify-center"
              style={{
                width: isPaydayDot ? 16 : 8,
                height: isPaydayDot ? 16 : 8,
                background: isPast
                  ? "#22c55e"
                  : isToday
                    ? "#facc15"
                    : "rgba(255,255,255,0.15)",
                boxShadow: isToday
                  ? "0 0 10px rgba(250,204,21,0.7)"
                  : undefined,
              }}
              animate={isToday ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {isPaydayDot && <span className="text-[7px]">💰</span>}
            </motion.div>
          );
        })}
      </div>
      <span className="text-xs font-semibold text-white/70 ml-1">
        {turnsUntilPayday === scaledInterval
          ? "Today!"
          : `${turnsUntilPayday} left`}
      </span>
    </div>
  );
}

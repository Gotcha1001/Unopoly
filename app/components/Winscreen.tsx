"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { AnimatedCash } from "./Animatedcash";

interface PlayerFinancials {
  userId: string;
  name: string;
  isBot: boolean;
  money?: number;
  properties?: { id: string; name: string; price: number; value: number }[];
  savings?: number;
  shares?: { stockId: string; quantity: number; avgCost: number }[];
}

interface Props {
  winnerName: string;
  isWinner: boolean;
  roomId: Id<"rooms">;
  currentUserId: string;
  players?: PlayerFinancials[];
  stockPrices?: { id: string; price: number }[];
  onPlayAgain?: () => void;
}

export function WinScreen({
  winnerName,
  isWinner,
  roomId,
  currentUserId,
  players,
  stockPrices,
  onPlayAgain,
}: Props) {
  const router = useRouter();
  const resetRoom = useMutation(api.rooms.resetRoom);
  const [resetting, setResetting] = useState(false);
  const winCommentary = useQuery(api.coachData.getWinCommentary, { roomId });

  const handlePlayAgain = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetRoom({ roomId });
      if (onPlayAgain) {
        onPlayAgain();
      } else {
        router.push(`/game/${roomId}`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not reset room");
    } finally {
      setResetting(false);
    }
  };

  const priceById = new Map((stockPrices ?? []).map((p) => [p.id, p.price]));

  const standings = (players ?? [])
    .map((p) => {
      const propertyValue = (p.properties ?? []).reduce(
        (s, pr) => s + pr.value,
        0,
      );
      const savings = p.savings ?? 0;
      const sharesValue = (p.shares ?? []).reduce(
        (s, h) => s + (priceById.get(h.stockId) ?? h.avgCost) * h.quantity,
        0,
      );
      const cash = p.money ?? 0;
      return {
        ...p,
        cash,
        propertyValue,
        savings,
        sharesValue,
        wealth: cash + propertyValue + savings + sharesValue,
      };
    })
    .sort((a, b) => b.wealth - a.wealth);

  const showSavingsCol = standings.some((p) => p.savings > 0);
  const showSharesCol = standings.some((p) => p.sharesValue > 0);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(147,51,234,0.35) 0%, rgba(79,70,229,0.35) 35%, rgba(10,7,32,1) 75%)",
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 10%, rgba(196,132,252,0.25), transparent 60%)",
        }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="text-center w-full max-w-lg relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <motion.div
          className="text-8xl mb-6"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {isWinner ? "🏆" : "😔"}
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight break-words px-4">
          {isWinner ? "You Win!" : "Game Over"}
        </h1>
        <p className="text-lg text-violet-200/80 mb-6">
          {isWinner
            ? "Congratulations! You went out with the most wealth!"
            : `${winnerName} won this round — richest player at the table.`}
        </p>

        {winCommentary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-2 mb-6 px-4 py-3 rounded-2xl bg-black/30 border border-violet-400/25 text-left"
          >
            <span className="text-base leading-none mt-0.5">🎩</span>
            {winCommentary.status === "pending" ? (
              <div className="flex-1 flex items-center gap-1.5 py-0.5">
                <span className="text-xs text-violet-200/70 italic">
                  The Hatter is composing your victory speech
                </span>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1 h-1 rounded-full bg-violet-300"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </span>
              </div>
            ) : (
              <p className="flex-1 text-sm text-violet-100/90 leading-relaxed">
                {winCommentary.text}
                {winCommentary.status === "streaming" && (
                  <motion.span
                    className="inline-block w-1.5 h-3.5 bg-violet-300 ml-0.5 align-middle"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                )}
              </p>
            )}
          </motion.div>
        )}

        {standings.length > 0 && (
          <div className="flex flex-col gap-2.5 mb-8 text-left">
            {standings.map((p, i) => (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.5 + i * 0.08,
                  type: "spring",
                  stiffness: 260,
                  damping: 24,
                }}
                className={`rounded-2xl px-4 py-3 border ${
                  i === 0
                    ? "bg-gradient-to-r from-amber-400/15 to-amber-600/10 border-amber-300/40"
                    : "bg-white/5 border-white/10"
                } ${p.userId === currentUserId ? "ring-2 ring-inset ring-violet-400/60" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white truncate flex items-center gap-1.5">
                    {i === 0 && "👑"} {p.isBot && "🤖"} {p.name}
                  </span>
                  <span className="font-black text-lg tabular-nums text-white">
                    <AnimatedCash
                      value={p.wealth}
                      startFromZero
                      delay={300 + i * 80}
                    />
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <StatChip label="Cash" value={p.cash} delay={i * 80} />
                  <StatChip
                    label="Property"
                    value={p.propertyValue}
                    delay={80 + i * 80}
                  />
                  {showSavingsCol && (
                    <StatChip
                      label="Savings"
                      value={p.savings}
                      delay={160 + i * 80}
                    />
                  )}
                  {showSharesCol && (
                    <StatChip
                      label="Shares"
                      value={p.sharesValue}
                      delay={220 + i * 80}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 text-lg rounded-xl"
            onClick={() => router.push("/lobby")}
          >
            Back to Lobby
          </Button>
          <Button
            variant="outline"
            className="border-purple-400 text-purple-200 px-8 py-3 text-lg rounded-xl"
            onClick={handlePlayAgain}
            disabled={resetting}
          >
            {resetting ? "Resetting…" : "🔄 Play Again"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function StatChip({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  return (
    <div className="rounded-lg bg-black/25 px-2 py-1.5">
      <div className="text-white/40 uppercase tracking-wide">{label}</div>
      <div className="text-violet-200 font-semibold tabular-nums">
        <AnimatedCash value={value} startFromZero delay={delay} />
      </div>
    </div>
  );
}

// "use client";

// // ─── CHANGES FROM ORIGINAL ────────────────────────────────────────────────────
// // 1. Added `onPlayAgain` prop (optional callback) — unchanged from before.
// // 2. NEW: Added `players` prop so the win screen can show a final financial
// //    standings table (cash, property value, total wealth) sorted richest
// //    first, matching the new "richest player wins" rule.
// // 3. NEW: Cash/property/wealth columns now count up from 0 via AnimatedCash
// //    instead of appearing as static numbers, staggered left to right so the
// //    columns fill in as a small wave rather than all at once.
// // ─────────────────────────────────────────────────────────────────────────────

// import { motion } from "framer-motion";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Id } from "@/convex/_generated/dataModel";
// import { useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { useState } from "react";
// import { toast } from "sonner";
// import { AnimatedCash } from "./Animatedcash";

// interface PlayerFinancials {
//   userId: string;
//   name: string;
//   isBot: boolean;
//   money?: number;
//   properties?: { id: string; name: string; price: number; value: number }[];
// }

// interface Props {
//   winnerName: string;
//   isWinner: boolean;
//   roomId: Id<"rooms">;
//   /** The Clerk userId of the current user — needed to authorise the reset. */
//   currentUserId: string;
//   /** Final player list — used to render the financial standings table. */
//   players?: PlayerFinancials[];
//   /**
//    * When provided the component calls resetRoom then invokes this callback
//    * so the parent page can transition back to the WaitingRoom in-place.
//    * When omitted we fall back to a simple router.push (old behaviour).
//    */
//   onPlayAgain?: () => void;
// }

// export function WinScreen({
//   winnerName,
//   isWinner,
//   roomId,
//   currentUserId,
//   players,
//   onPlayAgain,
// }: Props) {
//   const router = useRouter();
//   const resetRoom = useMutation(api.rooms.resetRoom);
//   const [resetting, setResetting] = useState(false);

//   const handlePlayAgain = async () => {
//     if (resetting) return;
//     setResetting(true);
//     try {
//       // Reset the room in Convex — status → "waiting", players un-readied,
//       // old game document deleted.
//       await resetRoom({ roomId });

//       if (onPlayAgain) {
//         // Parent handles the UI transition (stays on the same page/room).
//         onPlayAgain();
//       } else {
//         // Fallback: navigate back to the game route (host will need to
//         // re-start from the WaitingRoom).
//         router.push(`/game/${roomId}`);
//       }
//     } catch (e: unknown) {
//       toast.error(e instanceof Error ? e.message : "Could not reset room");
//     } finally {
//       setResetting(false);
//     }
//   };

//   const standings = (players ?? [])
//     .map((p) => {
//       const propertyValue = (p.properties ?? []).reduce(
//         (s, pr) => s + pr.value,
//         0,
//       );
//       return {
//         ...p,
//         cash: p.money ?? 0,
//         propertyValue,
//         wealth: (p.money ?? 0) + propertyValue,
//       };
//     })
//     .sort((a, b) => b.wealth - a.wealth);

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-indigo-950 px-4 py-10">
//       <motion.div
//         className="text-center w-full max-w-md"
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ type: "spring", stiffness: 200 }}
//       >
//         <motion.div
//           className="text-8xl mb-6"
//           animate={{ rotate: [0, -10, 10, -10, 0] }}
//           transition={{ duration: 0.6, delay: 0.3 }}
//         >
//           {isWinner ? "🏆" : "😔"}
//         </motion.div>

//         <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-3">
//           {isWinner ? "You Win!" : "Game Over"}
//         </h1>

//         <p className="text-lg text-gray-600 dark:text-purple-300 mb-6">
//           {isWinner
//             ? "Congratulations! You went out with the most wealth!"
//             : `${winnerName} won this round — richest player at the table.`}
//         </p>

//         {standings.length > 0 && (
//           <div className="mb-8 rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-800/50 text-left">
//             <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wide bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
//               <span>Player</span>
//               <span>Cash</span>
//               <span>Property</span>
//               <span>Total</span>
//             </div>
//             {standings.map((p, i) => (
//               <div
//                 key={p.userId}
//                 className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-2 text-sm ${
//                   i === 0
//                     ? "bg-amber-50 dark:bg-amber-900/20 font-bold"
//                     : "bg-white dark:bg-indigo-950/40"
//                 } ${p.userId === currentUserId ? "ring-1 ring-inset ring-purple-400" : ""}`}
//               >
//                 <span className="truncate text-gray-800 dark:text-white">
//                   {i === 0 ? "👑 " : ""}
//                   {p.isBot ? "🤖 " : ""}
//                   {p.name}
//                 </span>
//                 <span className="text-gray-600 dark:text-purple-300 tabular-nums">
//                   <AnimatedCash value={p.cash} startFromZero delay={0} />
//                 </span>
//                 <span className="text-gray-600 dark:text-purple-300 tabular-nums">
//                   <AnimatedCash
//                     value={p.propertyValue}
//                     startFromZero
//                     delay={150}
//                   />
//                 </span>
//                 <span className="text-gray-900 dark:text-white tabular-nums">
//                   <AnimatedCash value={p.wealth} startFromZero delay={300} />
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}

//         <div className="flex flex-col sm:flex-row gap-4 justify-center">
//           <Button
//             className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 text-lg"
//             onClick={() => router.push("/lobby")}
//           >
//             Back to Lobby
//           </Button>

//           <Button
//             variant="outline"
//             className="border-purple-500 text-purple-600 dark:text-purple-400 px-8 py-3 text-lg"
//             onClick={handlePlayAgain}
//             disabled={resetting}
//           >
//             {resetting ? "Resetting…" : "🔄 Play Again"}
//           </Button>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

"use client";

// ─── CHANGES FROM ORIGINAL ────────────────────────────────────────────────────
// 1. Added `onPlayAgain` prop (optional callback) — unchanged from before.
// 2. Added `players` prop so the win screen can show a final financial
//    standings table (cash, property value, total wealth) sorted richest
//    first, matching the "richest player wins" rule.
// 3. Cash/property/wealth columns count up from 0 via AnimatedCash instead
//    of appearing as static numbers, staggered left to right.
// 4. FIX: standings previously only summed cash + property, so money parked
//    in savings (the bank) or in stocks was invisible here and could make
//    the win screen disagree with who actually won. Now takes `savings`
//    and `shares` on each player, plus an optional `stockPrices` snapshot
//    for live share pricing (falls back to each holding's avgCost if a
//    price snapshot isn't passed in), and adds Savings + Shares columns
//    that both roll into Total — cash + property + savings + shares.
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { AnimatedCash } from "./Animatedcash";

interface PlayerFinancials {
  userId: string;
  name: string;
  isBot: boolean;
  money?: number;
  properties?: { id: string; name: string; price: number; value: number }[];
  /** Bank balance — counts toward total wealth just like cash and property. */
  savings?: number;
  /** Stock holdings — valued live via `stockPrices`, falling back to avgCost. */
  shares?: { stockId: string; quantity: number; avgCost: number }[];
}

interface Props {
  winnerName: string;
  isWinner: boolean;
  roomId: Id<"rooms">;
  /** The Clerk userId of the current user — needed to authorise the reset. */
  currentUserId: string;
  /** Final player list — used to render the financial standings table. */
  players?: PlayerFinancials[];
  /**
   * Live price snapshot at the moment the game ended (e.g. game.stockPrices).
   * Used to value each player's shares. If omitted, each holding falls back
   * to its avgCost, same fallback used everywhere else in the app.
   */
  stockPrices?: { id: string; price: number }[];
  /**
   * When provided the component calls resetRoom then invokes this callback
   * so the parent page can transition back to the WaitingRoom in-place.
   * When omitted we fall back to a simple router.push (old behaviour).
   */
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

  const handlePlayAgain = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      // Reset the room in Convex — status → "waiting", players un-readied,
      // old game document deleted.
      await resetRoom({ roomId });

      if (onPlayAgain) {
        // Parent handles the UI transition (stays on the same page/room).
        onPlayAgain();
      } else {
        // Fallback: navigate back to the game route (host will need to
        // re-start from the WaitingRoom).
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
        // Total wealth = liquid cash + property + savings + shares.
        wealth: cash + propertyValue + savings + sharesValue,
      };
    })
    .sort((a, b) => b.wealth - a.wealth);

  // Only show Savings / Shares columns if at least one player actually has
  // a balance there — keeps the table compact for games that never touched
  // the bank or the stock market.
  const showSavingsCol = standings.some((p) => p.savings > 0);
  const showSharesCol = standings.some((p) => p.sharesValue > 0);

  const columnCount = 3 + (showSavingsCol ? 1 : 0) + (showSharesCol ? 1 : 0);
  const gridCols = `1fr repeat(${columnCount - 1}, auto)`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-indigo-950 px-4 py-10">
      <motion.div
        className="text-center w-full max-w-md"
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

        <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-3">
          {isWinner ? "You Win!" : "Game Over"}
        </h1>

        <p className="text-lg text-gray-600 dark:text-purple-300 mb-6">
          {isWinner
            ? "Congratulations! You went out with the most wealth!"
            : `${winnerName} won this round — richest player at the table.`}
        </p>

        {standings.length > 0 && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-800/50 text-left">
            <div
              className="grid gap-x-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wide bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
              style={{ gridTemplateColumns: gridCols }}
            >
              <span>Player</span>
              <span>Cash</span>
              <span>Property</span>
              {showSavingsCol && <span>Savings</span>}
              {showSharesCol && <span>Shares</span>}
              <span>Total</span>
            </div>
            {standings.map((p, i) => (
              <div
                key={p.userId}
                className="grid gap-x-3 px-4 py-2 text-sm"
                style={{
                  gridTemplateColumns: gridCols,
                }}
              >
                <div
                  className={`col-span-full grid gap-x-3 items-center ${
                    i === 0
                      ? "bg-amber-50 dark:bg-amber-900/20 font-bold"
                      : "bg-white dark:bg-indigo-950/40"
                  } ${p.userId === currentUserId ? "ring-1 ring-inset ring-purple-400" : ""}`}
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <span className="truncate text-gray-800 dark:text-white">
                    {i === 0 ? "👑 " : ""}
                    {p.isBot ? "🤖 " : ""}
                    {p.name}
                  </span>
                  <span className="text-gray-600 dark:text-purple-300 tabular-nums">
                    <AnimatedCash value={p.cash} startFromZero delay={0} />
                  </span>
                  <span className="text-gray-600 dark:text-purple-300 tabular-nums">
                    <AnimatedCash
                      value={p.propertyValue}
                      startFromZero
                      delay={150}
                    />
                  </span>
                  {showSavingsCol && (
                    <span className="text-gray-600 dark:text-purple-300 tabular-nums">
                      <AnimatedCash
                        value={p.savings}
                        startFromZero
                        delay={225}
                      />
                    </span>
                  )}
                  {showSharesCol && (
                    <span className="text-gray-600 dark:text-purple-300 tabular-nums">
                      <AnimatedCash
                        value={p.sharesValue}
                        startFromZero
                        delay={275}
                      />
                    </span>
                  )}
                  <span className="text-gray-900 dark:text-white tabular-nums">
                    <AnimatedCash value={p.wealth} startFromZero delay={300} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 text-lg"
            onClick={() => router.push("/lobby")}
          >
            Back to Lobby
          </Button>

          <Button
            variant="outline"
            className="border-purple-500 text-purple-600 dark:text-purple-400 px-8 py-3 text-lg"
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

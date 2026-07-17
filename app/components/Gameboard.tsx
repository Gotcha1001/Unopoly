// "use client";

// import { useMutation, useQuery } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { motion, AnimatePresence } from "framer-motion";
// import { useState, useEffect, useRef } from "react";
// import { toast } from "sonner";
// import { UnoCard, CardBack, parseCard } from "./UnoCard";
// import { useRouter } from "next/navigation";
// import { ArrowLeft, Volume2, VolumeX, Zap, Dices } from "lucide-react";
// import { Id } from "@/convex/_generated/dataModel";
// import { useBackground } from "../context/BackgroundContext";
// import { useSoundManager } from "@/hooks/useSoundManager";
// import { VideoLobby } from "./Videolobby";
// import { PaydayTracker } from "./PaydayTracker";
// import { AnimatedCash } from "./Animatedcash";

// // ─── Interfaces ───────────────────────────────────────────────────────
// interface Room {
//   _id: Id<"rooms">;
//   _creationTime: number;
//   name: string;
//   hostId: string;
//   hostName: string;
//   status: "waiting" | "playing" | "finished";
//   maxPlayers: number;
//   playerIds: string[];
//   createdAt: number;
// }

// interface PropertyHolding {
//   id: string;
//   name: string;
//   price: number;
//   value: number;
// }

// interface LifeEventHolding {
//   id: string;
//   label: string;
//   amount: number;
// }

// // ─── Gamble stack addition ────────────────────────────────────────────
// interface GambleEventHolding {
//   id: string;
//   label: string;
//   description: string;
//   amount: number;
//   wipeOut: boolean;
//   jackpot: boolean;
// }

// interface Player {
//   _id: Id<"players">;
//   _creationTime: number;
//   roomId: Id<"rooms">;
//   userId: string;
//   name: string;
//   avatarUrl?: string | undefined;
//   isBot: boolean;
//   isReady: boolean;
//   isConnected: boolean;
//   hand: string[];
//   seatIndex: number;
//   // ─── Monopoly-Uno additions ─────────────────────────────────────────
//   money: number;
//   properties: PropertyHolding[];
//   // Queues, not single objects --- a forced multi-card draw can surface more
//   // than one offer/event at once. Drawn cards resolve into these the
//   // instant they leave the deck; they never sit in `hand`.
//   pendingProperties?: PropertyHolding[] | undefined;
//   pendingLifeEvents?: LifeEventHolding[] | undefined;
//   // ─── Gamble stack additions ─────────────────────────────────────────
//   pendingGambleEvent?: GambleEventHolding | undefined;
//   lastGambleTurn?: number | undefined;
// }

// interface Game {
//   _id: Id<"games">;
//   _creationTime: number;
//   roomId: Id<"rooms">;
//   deck: string[];
//   discardPile: string[];
//   currentColor: string;
//   currentPlayerIndex: number;
//   playerOrder: string[];
//   direction: number;
//   drawStack: number;
//   lastAction?: string | undefined;
//   winnerId?: string | undefined;
//   status: "active" | "finished";
//   createdAt: number;
//   // ─── Monopoly-Uno additions ─────────────────────────────────────────
//   turnCount?: number | undefined;
//   salaryNotice?:
//     | {
//         turnCount: number;
//         amount: number;
//         at: number;
//         // ─── Rent additions ──────────────────────────────────────────────
//         // Rent collected this payday, keyed by userId --- everyone gets the
//         // same flat salary, but rent varies per player depending on how
//         // many properties they own, so it can't just be a single number.
//         rentByPlayer?: Record<string, number> | undefined;
//       }
//     | undefined;
//   // ─── Gamble stack additions ─────────────────────────────────────────
//   gambleDeck?: string[] | undefined;
// }

// interface GameBoardProps {
//   room: Room;
//   game: Game;
//   players: Player[];
//   currentUserId: string;
// }

// // ─── Helpers ────────────────────────────────────────────────────────────
// function canPlayCard(
//   card: string,
//   topCard: string,
//   currentColor: string,
// ): boolean {
//   const { color, value } = parseCard(card);
//   const { value: topValue } = parseCard(topCard);
//   // Wild cards are wild-like: playable on any color or value. (Life/property
//   // cards can never appear in a hand --- they resolve the instant they're
//   // drawn --- so there's nothing to special-case for them here anymore.)
//   if (color === "wild") return true;
//   if (color === currentColor) return true;
//   if (value === topValue) return true;
//   return false;
// }

// function isCardPlayable(
//   cardId: string,
//   topCard: string,
//   currentColor: string,
//   drawStack: number,
// ): boolean {
//   if (!canPlayCard(cardId, topCard, currentColor)) return false;
//   if (drawStack > 0) {
//     const { value } = parseCard(cardId);
//     const { value: topValue } = parseCard(topCard);
//     if (topValue === "draw2" && value !== "draw2") return false;
//     if (topValue === "wild_draw4" && cardId !== "wild_draw4") return false;
//     if (value === "wild") return false;
//   }
//   return true;
// }

// function wealthOf(p: Pick<Player, "money" | "properties">) {
//   return (
//     (p.money ?? 0) + (p.properties ?? []).reduce((s, pr) => s + pr.value, 0)
//   );
// }

// const COLOR_OPTIONS = ["red", "blue", "green", "yellow"] as const;

// const COLOR_HEX: Record<string, string> = {
//   red: "#ef4444",
//   blue: "#3b82f6",
//   green: "#22c55e",
//   yellow: "#eab308",
// };

// const COLOR_GLOW: Record<string, string> = {
//   red: "rgba(239,68,68,0.5)",
//   blue: "rgba(59,130,246,0.5)",
//   green: "rgba(34,197,94,0.5)",
//   yellow: "rgba(234,179,8,0.5)",
// };

// const TABLE_BG =
//   "radial-gradient(ellipse at 50% 40%, #1a4a2e 0%, #0f2d1c 45%, #091a10 100%)";

// // ─── Component ────────────────────────────────────────────────────────────
// export function GameBoard({
//   room,
//   game,
//   players,
//   currentUserId,
// }: GameBoardProps) {
//   const router = useRouter();
//   const playCard = useMutation(api.game.playCard);
//   const drawCard = useMutation(api.game.drawCard);
//   const respondProperty = useMutation(api.game.respondProperty);
//   const acknowledgeLifeEvents = useMutation(api.game.acknowledgeLifeEvents);
//   // ─── Gamble stack additions ─────────────────────────────────────────
//   const drawGambleCard = useMutation(api.game.drawGambleCard);
//   const acknowledgeGambleEvent = useMutation(api.game.acknowledgeGambleEvent);

//   const playerHand = useQuery(api.game.getPlayerHand, {
//     roomId: room._id,
//     userId: currentUserId,
//   });

//   const [showColorPicker, setShowColorPicker] = useState(false);
//   const [pendingWildCard, setPendingWildCard] = useState<string | null>(null);
//   const [selectedCard, setSelectedCard] = useState<string | null>(null);
//   const [isDragOver, setIsDragOver] = useState(false);
//   const [respondingProperty, setRespondingProperty] = useState(false);
//   const [acknowledgingLifeEvents, setAcknowledgingLifeEvents] = useState(false);
//   // ─── Gamble stack additions ─────────────────────────────────────────
//   const [pullingGamble, setPullingGamble] = useState(false);
//   const [acknowledgingGamble, setAcknowledgingGamble] = useState(false);
//   const [salaryModal, setSalaryModal] = useState<{
//     turnCount: number;
//     amount: number;
//     rentAmount: number;
//   } | null>(null);

//   const { selected: boardBg } = useBackground();

//   // Ref for the discard pile drop target
//   const discardRef = useRef<HTMLDivElement>(null);

//   // ── Sound ──────────────────────────────────────────────────────────────
//   const { play, setMuted } = useSoundManager();
//   const [muted, setMutedState] = useState(false);

//   const [draggingCard, setDraggingCard] = useState<string | null>(null);

//   const toggleMute = () => {
//     const next = !muted;
//     setMutedState(next);
//     setMuted(next);
//   };

//   const prevIsMyTurn = useRef(false);
//   const prevHandLength = useRef<number | null>(null);
//   const prevGameStatus = useRef<string>("active");
//   const dealPlayed = useRef(false);

//   // ── Derived ────────────────────────────────────────────────────────────
//   const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
//   const isMyTurn = currentPlayerId === currentUserId;
//   const topCard = game.discardPile[game.discardPile.length - 1];
//   const opponents = players.filter((p) => p.userId !== currentUserId);
//   const currentPlayerName =
//     players.find((p) => p.userId === currentPlayerId)?.name ?? "Unknown";
//   const currentGlow = COLOR_GLOW[game.currentColor] ?? "rgba(147,51,234,0.5)";
//   const currentHex = COLOR_HEX[game.currentColor] ?? "#9333ea";

//   const myPlayer = players.find((p) => p.userId === currentUserId);
//   const myName = myPlayer?.name ?? "Player";
//   const myMoney = myPlayer?.money ?? 0;
//   const myPropertyValue = (myPlayer?.properties ?? []).reduce(
//     (s, pr) => s + pr.value,
//     0,
//   );
//   const myProperties = myPlayer?.properties ?? [];
//   const myPendingProperty = myPlayer?.pendingProperties?.[0];
//   const myPendingPropertyQueueLength = myPlayer?.pendingProperties?.length ?? 0;
//   const myPendingLifeEvents = myPlayer?.pendingLifeEvents ?? [];
//   // ─── Gamble stack additions ─────────────────────────────────────────
//   const myPendingGambleEvent = myPlayer?.pendingGambleEvent;
//   const hasUsedGambleThisTurn =
//     (myPlayer?.lastGambleTurn ?? -1) === (game.turnCount ?? 0);
//   const canPullGamble = isMyTurn && !hasUsedGambleThisTurn && !pullingGamble;

//   const richestUserId = players.length
//     ? players.reduce((best, p) => (wealthOf(p) > wealthOf(best) ? p : best))
//         .userId
//     : null;

//   const maxOpponentWealth = opponents.length
//     ? Math.max(...opponents.map(wealthOf))
//     : -Infinity;

//   const isLastCard = (playerHand?.length ?? 0) === 1;

//   // Predicts whether playing this specific card (your last one) would win
//   // the game, so we can warn the player *before* they commit to it instead
//   // of surprising them with a forced draw-2 afterward. Life/property cards
//   // can never be your last hand card anymore (they resolve at draw time),
//   // so this is just your current cash + property value.
//   const predictLastCardOutcome = () => {
//     const projectedWealth = myMoney + myPropertyValue;
//     return {
//       wouldWin: projectedWealth >= maxOpponentWealth,
//       projectedWealth,
//     };
//   };

//   // ── Sound effects ────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!dealPlayed.current && game.status === "active") {
//       dealPlayed.current = true;
//       setTimeout(() => play("cardDeal"), 300);
//     }
//   }, [game.status, play]);

//   useEffect(() => {
//     if (isMyTurn && !prevIsMyTurn.current) play("yourTurn");
//     prevIsMyTurn.current = isMyTurn;
//   }, [isMyTurn, play]);

//   useEffect(() => {
//     if (playerHand === undefined) return;
//     if (
//       prevHandLength.current !== null &&
//       prevHandLength.current > 1 &&
//       playerHand.length === 1
//     ) {
//       play("unoAlert");
//     }
//     prevHandLength.current = playerHand.length;
//   }, [playerHand, play]);

//   useEffect(() => {
//     if (prevGameStatus.current !== "finished" && game.status === "finished") {
//       play(game.winnerId === currentUserId ? "win" : "lose");
//     }
//     prevGameStatus.current = game.status;
//   }, [game.status, game.winnerId, currentUserId, play]);

//   // A 7-day week (turns 1-7), then payday on the 8th turn --- like next
//   // Monday --- everyone gets paid a $200 "salary". The server stamps
//   // salaryNotice.at with a fresh timestamp each time it happens, so this
//   // just watches for that timestamp changing (not the raw presence of the
//   // field, since it persists after the modal is dismissed) and pops the
//   // modal exactly once per payout, for every player at the table at once.
//   const lastSalaryAt = useRef<number | null>(game.salaryNotice?.at ?? null);
//   useEffect(() => {
//     const notice = game.salaryNotice;
//     if (!notice) return;
//     if (lastSalaryAt.current === notice.at) return;
//     lastSalaryAt.current = notice.at;
//     setSalaryModal({
//       turnCount: notice.turnCount,
//       amount: notice.amount,
//       rentAmount: notice.rentByPlayer?.[currentUserId] ?? 0,
//     });
//     play("cardDeal");
//   }, [game.salaryNotice, currentUserId, play]);

//   // ── Handlers ────────────────────────────────────────────────────────────
//   const handleCardClick = async (cardId: string) => {
//     if (!isMyTurn) {
//       toast.error("Not your turn!");
//       return;
//     }
//     // Use isCardPlayable instead of canPlayCard --- it enforces draw stack rules too
//     if (!isCardPlayable(cardId, topCard, game.currentColor, game.drawStack)) {
//       if (game.drawStack > 0) {
//         const { value: topValue } = parseCard(topCard);
//         if (topValue === "wild_draw4")
//           toast.error("You must play a +4 or draw!");
//         else toast.error("You must play a +2 or draw!");
//       } else {
//         toast.error("Can't play that card");
//       }
//       return;
//     }

//     const { value } = parseCard(cardId);
//     if (value === "wild" || cardId === "wild_draw4") play("cardPlayWild");
//     else play("cardPlay", parseCard(cardId).color);

//     if (value === "wild" || cardId === "wild_draw4") {
//       setPendingWildCard(cardId);
//       setShowColorPicker(true);
//       return;
//     }

//     try {
//       setSelectedCard(cardId);
//       const result = await playCard({
//         roomId: room._id,
//         userId: currentUserId,
//         cardId,
//       });
//       announceGoingOutResult(result);
//       setSelectedCard(null);
//     } catch (err: unknown) {
//       toast.error(err instanceof Error ? err.message : "Failed to play card");
//       setSelectedCard(null);
//     }
//   };

//   // Toasts the *acting player specifically* (not just the shared game feed
//   // line) when going out either wins or gets blocked by the wealth check ---
//   // so it's unambiguous that a forced draw-2 wasn't a bug.
//   const announceGoingOutResult = (
//     result:
//       | { outcome: "won"; myWealth: number; maxOtherWealth: number }
//       | { outcome: "blocked"; myWealth: number; maxOtherWealth: number }
//       | { outcome: "played" }
//       | undefined,
//   ) => {
//     if (!result) return;
//     if (result.outcome === "won") {
//       toast.success(
//         `🏆 You went out with $${result.myWealth.toLocaleString()} --- richest at the table. You win!`,
//       );
//     } else if (result.outcome === "blocked") {
//       toast.warning(
//         `Not rich enough to win! You had $${result.myWealth.toLocaleString()} vs $${result.maxOtherWealth.toLocaleString()} --- drew 2 cards and stayed in.`,
//       );
//     }
//   };

//   const handleColorChoice = async (color: string) => {
//     if (!pendingWildCard) return;
//     setShowColorPicker(false);
//     play("buttonClick");
//     try {
//       const result = await playCard({
//         roomId: room._id,
//         userId: currentUserId,
//         cardId: pendingWildCard,
//         chosenColor: color,
//       });
//       announceGoingOutResult(result);
//     } catch (err: unknown) {
//       toast.error(err instanceof Error ? err.message : "Failed to play card");
//     } finally {
//       setPendingWildCard(null);
//     }
//   };

//   const handleDraw = async () => {
//     if (!isMyTurn) {
//       toast.error("Not your turn!");
//       return;
//     }
//     play("cardDraw");
//     try {
//       await drawCard({ roomId: room._id, userId: currentUserId });
//     } catch (err: unknown) {
//       toast.error(err instanceof Error ? err.message : "Failed to draw");
//     }
//   };

//   // ── Property offer response ─────────────────────────────────────────────
//   const handlePropertyResponse = async (accept: boolean) => {
//     if (respondingProperty) return;
//     setRespondingProperty(true);
//     play("buttonClick");
//     try {
//       await respondProperty({
//         roomId: room._id,
//         userId: currentUserId,
//         accept,
//       });
//     } catch (err: unknown) {
//       toast.error(
//         err instanceof Error ? err.message : "Failed to respond to offer",
//       );
//     } finally {
//       setRespondingProperty(false);
//     }
//   };

//   // ── Life event acknowledgement ─────────────────────────────────────────
//   // The money was already applied the instant the card was drawn --- this
//   // just clears the queue so the "you got/owed $X" modal goes away.
//   const handleAcknowledgeLifeEvents = async () => {
//     if (acknowledgingLifeEvents) return;
//     setAcknowledgingLifeEvents(true);
//     play("buttonClick");
//     try {
//       await acknowledgeLifeEvents({ roomId: room._id, userId: currentUserId });
//     } catch (err: unknown) {
//       toast.error(err instanceof Error ? err.message : "Failed to dismiss");
//     } finally {
//       setAcknowledgingLifeEvents(false);
//     }
//   };

//   // ── Gamble stack: pull + acknowledge ────────────────────────────────────
//   // Purely elective, only available on your own turn, and never ends your
//   // turn --- you still have to play a card or draw from the main pile
//   // afterward to actually pass play.
//   const handlePullGamble = async () => {
//     if (!isMyTurn) {
//       toast.error("Not your turn!");
//       return;
//     }
//     if (hasUsedGambleThisTurn) {
//       toast.error("You've already tried your luck this turn!");
//       return;
//     }
//     if (pullingGamble) return;
//     setPullingGamble(true);
//     play("cardDraw");
//     try {
//       await drawGambleCard({ roomId: room._id, userId: currentUserId });
//     } catch (err: unknown) {
//       toast.error(
//         err instanceof Error ? err.message : "Failed to pull a gamble card",
//       );
//     } finally {
//       setPullingGamble(false);
//     }
//   };

//   const handleAcknowledgeGamble = async () => {
//     if (acknowledgingGamble) return;
//     setAcknowledgingGamble(true);
//     play("buttonClick");
//     try {
//       await acknowledgeGambleEvent({
//         roomId: room._id,
//         userId: currentUserId,
//       });
//     } catch (err: unknown) {
//       toast.error(err instanceof Error ? err.message : "Failed to dismiss");
//     } finally {
//       setAcknowledgingGamble(false);
//     }
//   };

//   // ── Drag handlers ────────────────────────────────────────────────────────
//   // Called when a draggable card is dropped onto the discard pile
//   const handleDiscardDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     setIsDragOver(false);
//     const cardId = e.dataTransfer.getData("cardId");
//     if (cardId) handleCardClick(cardId);
//   };

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault(); // required to allow drop
//     setIsDragOver(true);
//   };

//   const handleDragLeave = () => {
//     setIsDragOver(false);
//   };

//   // ── Render ─────────────────────────────────────────────────────────────
//   return (
//     <div
//       className="min-h-screen flex flex-col overflow-hidden relative"
//       style={!boardBg.src ? { background: TABLE_BG } : undefined}
//     >
//       {/* Background image layer */}
//       {boardBg.src && (
//         <img
//           src={boardBg.src}
//           alt=""
//           className="absolute inset-0 w-full h-full object-cover pointer-events-none"
//           style={{ zIndex: 0 }}
//         />
//       )}
//       {boardBg.src && boardBg.overlay && (
//         <div
//           className="absolute inset-0 pointer-events-none"
//           style={{ background: boardBg.overlay, zIndex: 1 }}
//         />
//       )}
//       <div
//         className="absolute inset-0 pointer-events-none"
//         style={{
//           backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
//           backgroundSize: "200px 200px",
//           zIndex: 2,
//         }}
//       />
//       <motion.div
//         className="absolute inset-0 pointer-events-none"
//         animate={{ opacity: [0.06, 0.12, 0.06] }}
//         transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
//         style={{
//           background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${currentGlow}, transparent)`,
//           zIndex: 3,
//         }}
//       />

//       {/* ── Header ──────────────────────────────────────────────────────── */}
//       <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
//         <button
//           className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all"
//           onClick={() => router.push("/lobby")}
//         >
//           <ArrowLeft size={13} /> Lobby
//         </button>
//         <div className="flex items-center gap-2">
//           <span className="text-sm font-bold text-white tracking-wide">
//             {room.name}
//           </span>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={toggleMute}
//             className="p-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all"
//           >
//             {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
//           </button>
//           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/20 bg-black/30 text-xs font-semibold text-white/70">
//             🃏 <span>{game.deck.length}</span>
//           </div>
//         </div>
//       </header>

//       {/* ── Video chat panel ──────────────────────────────────────────────── */}
//       <div className="relative z-20 px-4 pt-2">
//         <VideoLobby
//           roomId={String(room._id)}
//           userId={currentUserId}
//           userName={myName}
//           defaultCollapsed={true}
//         />
//       </div>

//       <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
//         {/* ── Opponents row ────────────────────────────────────────────────── */}
//         <div className="flex justify-center gap-6 pt-4 pb-2 px-4 flex-wrap">
//           {opponents.map((opp) => {
//             const isTheirTurn =
//               game.playerOrder[game.currentPlayerIndex] === opp.userId;
//             const oppHand = opp.hand ?? [];
//             return (
//               <motion.div
//                 key={opp.userId}
//                 className="flex flex-col items-center gap-2"
//                 animate={isTheirTurn ? { scale: [1, 1.03, 1] } : {}}
//                 transition={{
//                   duration: 1.2,
//                   repeat: isTheirTurn ? Infinity : 0,
//                 }}
//               >
//                 <motion.div
//                   className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border backdrop-blur-sm"
//                   animate={
//                     isTheirTurn
//                       ? {
//                           boxShadow: [
//                             "0 0 0px rgba(147,51,234,0)",
//                             "0 0 20px rgba(147,51,234,0.8)",
//                             "0 0 0px rgba(147,51,234,0)",
//                           ],
//                         }
//                       : {}
//                   }
//                   transition={{ duration: 1.5, repeat: Infinity }}
//                   style={{
//                     background: isTheirTurn
//                       ? "rgba(147,51,234,0.25)"
//                       : "rgba(0,0,0,0.3)",
//                     borderColor: isTheirTurn
//                       ? "#9333ea"
//                       : "rgba(255,255,255,0.15)",
//                     color: "white",
//                   }}
//                 >
//                   {isTheirTurn && (
//                     <motion.span
//                       className="w-1.5 h-1.5 rounded-full bg-purple-400"
//                       animate={{ opacity: [1, 0, 1] }}
//                       transition={{ duration: 0.8, repeat: Infinity }}
//                     />
//                   )}
//                   {opp.isBot ? "🤖" : "👤"} {opp.name}
//                   {richestUserId === opp.userId && (
//                     <span title="Wealthiest player">👑</span>
//                   )}
//                   <span className="px-1.5 py-0.5 rounded-full bg-white/20 font-bold text-[10px]">
//                     {oppHand.length}
//                   </span>
//                   <span
//                     className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-bold text-[10px]"
//                     title="Cash"
//                   >
//                     💰
//                     <AnimatedCash value={opp.money ?? 0} />
//                   </span>
//                   {(opp.properties ?? []).length > 0 && (
//                     <span
//                       className="px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold text-[10px]"
//                       title={(opp.properties ?? [])
//                         .map((p) => p.name)
//                         .join(", ")}
//                     >
//                       🏠{(opp.properties ?? []).length}
//                     </span>
//                   )}
//                 </motion.div>
//                 <div className="flex items-end" style={{ height: "3.6rem" }}>
//                   {Array.from({ length: Math.min(oppHand.length, 7) }).map(
//                     (_, i, arr) => {
//                       const mid = (arr.length - 1) / 2;
//                       const rotate = (i - mid) * 6;
//                       const translateY = Math.abs(i - mid) * 2;
//                       return (
//                         <div
//                           key={i}
//                           className="-ml-3 first:ml-0"
//                           style={{
//                             transform: `rotate(${rotate}deg) translateY(${translateY}px)`,
//                             transformOrigin: "bottom center",
//                           }}
//                         >
//                           <CardBack size="sm" />
//                         </div>
//                       );
//                     },
//                   )}
//                   {oppHand.length > 7 && (
//                     <div className="w-10 h-14 -ml-3 rounded-xl flex items-center justify-center text-[10px] font-bold bg-white/10 text-white/60 border border-white/20">
//                       +{oppHand.length - 7}
//                     </div>
//                   )}
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>

//         {/* ── Center game area ──────────────────────────────────────────── */}
//         <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-2">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={game.lastAction ?? "start"}
//               initial={{ opacity: 0, y: -8, scale: 0.95 }}
//               animate={{ opacity: 1, y: 0, scale: 1 }}
//               exit={{ opacity: 0, y: 8, scale: 0.95 }}
//               transition={{ duration: 0.25 }}
//               className="text-xs text-center px-4 py-2 rounded-xl max-w-sm border border-white/15 bg-black/30 backdrop-blur-sm text-white/70"
//             >
//               {game.lastAction ?? "Game started!"}
//             </motion.div>
//           </AnimatePresence>

//           <AnimatePresence mode="wait">
//             <motion.div
//               key={currentPlayerId}
//               initial={{ opacity: 0, scale: 0.85 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.85 }}
//               className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold backdrop-blur-sm"
//               style={{
//                 background: isMyTurn
//                   ? "rgba(147,51,234,0.2)"
//                   : "rgba(0,0,0,0.3)",
//                 borderColor: isMyTurn ? "#a855f7" : "rgba(255,255,255,0.2)",
//                 color: isMyTurn ? "#d8b4fe" : "rgba(255,255,255,0.7)",
//                 boxShadow: isMyTurn ? "0 0 24px rgba(147,51,234,0.4)" : "none",
//               }}
//             >
//               {isMyTurn ? (
//                 <>
//                   <motion.span
//                     animate={{ rotate: [0, -10, 10, 0] }}
//                     transition={{
//                       duration: 0.5,
//                       repeat: Infinity,
//                       repeatDelay: 2,
//                     }}
//                   >
//                     🎯
//                   </motion.span>
//                   Your turn!
//                   <Zap size={14} className="text-purple-400" />
//                 </>
//               ) : (
//                 <>⏳ {currentPlayerName}&apos;s turn</>
//               )}
//             </motion.div>
//           </AnimatePresence>

//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 border border-white/15 backdrop-blur-sm">
//               <span className="text-[10px] text-white/50 uppercase tracking-wider">
//                 Color
//               </span>
//               <motion.div
//                 className="w-4 h-4 rounded-full border-2 border-white/50"
//                 animate={{
//                   boxShadow: [
//                     `0 0 8px ${currentGlow}`,
//                     `0 0 20px ${currentGlow}`,
//                     `0 0 8px ${currentGlow}`,
//                   ],
//                 }}
//                 transition={{ duration: 2, repeat: Infinity }}
//                 style={{ background: currentHex }}
//               />
//               <span className="text-xs font-semibold capitalize text-white">
//                 {game.currentColor}
//               </span>
//             </div>
//             <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white/60 backdrop-blur-sm">
//               {game.direction === 1 ? "↻ CW" : "↺ CCW"}
//             </div>
//             <PaydayTracker
//               turnCount={game.turnCount ?? 0}
//               numPlayers={players.length}
//             />
//             {game.drawStack > 0 && (
//               <motion.div
//                 animate={{ scale: [1, 1.08, 1] }}
//                 transition={{ duration: 0.6, repeat: Infinity }}
//                 className="px-3 py-1.5 rounded-xl bg-red-900/50 border border-red-500/50 text-xs font-bold text-red-300 backdrop-blur-sm"
//               >
//                 +{game.drawStack} pending!
//               </motion.div>
//             )}
//           </div>

//           <div className="flex items-center gap-10">
//             {/* Draw pile */}
//             <div className="flex flex-col items-center gap-2">
//               <motion.div
//                 className={isMyTurn ? "cursor-pointer" : "cursor-default"}
//                 whileHover={isMyTurn ? { scale: 1.07, y: -4 } : undefined}
//                 whileTap={isMyTurn ? { scale: 0.94 } : undefined}
//                 onClick={isMyTurn ? handleDraw : undefined}
//                 style={{
//                   filter: isMyTurn
//                     ? "drop-shadow(0 6px 20px rgba(139,92,246,0.6))"
//                     : "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
//                 }}
//               >
//                 <div className="relative">
//                   <div className="absolute top-[3px] left-[2px] opacity-40">
//                     <CardBack size="lg" />
//                   </div>
//                   <div className="absolute top-[1.5px] left-[1px] opacity-65">
//                     <CardBack size="lg" />
//                   </div>
//                   <CardBack size="lg" />
//                 </div>
//               </motion.div>
//               <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
//                 {isMyTurn ? "Draw" : "Deck"}
//               </span>
//             </div>

//             {/* ── Discard pile --- also a drop target ──────────────────────── */}
//             <div className="flex flex-col items-center gap-2 mt-5">
//               <div
//                 ref={discardRef}
//                 onDrop={handleDiscardDrop}
//                 onDragOver={handleDragOver}
//                 onDragLeave={handleDragLeave}
//                 className="relative transition-transform duration-150"
//                 style={{
//                   // Expand hit area generously so drops on the edge register
//                   padding: "12px",
//                   margin: "-12px",
//                 }}
//               >
//                 {/* Drop target highlight ring */}
//                 <AnimatePresence>
//                   {isDragOver && isMyTurn && (
//                     <motion.div
//                       initial={{ opacity: 0, scale: 0.9 }}
//                       animate={{ opacity: 1, scale: 1 }}
//                       exit={{ opacity: 0, scale: 0.9 }}
//                       className="absolute inset-0 rounded-[28px] pointer-events-none z-10"
//                       style={{
//                         border: "2px dashed rgba(255,255,255,0.8)",
//                         boxShadow: "0 0 30px 8px rgba(255,255,255,0.25)",
//                       }}
//                     />
//                   )}
//                 </AnimatePresence>
//                 <motion.div
//                   className="absolute inset-[-6px] rounded-[20px] pointer-events-none"
//                   animate={{ opacity: [0.5, 1, 0.5] }}
//                   transition={{ duration: 2.5, repeat: Infinity }}
//                   style={{
//                     boxShadow: `0 0 30px 6px ${currentGlow}`,
//                     borderRadius: "20px",
//                   }}
//                 />
//                 <AnimatePresence mode="popLayout">
//                   <motion.div
//                     key={topCard}
//                     initial={{ scale: 0.6, opacity: 0, rotateY: 90, y: -20 }}
//                     animate={{ scale: 1, opacity: 1, rotateY: 0, y: 0 }}
//                     exit={{ scale: 0.8, opacity: 0, y: 10 }}
//                     transition={{ type: "spring", stiffness: 320, damping: 24 }}
//                     style={{ filter: `drop-shadow(0 8px 24px ${currentGlow})` }}
//                   >
//                     <UnoCard cardId={topCard} size="lg" index={0} />
//                   </motion.div>
//                 </AnimatePresence>
//               </div>
//               <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mt-3">
//                 Discard
//               </span>
//             </div>

//             {/* ── Gamble pile --- optional side stack, never ends your turn ── */}
//             <div className="flex flex-col items-center gap-2 mt-5">
//               <motion.div
//                 className={
//                   canPullGamble
//                     ? "cursor-pointer relative"
//                     : "relative opacity-60"
//                 }
//                 whileHover={canPullGamble ? { scale: 1.07, y: -4 } : undefined}
//                 whileTap={canPullGamble ? { scale: 0.94 } : undefined}
//                 onClick={canPullGamble ? handlePullGamble : undefined}
//                 style={{
//                   filter: canPullGamble
//                     ? "drop-shadow(0 6px 20px rgba(250,204,21,0.55))"
//                     : "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
//                 }}
//               >
//                 <div
//                   className="relative w-[5.2rem] h-[7.4rem] rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center gap-1"
//                   style={{
//                     background:
//                       "radial-gradient(ellipse at 38% 32%, #fef08a 0%, #facc15 26%, #ca8a04 55%, #713f12 82%, #1c0f02 100%)",
//                   }}
//                 >
//                   <Dices size={26} className="text-white drop-shadow" />
//                   <span className="text-[9px] font-black uppercase tracking-widest text-white/90">
//                     Gamble
//                   </span>
//                 </div>
//                 {canPullGamble && (
//                   <motion.div
//                     className="absolute inset-0 rounded-2xl pointer-events-none"
//                     animate={{ opacity: [0, 0.6, 0] }}
//                     transition={{
//                       duration: 1.8,
//                       repeat: Infinity,
//                       ease: "easeInOut",
//                     }}
//                     style={{
//                       background:
//                         "radial-gradient(ellipse at 50% 50%, rgba(250,204,21,0.6) 0%, transparent 72%)",
//                     }}
//                   />
//                 )}
//               </motion.div>
//               <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mt-3 text-center max-w-[6rem]">
//                 {!isMyTurn
//                   ? "Gamble"
//                   : hasUsedGambleThisTurn
//                     ? "Used this turn"
//                     : "Try your luck"}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* ── Player's hand ─────────────────────────────────────────────────── */}
//         <div
//           className="relative border-t border-white/10 bg-black/40 backdrop-blur-md px-4 pt-3 pb-4 overflow-visible"
//           style={{ boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}
//         >
//           <div className="flex items-center justify-between mb-3">
//             <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
//               Your Hand ({playerHand?.length ?? 0})
//             </span>
//             {/* Drag hint --- only shown on your turn */}
//             {isMyTurn && (playerHand?.length ?? 0) > 0 && (
//               <span className="text-[10px] text-white/30 italic">
//                 drag a card to the discard pile
//               </span>
//             )}
//             <AnimatePresence>
//               {playerHand?.length === 1 && (
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.7 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.7 }}
//                   className="px-3 py-1 rounded-full font-black text-xs tracking-widest"
//                   style={{
//                     background:
//                       "linear-gradient(90deg, #ff2d2d, #ffe835, #1fc95b, #2d8bff)",
//                     color: "white",
//                     textShadow: "0 1px 3px rgba(0,0,0,0.6)",
//                     boxShadow: "0 0 20px rgba(255,100,100,0.6)",
//                   }}
//                 >
//                   UNO! 🔥
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>

//           {/* ── Pre-play hint --- tells you BEFORE you commit whether going out
//               with your last card would actually win, or just draw you 2 and
//               keep you in the game. Avoids surprising forced-draw moments. ── */}
//           <AnimatePresence>
//             {isLastCard &&
//               playerHand &&
//               playerHand[0] &&
//               (() => {
//                 const { wouldWin, projectedWealth } = predictLastCardOutcome();
//                 return (
//                   <motion.div
//                     initial={{ opacity: 0, y: -4 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -4 }}
//                     className="mb-3 px-3 py-2 rounded-xl text-xs font-semibold text-center border"
//                     style={
//                       wouldWin
//                         ? {
//                             background: "rgba(34,197,94,0.15)",
//                             borderColor: "rgba(74,222,128,0.4)",
//                             color: "#86efac",
//                           }
//                         : {
//                             background: "rgba(234,179,8,0.15)",
//                             borderColor: "rgba(250,204,21,0.4)",
//                             color: "#fde68a",
//                           }
//                     }
//                   >
//                     {wouldWin
//                       ? `✅ Playing your last card wins it --- you'd have $${projectedWealth.toLocaleString()}, the most at the table.`
//                       : `⚠️ Not the richest yet ($${projectedWealth.toLocaleString()} vs $${maxOpponentWealth.toLocaleString()}) --- going out now means drawing 2 instead of winning.`}
//                   </motion.div>
//                 );
//               })()}
//           </AnimatePresence>

//           <div className="flex flex-wrap justify-center gap-1.5 max-h-44 overflow-visible pt-3 pb-1">
//             {playerHand?.map((cardId, i) => {
//               const playable =
//                 isMyTurn &&
//                 isCardPlayable(
//                   cardId,
//                   topCard,
//                   game.currentColor,
//                   game.drawStack,
//                 );
//               return (
//                 // Outer wrapper handles the HTML5 drag --- framer-motion's own
//                 // drag conflicts with the discard drop target, so we use the
//                 // native API here and keep framer-motion just for hover/tap.
//                 <div
//                   key={`${cardId}-${i}`}
//                   draggable={playable}
//                   onDragStart={(e) => {
//                     e.dataTransfer.setData("cardId", cardId);
//                     e.dataTransfer.effectAllowed = "move";
//                     setDraggingCard(cardId);
//                     // Clone the element at its natural (non-hovered) position for the ghost
//                     const el = e.currentTarget as HTMLElement;
//                     const clone = el.cloneNode(true) as HTMLElement;
//                     clone.style.position = "fixed";
//                     clone.style.top = "-9999px";
//                     clone.style.left = "-9999px";
//                     clone.style.transform = "none"; // strip framer-motion transforms
//                     clone.style.opacity = "1";
//                     document.body.appendChild(clone);
//                     e.dataTransfer.setDragImage(
//                       clone,
//                       el.offsetWidth / 2,
//                       el.offsetHeight / 2,
//                     );
//                     setTimeout(() => document.body.removeChild(clone), 0);
//                   }}
//                   onDragEnd={() => setDraggingCard(null)}
//                   style={{ cursor: playable ? "grab" : "default" }}
//                   className="active:cursor-grabbing"
//                 >
//                   <UnoCard
//                     cardId={cardId}
//                     size="md"
//                     isPlayable={playable && draggingCard !== cardId} // disable hover anim while dragging
//                     isSelected={selectedCard === cardId}
//                     onClick={() => handleCardClick(cardId)}
//                     index={i}
//                   />
//                 </div>
//               );
//             })}
//           </div>

//           {isMyTurn && game.drawStack > 0 && (
//             <motion.p
//               initial={{ opacity: 0, y: 4 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="text-center text-xs text-red-400 mt-2 font-semibold"
//             >
//               Play a matching +2 or +4, or draw {game.drawStack} cards!
//             </motion.p>
//           )}

//           {/* ── My Wallet & Properties --- cash + owned houses, below the hand ── */}
//           <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
//             <div
//               className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold backdrop-blur-sm"
//               style={{
//                 borderColor:
//                   richestUserId === currentUserId
//                     ? "#facc15"
//                     : "rgba(255,255,255,0.2)",
//                 background:
//                   richestUserId === currentUserId
//                     ? "rgba(250,204,21,0.15)"
//                     : "rgba(0,0,0,0.3)",
//                 color: richestUserId === currentUserId ? "#fde68a" : "white",
//               }}
//               title="Your cash"
//             >
//               {richestUserId === currentUserId ? "👑" : "💰"}{" "}
//               <AnimatedCash value={myMoney} />
//             </div>
//             {myProperties.length === 0 ? (
//               <span className="text-[11px] text-white/30 italic px-1">
//                 No properties yet
//               </span>
//             ) : (
//               myProperties.map((prop, i) => (
//                 <div
//                   key={`${prop.id}-${i}`}
//                   className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-[11px] font-semibold"
//                   title={`Bought for $${prop.price.toLocaleString()}`}
//                 >
//                   🏠 {prop.name}{" "}
//                   <span className="text-emerald-300/70">
//                     ${prop.value.toLocaleString()}
//                   </span>
//                 </div>
//               ))
//             )}
//             {myPropertyValue > 0 && (
//               <div className="px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold text-white/60">
//                 Total wealth: <AnimatedCash value={myMoney + myPropertyValue} />
//               </div>
//             )}
//             {/* ─── Rent additions ────────────────────────────────────────────
//                 2+ properties start earning rent (17% of combined purchase
//                 price) every payday, on top of salary. Shown only once it
//                 actually applies --- everything else here is unchanged. */}
//             {myProperties.length > 1 && (
//               <div
//                 className="px-2.5 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-[11px] font-semibold text-emerald-200"
//                 title="17% of your properties' combined purchase price, paid out every payday"
//               >
//                 🏠💰 Earning{" "}
//                 <AnimatedCash
//                   value={Math.round(
//                     myProperties.reduce((s, pr) => s + pr.price, 0) * 0.17,
//                   )}
//                   suffix="/wk rent"
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ── Wild color picker modal ──────────────────────────────────────── */}
//       <AnimatePresence>
//         {showColorPicker && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center"
//             style={{
//               background: "rgba(0,0,0,0.75)",
//               backdropFilter: "blur(8px)",
//             }}
//           >
//             <motion.div
//               initial={{ scale: 0.7, y: 30, opacity: 0 }}
//               animate={{ scale: 1, y: 0, opacity: 1 }}
//               exit={{ scale: 0.7, y: 30, opacity: 0 }}
//               transition={{ type: "spring", stiffness: 360, damping: 26 }}
//               className="p-7 rounded-3xl border border-white/20 text-center"
//               style={{
//                 background:
//                   "linear-gradient(145deg, rgba(30,15,60,0.97) 0%, rgba(15,10,40,0.97) 100%)",
//                 boxShadow:
//                   "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(139,92,246,0.3)",
//               }}
//             >
//               <h3 className="font-black text-2xl mb-1 text-white tracking-tight">
//                 Choose a Color
//               </h3>
//               <p className="text-white/40 text-xs mb-5 uppercase tracking-widest">
//                 Wild card played
//               </p>
//               <div className="grid grid-cols-2 gap-3">
//                 {COLOR_OPTIONS.map((color) => (
//                   <motion.button
//                     key={color}
//                     whileHover={{ scale: 1.06, y: -2 }}
//                     whileTap={{ scale: 0.94 }}
//                     className="w-28 h-24 rounded-2xl capitalize font-black text-white text-lg relative overflow-hidden"
//                     style={{
//                       background:
//                         color === "red"
//                           ? "linear-gradient(145deg, #ff2d2d, #8b0000)"
//                           : color === "blue"
//                             ? "linear-gradient(145deg, #2d8bff, #001e8b)"
//                             : color === "green"
//                               ? "linear-gradient(145deg, #1fc95b, #005220)"
//                               : "linear-gradient(145deg, #ffe835, #9b6f00)",
//                       boxShadow: `0 6px 24px ${COLOR_GLOW[color]}`,
//                       textShadow: "0 2px 6px rgba(0,0,0,0.5)",
//                     }}
//                     onClick={() => handleColorChoice(color)}
//                   >
//                     <div
//                       className="absolute inset-0 top-0 h-1/2 rounded-t-2xl"
//                       style={{
//                         background:
//                           "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
//                       }}
//                     />
//                     {color}
//                   </motion.button>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ── Property offer modal --- Accept/Decline ─────────────────────────── */}
//       <AnimatePresence>
//         {myPendingProperty && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center"
//             style={{
//               background: "rgba(0,0,0,0.75)",
//               backdropFilter: "blur(8px)",
//             }}
//           >
//             <motion.div
//               initial={{ scale: 0.7, y: 30, opacity: 0 }}
//               animate={{ scale: 1, y: 0, opacity: 1 }}
//               exit={{ scale: 0.7, y: 30, opacity: 0 }}
//               transition={{ type: "spring", stiffness: 360, damping: 26 }}
//               className="p-7 rounded-3xl border border-white/20 text-center max-w-xs"
//               style={{
//                 background:
//                   "linear-gradient(145deg, rgba(6,60,55,0.97) 0%, rgba(4,35,32,0.97) 100%)",
//                 boxShadow:
//                   "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(45,212,191,0.3)",
//               }}
//             >
//               <div className="text-5xl mb-2">🏠</div>
//               {myPendingPropertyQueueLength > 1 && (
//                 <p className="text-[10px] uppercase tracking-widest text-emerald-300/60 mb-1">
//                   Offer 1 of {myPendingPropertyQueueLength}
//                 </p>
//               )}
//               <h3 className="font-black text-2xl mb-1 text-white tracking-tight">
//                 You picked up: {myPendingProperty.name}
//               </h3>
//               <p className="text-white/60 text-sm mb-1">
//                 Price: ${myPendingProperty.price.toLocaleString()}
//               </p>
//               <p className="text-white/40 text-xs mb-5">
//                 Worth ${myPendingProperty.value.toLocaleString()} toward your
//                 total wealth if you buy it. You have ${myMoney.toLocaleString()}{" "}
//                 cash.
//               </p>
//               <div className="flex gap-3 justify-center">
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   disabled={respondingProperty}
//                   className="px-5 py-2.5 rounded-xl font-bold text-white disabled:opacity-50"
//                   style={{
//                     background: "linear-gradient(145deg, #2dd4bf, #0f766e)",
//                   }}
//                   onClick={() => handlePropertyResponse(true)}
//                 >
//                   Buy House
//                 </motion.button>
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   disabled={respondingProperty}
//                   className="px-5 py-2.5 rounded-xl font-bold text-white/80 border border-white/20 disabled:opacity-50"
//                   onClick={() => handlePropertyResponse(false)}
//                 >
//                   Decline
//                 </motion.button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ── Life event modal --- money card drawn, applied instantly ────────────── */}
//       <AnimatePresence>
//         {myPendingLifeEvents.length > 0 &&
//           (() => {
//             const totalDelta = myPendingLifeEvents.reduce(
//               (s, e) => s + e.amount,
//               0,
//             );
//             const isGain = totalDelta >= 0;
//             return (
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="fixed inset-0 z-50 flex items-center justify-center"
//                 style={{
//                   background: "rgba(0,0,0,0.75)",
//                   backdropFilter: "blur(8px)",
//                 }}
//               >
//                 <motion.div
//                   initial={{ scale: 0.7, y: 30, opacity: 0 }}
//                   animate={{ scale: 1, y: 0, opacity: 1 }}
//                   exit={{ scale: 0.7, y: 30, opacity: 0 }}
//                   transition={{ type: "spring", stiffness: 360, damping: 26 }}
//                   className="p-7 rounded-3xl border border-white/20 text-center max-w-xs"
//                   style={{
//                     background: isGain
//                       ? "linear-gradient(145deg, rgba(6,60,30,0.97) 0%, rgba(4,35,18,0.97) 100%)"
//                       : "linear-gradient(145deg, rgba(60,15,15,0.97) 0%, rgba(35,8,8,0.97) 100%)",
//                     boxShadow: isGain
//                       ? "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,197,94,0.3)"
//                       : "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.3)",
//                   }}
//                 >
//                   <div className="text-5xl mb-2">{isGain ? "💰" : "💸"}</div>
//                   <h3 className="font-black text-2xl mb-3 text-white tracking-tight">
//                     {isGain
//                       ? `You got $${totalDelta.toLocaleString()}!`
//                       : `You owe $${Math.abs(totalDelta).toLocaleString()}!`}
//                   </h3>
//                   <div className="flex flex-col gap-1.5 mb-5">
//                     {myPendingLifeEvents.map((e, i) => (
//                       <p
//                         key={`${e.id}-${i}`}
//                         className="text-xs text-white/60 flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-white/5"
//                       >
//                         <span>{e.label}</span>
//                         <span
//                           className={
//                             e.amount >= 0 ? "text-emerald-300" : "text-red-300"
//                           }
//                         >
//                           {e.amount >= 0 ? "+" : "-"}$
//                           {Math.abs(e.amount).toLocaleString()}
//                         </span>
//                       </p>
//                     ))}
//                   </div>
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     disabled={acknowledgingLifeEvents}
//                     className="px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50"
//                     style={{
//                       background: isGain
//                         ? "linear-gradient(145deg, #22c55e, #15803d)"
//                         : "linear-gradient(145deg, #ef4444, #991b1b)",
//                     }}
//                     onClick={handleAcknowledgeLifeEvents}
//                   >
//                     OK
//                   </motion.button>
//                 </motion.div>
//               </motion.div>
//             );
//           })()}
//       </AnimatePresence>

//       {/* ── Gamble result modal --- optional side-stack pull, applied instantly ── */}
//       <AnimatePresence>
//         {myPendingGambleEvent &&
//           (() => {
//             const g = myPendingGambleEvent;
//             const isGain = g.amount >= 0;
//             const heading = g.wipeOut
//               ? "You lost it all!"
//               : g.jackpot && isGain
//                 ? "JACKPOT!"
//                 : isGain
//                   ? `You won $${g.amount.toLocaleString()}!`
//                   : `You lost $${Math.abs(g.amount).toLocaleString()}!`;
//             return (
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="fixed inset-0 z-50 flex items-center justify-center"
//                 style={{
//                   background: "rgba(0,0,0,0.8)",
//                   backdropFilter: "blur(8px)",
//                 }}
//               >
//                 <motion.div
//                   initial={{ scale: 0.7, y: 30, opacity: 0 }}
//                   animate={{ scale: 1, y: 0, opacity: 1 }}
//                   exit={{ scale: 0.7, y: 30, opacity: 0 }}
//                   transition={{ type: "spring", stiffness: 360, damping: 26 }}
//                   className="p-7 rounded-3xl border border-white/20 text-center max-w-xs"
//                   style={{
//                     background: g.wipeOut
//                       ? "linear-gradient(145deg, rgba(60,10,10,0.97) 0%, rgba(30,4,4,0.97) 100%)"
//                       : g.jackpot
//                         ? "linear-gradient(145deg, rgba(60,50,6,0.97) 0%, rgba(35,28,4,0.97) 100%)"
//                         : isGain
//                           ? "linear-gradient(145deg, rgba(6,60,30,0.97) 0%, rgba(4,35,18,0.97) 100%)"
//                           : "linear-gradient(145deg, rgba(60,15,15,0.97) 0%, rgba(35,8,8,0.97) 100%)",
//                     boxShadow: g.wipeOut
//                       ? "0 30px 80px rgba(0,0,0,0.9), 0 0 70px rgba(239,68,68,0.5)"
//                       : g.jackpot
//                         ? "0 30px 80px rgba(0,0,0,0.8), 0 0 70px rgba(250,204,21,0.5)"
//                         : isGain
//                           ? "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,197,94,0.3)"
//                           : "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.3)",
//                   }}
//                 >
//                   <motion.div
//                     className="text-5xl mb-2"
//                     animate={
//                       g.wipeOut || g.jackpot
//                         ? { rotate: [0, -8, 8, -8, 0], scale: [1, 1.1, 1] }
//                         : {}
//                     }
//                     transition={{ duration: 0.6 }}
//                   >
//                     {g.wipeOut ? "💥" : g.jackpot ? "🎰" : isGain ? "🎲" : "🎲"}
//                   </motion.div>
//                   <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
//                     Gamble Stack --- {g.label}
//                   </p>
//                   <h3 className="font-black text-2xl mb-2 text-white tracking-tight">
//                     {heading}
//                   </h3>
//                   <p className="text-white/60 text-sm mb-5">{g.description}</p>
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     disabled={acknowledgingGamble}
//                     className="px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50"
//                     style={{
//                       background: g.wipeOut
//                         ? "linear-gradient(145deg, #ef4444, #991b1b)"
//                         : isGain
//                           ? "linear-gradient(145deg, #22c55e, #15803d)"
//                           : "linear-gradient(145deg, #ef4444, #991b1b)",
//                     }}
//                     onClick={handleAcknowledgeGamble}
//                   >
//                     OK
//                   </motion.button>
//                 </motion.div>
//               </motion.div>
//             );
//           })()}
//       </AnimatePresence>

//       {/* ── Salary modal --- payday every 8th turn (a 7-day week), $200 ─────────── */}
//       <AnimatePresence>
//         {salaryModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center"
//             style={{
//               background: "rgba(0,0,0,0.75)",
//               backdropFilter: "blur(8px)",
//             }}
//           >
//             <motion.div
//               initial={{ scale: 0.7, y: 30, opacity: 0 }}
//               animate={{ scale: 1, y: 0, opacity: 1 }}
//               exit={{ scale: 0.7, y: 30, opacity: 0 }}
//               transition={{ type: "spring", stiffness: 360, damping: 26 }}
//               className="p-7 rounded-3xl border border-white/20 text-center max-w-xs"
//               style={{
//                 background:
//                   "linear-gradient(145deg, rgba(60,50,6,0.97) 0%, rgba(35,28,4,0.97) 100%)",
//                 boxShadow:
//                   "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(250,204,21,0.3)",
//               }}
//             >
//               <div className="text-5xl mb-2">
//                 {salaryModal.rentAmount > 0 ? "💵🏠" : "💵"}
//               </div>
//               <h3 className="font-black text-2xl mb-1 text-white tracking-tight">
//                 You earned $
//                 {(salaryModal.amount + salaryModal.rentAmount).toLocaleString()}
//                 !
//               </h3>
//               {/* ─── Rent additions ─────────────────────────────────────────
//                   Only shown when the player's portfolio actually earned rent
//                   this payday (2+ properties owned) --- otherwise it's just
//                   the plain salary, unchanged from before. */}
//               {salaryModal.rentAmount > 0 && (
//                 <p className="text-xs text-emerald-300/80 mb-2 font-semibold">
//                   ${salaryModal.amount.toLocaleString()} salary + $
//                   {salaryModal.rentAmount.toLocaleString()} rent from your
//                   properties
//                 </p>
//               )}
//               {/* 7-days-of-the-week strip --- one pip per turn in the cycle */}
//               <div className="flex items-center justify-center gap-1.5 mb-4">
//                 {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
//                   <div
//                     key={i}
//                     className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
//                     style={{
//                       background:
//                         i === 6
//                           ? "linear-gradient(145deg, #facc15, #a16207)"
//                           : "rgba(255,255,255,0.1)",
//                       color: i === 6 ? "#3f2d00" : "rgba(255,255,255,0.4)",
//                     }}
//                   >
//                     {d}
//                   </div>
//                 ))}
//               </div>
//               <p className="text-white/50 text-xs mb-5">
//                 Another week&apos;s gone by at the table --- payday for everyone
//                 still playing!
//               </p>
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 className="px-6 py-2.5 rounded-xl font-bold text-white"
//                 style={{
//                   background: "linear-gradient(145deg, #facc15, #a16207)",
//                 }}
//                 onClick={() => setSalaryModal(null)}
//               >
//                 Nice!
//               </motion.button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  UnoCard,
  CardBack,
  parseCard,
  PROPERTY_UPGRADES_META,
} from "./UnoCard";
import { useRouter } from "next/navigation";
import { ArrowLeft, Volume2, VolumeX, Zap, Dices } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useBackground } from "../context/BackgroundContext";
import { useSoundManager } from "@/hooks/useSoundManager";
import { VideoLobby } from "./Videolobby";
import { PaydayTracker } from "./PaydayTracker";
import { AnimatedCash } from "./Animatedcash";

// ─── Interfaces ───────────────────────────────────────────────────────
interface Room {
  _id: Id<"rooms">;
  _creationTime: number;
  name: string;
  hostId: string;
  hostName: string;
  status: "waiting" | "playing" | "finished";
  maxPlayers: number;
  playerIds: string[];
  createdAt: number;
}

interface PropertyHolding {
  instanceId: string;
  id: string;
  name: string;
  price: number;
  value: number;
  invested: number;
  upgrades: string[];
}

interface PropertyOffer {
  id: string;
  name: string;
  price: number;
  value: number;
}

interface LifeEventHolding {
  id: string;
  label: string;
  amount: number;
}

// ─── Gamble stack addition ────────────────────────────────────────────
interface GambleEventHolding {
  id: string;
  label: string;
  description: string;
  amount: number;
  wipeOut: boolean;
  jackpot: boolean;
}

interface Player {
  _id: Id<"players">;
  _creationTime: number;
  roomId: Id<"rooms">;
  userId: string;
  name: string;
  avatarUrl?: string | undefined;
  isBot: boolean;
  isReady: boolean;
  isConnected: boolean;
  hand: string[];
  seatIndex: number;
  // ─── Monopoly-Uno additions ─────────────────────────────────────────
  money: number;
  properties: PropertyHolding[];
  // Queues, not single objects --- a forced multi-card draw can surface more
  // than one offer/event at once. Drawn cards resolve into these the
  // instant they leave the deck; they never sit in `hand`.
  pendingProperties?: PropertyOffer[] | undefined; // ← was PropertyHolding[]
  pendingLifeEvents?: LifeEventHolding[] | undefined;
  // ─── Gamble stack additions ─────────────────────────────────────────
  pendingGambleEvent?: GambleEventHolding | undefined;
  lastGambleTurn?: number | undefined;
}

interface Game {
  _id: Id<"games">;
  _creationTime: number;
  roomId: Id<"rooms">;
  deck: string[];
  discardPile: string[];
  currentColor: string;
  currentPlayerIndex: number;
  playerOrder: string[];
  direction: number;
  drawStack: number;
  lastAction?: string | undefined;
  winnerId?: string | undefined;
  status: "active" | "finished";
  createdAt: number;
  // ─── Monopoly-Uno additions ─────────────────────────────────────────
  turnCount?: number | undefined;
  salaryNotice?:
    | {
        turnCount: number;
        amount: number;
        at: number;
        // ─── Rent additions ──────────────────────────────────────────────
        // Rent collected this payday, keyed by userId --- everyone gets the
        // same flat salary, but rent varies per player depending on how
        // many properties they own, so it can't just be a single number.
        rentByPlayer?: Record<string, number> | undefined;
      }
    | undefined;
  // ─── Gamble stack additions ─────────────────────────────────────────
  gambleDeck?: string[] | undefined;
}

interface GameBoardProps {
  room: Room;
  game: Game;
  players: Player[];
  currentUserId: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function canPlayCard(
  card: string,
  topCard: string,
  currentColor: string,
): boolean {
  const { color, value } = parseCard(card);
  const { value: topValue } = parseCard(topCard);
  // Wild cards are wild-like: playable on any color or value. (Life/property
  // cards can never appear in a hand --- they resolve the instant they're
  // drawn --- so there's nothing to special-case for them here anymore.)
  if (color === "wild") return true;
  if (color === currentColor) return true;
  if (value === topValue) return true;
  return false;
}

function isCardPlayable(
  cardId: string,
  topCard: string,
  currentColor: string,
  drawStack: number,
): boolean {
  if (!canPlayCard(cardId, topCard, currentColor)) return false;
  if (drawStack > 0) {
    const { value } = parseCard(cardId);
    const { value: topValue } = parseCard(topCard);
    if (topValue === "draw2" && value !== "draw2") return false;
    if (topValue === "wild_draw4" && cardId !== "wild_draw4") return false;
    if (value === "wild") return false;
  }
  return true;
}

function wealthOf(p: Pick<Player, "money" | "properties">) {
  return (
    (p.money ?? 0) + (p.properties ?? []).reduce((s, pr) => s + pr.value, 0)
  );
}

const COLOR_OPTIONS = ["red", "blue", "green", "yellow"] as const;

const COLOR_HEX: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
};

const COLOR_GLOW: Record<string, string> = {
  red: "rgba(239,68,68,0.5)",
  blue: "rgba(59,130,246,0.5)",
  green: "rgba(34,197,94,0.5)",
  yellow: "rgba(234,179,8,0.5)",
};

const TABLE_BG =
  "radial-gradient(ellipse at 50% 40%, #1a4a2e 0%, #0f2d1c 45%, #091a10 100%)";

// ─── Component ────────────────────────────────────────────────────────────
export function GameBoard({
  room,
  game,
  players,
  currentUserId,
}: GameBoardProps) {
  const router = useRouter();
  const playCard = useMutation(api.game.playCard);
  const drawCard = useMutation(api.game.drawCard);
  const respondProperty = useMutation(api.game.respondProperty);
  const acknowledgeLifeEvents = useMutation(api.game.acknowledgeLifeEvents);
  // ─── Gamble stack additions ─────────────────────────────────────────
  const drawGambleCard = useMutation(api.game.drawGambleCard);
  const acknowledgeGambleEvent = useMutation(api.game.acknowledgeGambleEvent);

  const playerHand = useQuery(api.game.getPlayerHand, {
    roomId: room._id,
    userId: currentUserId,
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [respondingProperty, setRespondingProperty] = useState(false);
  const [acknowledgingLifeEvents, setAcknowledgingLifeEvents] = useState(false);
  // ─── Gamble stack additions ─────────────────────────────────────────
  const [pullingGamble, setPullingGamble] = useState(false);
  const [acknowledgingGamble, setAcknowledgingGamble] = useState(false);
  // ─── Salary modal now carries cashBefore/cashAfter so AnimatedCash can
  // count up live inside the modal instead of animating unseen behind it ──
  const [salaryModal, setSalaryModal] = useState<{
    turnCount: number;
    amount: number;
    rentAmount: number;
    cashBefore: number;
    cashAfter: number;
  } | null>(null);

  const { selected: boardBg } = useBackground();

  // Ref for the discard pile drop target
  const discardRef = useRef<HTMLDivElement>(null);

  // ── Sound ──────────────────────────────────────────────────────────────
  const { play, setMuted } = useSoundManager();
  const [muted, setMutedState] = useState(false);

  const [draggingCard, setDraggingCard] = useState<string | null>(null);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const prevIsMyTurn = useRef(false);
  const prevHandLength = useRef<number | null>(null);
  const prevGameStatus = useRef<string>("active");
  const dealPlayed = useRef(false);

  // ── Derived ────────────────────────────────────────────────────────────
  const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
  const isMyTurn = currentPlayerId === currentUserId;
  const topCard = game.discardPile[game.discardPile.length - 1];
  const opponents = players.filter((p) => p.userId !== currentUserId);
  const currentPlayerName =
    players.find((p) => p.userId === currentPlayerId)?.name ?? "Unknown";
  const currentGlow = COLOR_GLOW[game.currentColor] ?? "rgba(147,51,234,0.5)";
  const currentHex = COLOR_HEX[game.currentColor] ?? "#9333ea";

  const myPlayer = players.find((p) => p.userId === currentUserId);
  const myName = myPlayer?.name ?? "Player";
  const myMoney = myPlayer?.money ?? 0;
  const myPropertyValue = (myPlayer?.properties ?? []).reduce(
    (s, pr) => s + pr.value,
    0,
  );
  const myProperties = myPlayer?.properties ?? [];
  const myPendingProperty = myPlayer?.pendingProperties?.[0];
  const myPendingPropertyQueueLength = myPlayer?.pendingProperties?.length ?? 0;
  const myPendingLifeEvents = myPlayer?.pendingLifeEvents ?? [];
  // ─── Gamble stack additions ─────────────────────────────────────────
  const myPendingGambleEvent = myPlayer?.pendingGambleEvent;
  const hasUsedGambleThisTurn =
    (myPlayer?.lastGambleTurn ?? -1) === (game.turnCount ?? 0);
  const canPullGamble = isMyTurn && !hasUsedGambleThisTurn && !pullingGamble;

  const upgradeProperty = useMutation(api.game.upgradeProperty);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [upgrading, setUpgrading] = useState(false);

  // Derive live, not a stale snapshot — so the modal updates the instant
  // the mutation resolves and Convex refetches myProperties.
  const selectedProperty =
    myProperties.find((p) => p.instanceId === selectedPropertyId) ?? null;

  const handleUpgrade = async () => {
    if (!selectedProperty) return;
    setUpgrading(true);
    try {
      await upgradeProperty({
        roomId: room._id,
        userId: currentUserId,
        instanceId: selectedProperty.instanceId,
      });
      play("buttonClick");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't upgrade");
    } finally {
      setUpgrading(false);
    }
  };

  const richestUserId = players.length
    ? players.reduce((best, p) => (wealthOf(p) > wealthOf(best) ? p : best))
        .userId
    : null;

  const maxOpponentWealth = opponents.length
    ? Math.max(...opponents.map(wealthOf))
    : -Infinity;

  const isLastCard = (playerHand?.length ?? 0) === 1;

  // Predicts whether playing this specific card (your last one) would win
  // the game, so we can warn the player *before* they commit to it instead
  // of surprising them with a forced draw-2 afterward. Life/property cards
  // can never be your last hand card anymore (they resolve at draw time),
  // so this is just your current cash + property value.
  const predictLastCardOutcome = () => {
    const projectedWealth = myMoney + myPropertyValue;
    return {
      wouldWin: projectedWealth >= maxOpponentWealth,
      projectedWealth,
    };
  };

  // ── Sound effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (!dealPlayed.current && game.status === "active") {
      dealPlayed.current = true;
      setTimeout(() => play("cardDeal"), 300);
    }
  }, [game.status, play]);

  useEffect(() => {
    if (isMyTurn && !prevIsMyTurn.current) play("yourTurn");
    prevIsMyTurn.current = isMyTurn;
  }, [isMyTurn, play]);

  useEffect(() => {
    if (playerHand === undefined) return;
    if (
      prevHandLength.current !== null &&
      prevHandLength.current > 1 &&
      playerHand.length === 1
    ) {
      play("unoAlert");
    }
    prevHandLength.current = playerHand.length;
  }, [playerHand, play]);

  useEffect(() => {
    if (prevGameStatus.current !== "finished" && game.status === "finished") {
      play(game.winnerId === currentUserId ? "win" : "lose");
    }
    prevGameStatus.current = game.status;
  }, [game.status, game.winnerId, currentUserId, play]);

  // A 7-day week (turns 1-7), then payday on the 8th turn --- like next
  // Monday --- everyone gets paid a $200 "salary". The server stamps
  // salaryNotice.at with a fresh timestamp each time it happens, so this
  // just watches for that timestamp changing (not the raw presence of the
  // field, since it persists after the modal is dismissed) and pops the
  // modal exactly once per payout, for every player at the table at once.
  //
  // We also back out cashBefore (post-payday cash minus what was just
  // earned) so the modal can seed AnimatedCash's `from` and let it visibly
  // spring up to cashAfter — the animation was previously happening in the
  // wallet strip underneath the hand, hidden behind this modal.
  const lastSalaryAt = useRef<number | null>(game.salaryNotice?.at ?? null);
  useEffect(() => {
    const notice = game.salaryNotice;
    if (!notice) return;
    if (lastSalaryAt.current === notice.at) return;
    lastSalaryAt.current = notice.at;
    const rentAmount = notice.rentByPlayer?.[currentUserId] ?? 0;
    const cashAfter = myMoney;
    const cashBefore = cashAfter - notice.amount - rentAmount;
    setSalaryModal({
      turnCount: notice.turnCount,
      amount: notice.amount,
      rentAmount,
      cashBefore,
      cashAfter,
    });
    play("cardDeal");
  }, [game.salaryNotice, currentUserId, myMoney, play]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCardClick = async (cardId: string) => {
    if (!isMyTurn) {
      toast.error("Not your turn!");
      return;
    }
    // Use isCardPlayable instead of canPlayCard --- it enforces draw stack rules too
    if (!isCardPlayable(cardId, topCard, game.currentColor, game.drawStack)) {
      if (game.drawStack > 0) {
        const { value: topValue } = parseCard(topCard);
        if (topValue === "wild_draw4")
          toast.error("You must play a +4 or draw!");
        else toast.error("You must play a +2 or draw!");
      } else {
        toast.error("Can't play that card");
      }
      return;
    }

    const { value } = parseCard(cardId);
    if (value === "wild" || cardId === "wild_draw4") play("cardPlayWild");
    else play("cardPlay", parseCard(cardId).color);

    if (value === "wild" || cardId === "wild_draw4") {
      setPendingWildCard(cardId);
      setShowColorPicker(true);
      return;
    }

    try {
      setSelectedCard(cardId);
      const result = await playCard({
        roomId: room._id,
        userId: currentUserId,
        cardId,
      });
      announceGoingOutResult(result);
      setSelectedCard(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to play card");
      setSelectedCard(null);
    }
  };

  // Toasts the *acting player specifically* (not just the shared game feed
  // line) when going out either wins or gets blocked by the wealth check ---
  // so it's unambiguous that a forced draw-2 wasn't a bug.
  const announceGoingOutResult = (
    result:
      | { outcome: "won"; myWealth: number; maxOtherWealth: number }
      | { outcome: "blocked"; myWealth: number; maxOtherWealth: number }
      | { outcome: "played" }
      | undefined,
  ) => {
    if (!result) return;
    if (result.outcome === "won") {
      toast.success(
        `🏆 You went out with $${result.myWealth.toLocaleString()} --- richest at the table. You win!`,
      );
    } else if (result.outcome === "blocked") {
      toast.warning(
        `Not rich enough to win! You had $${result.myWealth.toLocaleString()} vs $${result.maxOtherWealth.toLocaleString()} --- drew 2 cards and stayed in.`,
      );
    }
  };

  const handleColorChoice = async (color: string) => {
    if (!pendingWildCard) return;
    setShowColorPicker(false);
    play("buttonClick");
    try {
      const result = await playCard({
        roomId: room._id,
        userId: currentUserId,
        cardId: pendingWildCard,
        chosenColor: color,
      });
      announceGoingOutResult(result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to play card");
    } finally {
      setPendingWildCard(null);
    }
  };

  const handleDraw = async () => {
    if (!isMyTurn) {
      toast.error("Not your turn!");
      return;
    }
    play("cardDraw");
    try {
      await drawCard({ roomId: room._id, userId: currentUserId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to draw");
    }
  };

  // ── Property offer response ─────────────────────────────────────────────
  const handlePropertyResponse = async (accept: boolean) => {
    if (respondingProperty) return;
    setRespondingProperty(true);
    play("buttonClick");
    try {
      await respondProperty({
        roomId: room._id,
        userId: currentUserId,
        accept,
      });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to respond to offer",
      );
    } finally {
      setRespondingProperty(false);
    }
  };

  // ── Life event acknowledgement ─────────────────────────────────────────
  // The money was already applied the instant the card was drawn --- this
  // just clears the queue so the "you got/owed $X" modal goes away.
  const handleAcknowledgeLifeEvents = async () => {
    if (acknowledgingLifeEvents) return;
    setAcknowledgingLifeEvents(true);
    play("buttonClick");
    try {
      await acknowledgeLifeEvents({ roomId: room._id, userId: currentUserId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to dismiss");
    } finally {
      setAcknowledgingLifeEvents(false);
    }
  };

  // ── Gamble stack: pull + acknowledge ────────────────────────────────────
  // Purely elective, only available on your own turn, and never ends your
  // turn --- you still have to play a card or draw from the main pile
  // afterward to actually pass play.
  const handlePullGamble = async () => {
    if (!isMyTurn) {
      toast.error("Not your turn!");
      return;
    }
    if (hasUsedGambleThisTurn) {
      toast.error("You've already tried your luck this turn!");
      return;
    }
    if (pullingGamble) return;
    setPullingGamble(true);
    play("cardDraw");
    try {
      await drawGambleCard({ roomId: room._id, userId: currentUserId });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to pull a gamble card",
      );
    } finally {
      setPullingGamble(false);
    }
  };

  const handleAcknowledgeGamble = async () => {
    if (acknowledgingGamble) return;
    setAcknowledgingGamble(true);
    play("buttonClick");
    try {
      await acknowledgeGambleEvent({
        roomId: room._id,
        userId: currentUserId,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to dismiss");
    } finally {
      setAcknowledgingGamble(false);
    }
  };

  // ── Drag handlers ────────────────────────────────────────────────────────
  // Called when a draggable card is dropped onto the discard pile
  const handleDiscardDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData("cardId");
    if (cardId) handleCardClick(cardId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // required to allow drop
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden relative"
      style={!boardBg.src ? { background: TABLE_BG } : undefined}
    >
      {/* Background image layer */}
      {boardBg.src && (
        <img
          src={boardBg.src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 0 }}
        />
      )}
      {boardBg.src && boardBg.overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: boardBg.overlay, zIndex: 1 }}
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          zIndex: 2,
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${currentGlow}, transparent)`,
          zIndex: 3,
        }}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <button
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all"
          onClick={() => router.push("/lobby")}
        >
          <ArrowLeft size={13} /> Lobby
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-wide">
            {room.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/20 bg-black/30 text-xs font-semibold text-white/70">
            🃏 <span>{game.deck.length}</span>
          </div>
        </div>
      </header>

      {/* ── Video chat panel ──────────────────────────────────────────────── */}
      <div className="relative z-20 px-4 pt-2">
        <VideoLobby
          roomId={String(room._id)}
          userId={currentUserId}
          userName={myName}
          defaultCollapsed={true}
        />
      </div>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* ── Opponents row ────────────────────────────────────────────────── */}
        <div className="flex justify-center gap-6 pt-4 pb-2 px-4 flex-wrap">
          {opponents.map((opp) => {
            const isTheirTurn =
              game.playerOrder[game.currentPlayerIndex] === opp.userId;
            const oppHand = opp.hand ?? [];
            return (
              <motion.div
                key={opp.userId}
                className="flex flex-col items-center gap-2"
                animate={isTheirTurn ? { scale: [1, 1.03, 1] } : {}}
                transition={{
                  duration: 1.2,
                  repeat: isTheirTurn ? Infinity : 0,
                }}
              >
                <motion.div
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border backdrop-blur-sm"
                  animate={
                    isTheirTurn
                      ? {
                          boxShadow: [
                            "0 0 0px rgba(147,51,234,0)",
                            "0 0 20px rgba(147,51,234,0.8)",
                            "0 0 0px rgba(147,51,234,0)",
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    background: isTheirTurn
                      ? "rgba(147,51,234,0.25)"
                      : "rgba(0,0,0,0.3)",
                    borderColor: isTheirTurn
                      ? "#9333ea"
                      : "rgba(255,255,255,0.15)",
                    color: "white",
                  }}
                >
                  {isTheirTurn && (
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-purple-400"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}
                  {opp.isBot ? "🤖" : "👤"} {opp.name}
                  {richestUserId === opp.userId && (
                    <span title="Wealthiest player">👑</span>
                  )}
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 font-bold text-[10px]">
                    {oppHand.length}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-bold text-[10px]"
                    title="Cash"
                  >
                    💰
                    <AnimatedCash value={opp.money ?? 0} />
                  </span>
                  {(opp.properties ?? []).length > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold text-[10px]"
                      title={(opp.properties ?? [])
                        .map((p) => p.name)
                        .join(", ")}
                    >
                      🏠{(opp.properties ?? []).length}
                    </span>
                  )}
                </motion.div>
                <div className="flex items-end" style={{ height: "3.6rem" }}>
                  {Array.from({ length: Math.min(oppHand.length, 7) }).map(
                    (_, i, arr) => {
                      const mid = (arr.length - 1) / 2;
                      const rotate = (i - mid) * 6;
                      const translateY = Math.abs(i - mid) * 2;
                      return (
                        <div
                          key={i}
                          className="-ml-3 first:ml-0"
                          style={{
                            transform: `rotate(${rotate}deg) translateY(${translateY}px)`,
                            transformOrigin: "bottom center",
                          }}
                        >
                          <CardBack size="sm" />
                        </div>
                      );
                    },
                  )}
                  {oppHand.length > 7 && (
                    <div className="w-10 h-14 -ml-3 rounded-xl flex items-center justify-center text-[10px] font-bold bg-white/10 text-white/60 border border-white/20">
                      +{oppHand.length - 7}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Center game area ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={game.lastAction ?? "start"}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-center px-4 py-2 rounded-xl max-w-sm border border-white/15 bg-black/30 backdrop-blur-sm text-white/70"
            >
              {game.lastAction ?? "Game started!"}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPlayerId}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold backdrop-blur-sm"
              style={{
                background: isMyTurn
                  ? "rgba(147,51,234,0.2)"
                  : "rgba(0,0,0,0.3)",
                borderColor: isMyTurn ? "#a855f7" : "rgba(255,255,255,0.2)",
                color: isMyTurn ? "#d8b4fe" : "rgba(255,255,255,0.7)",
                boxShadow: isMyTurn ? "0 0 24px rgba(147,51,234,0.4)" : "none",
              }}
            >
              {isMyTurn ? (
                <>
                  <motion.span
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    🎯
                  </motion.span>
                  Your turn!
                  <Zap size={14} className="text-purple-400" />
                </>
              ) : (
                <>⏳ {currentPlayerName}&apos;s turn</>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 border border-white/15 backdrop-blur-sm">
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                Color
              </span>
              <motion.div
                className="w-4 h-4 rounded-full border-2 border-white/50"
                animate={{
                  boxShadow: [
                    `0 0 8px ${currentGlow}`,
                    `0 0 20px ${currentGlow}`,
                    `0 0 8px ${currentGlow}`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ background: currentHex }}
              />
              <span className="text-xs font-semibold capitalize text-white">
                {game.currentColor}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white/60 backdrop-blur-sm">
              {game.direction === 1 ? "↻ CW" : "↺ CCW"}
            </div>
            <PaydayTracker
              turnCount={game.turnCount ?? 0}
              numPlayers={players.length}
            />
            {game.drawStack > 0 && (
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="px-3 py-1.5 rounded-xl bg-red-900/50 border border-red-500/50 text-xs font-bold text-red-300 backdrop-blur-sm"
              >
                +{game.drawStack} pending!
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-10">
            {/* Draw pile */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                className={isMyTurn ? "cursor-pointer" : "cursor-default"}
                whileHover={isMyTurn ? { scale: 1.07, y: -4 } : undefined}
                whileTap={isMyTurn ? { scale: 0.94 } : undefined}
                onClick={isMyTurn ? handleDraw : undefined}
                style={{
                  filter: isMyTurn
                    ? "drop-shadow(0 6px 20px rgba(139,92,246,0.6))"
                    : "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
                }}
              >
                <div className="relative">
                  <div className="absolute top-[3px] left-[2px] opacity-40">
                    <CardBack size="lg" />
                  </div>
                  <div className="absolute top-[1.5px] left-[1px] opacity-65">
                    <CardBack size="lg" />
                  </div>
                  <CardBack size="lg" />
                </div>
              </motion.div>
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                {isMyTurn ? "Draw" : "Deck"}
              </span>
            </div>

            {/* ── Discard pile --- also a drop target ──────────────────────── */}
            <div className="flex flex-col items-center gap-2 mt-5">
              <div
                ref={discardRef}
                onDrop={handleDiscardDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className="relative transition-transform duration-150"
                style={{
                  // Expand hit area generously so drops on the edge register
                  padding: "12px",
                  margin: "-12px",
                }}
              >
                {/* Drop target highlight ring */}
                <AnimatePresence>
                  {isDragOver && isMyTurn && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 rounded-[28px] pointer-events-none z-10"
                      style={{
                        border: "2px dashed rgba(255,255,255,0.8)",
                        boxShadow: "0 0 30px 8px rgba(255,255,255,0.25)",
                      }}
                    />
                  )}
                </AnimatePresence>
                <motion.div
                  className="absolute inset-[-6px] rounded-[20px] pointer-events-none"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{
                    boxShadow: `0 0 30px 6px ${currentGlow}`,
                    borderRadius: "20px",
                  }}
                />
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={topCard}
                    initial={{ scale: 0.6, opacity: 0, rotateY: 90, y: -20 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    style={{ filter: `drop-shadow(0 8px 24px ${currentGlow})` }}
                  >
                    <UnoCard cardId={topCard} size="lg" index={0} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mt-3">
                Discard
              </span>
            </div>

            {/* ── Gamble pile --- optional side stack, never ends your turn ── */}
            <div className="flex flex-col items-center gap-2 mt-5">
              <motion.div
                className={
                  canPullGamble
                    ? "cursor-pointer relative"
                    : "relative opacity-60"
                }
                whileHover={canPullGamble ? { scale: 1.07, y: -4 } : undefined}
                whileTap={canPullGamble ? { scale: 0.94 } : undefined}
                onClick={canPullGamble ? handlePullGamble : undefined}
                style={{
                  filter: canPullGamble
                    ? "drop-shadow(0 6px 20px rgba(250,204,21,0.55))"
                    : "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
                }}
              >
                <div
                  className="relative w-[5.2rem] h-[7.4rem] rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center gap-1"
                  style={{
                    background:
                      "radial-gradient(ellipse at 38% 32%, #fef08a 0%, #facc15 26%, #ca8a04 55%, #713f12 82%, #1c0f02 100%)",
                  }}
                >
                  <Dices size={26} className="text-white drop-shadow" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/90">
                    Gamble
                  </span>
                </div>
                {canPullGamble && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 50%, rgba(250,204,21,0.6) 0%, transparent 72%)",
                    }}
                  />
                )}
              </motion.div>
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mt-3 text-center max-w-[6rem]">
                {!isMyTurn
                  ? "Gamble"
                  : hasUsedGambleThisTurn
                    ? "Used this turn"
                    : "Try your luck"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Player's hand ─────────────────────────────────────────────────── */}
        <div
          className="relative border-t border-white/10 bg-black/40 backdrop-blur-md px-4 pt-3 pb-4 overflow-visible"
          style={{ boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Your Hand ({playerHand?.length ?? 0})
            </span>
            {/* Drag hint --- only shown on your turn */}
            {isMyTurn && (playerHand?.length ?? 0) > 0 && (
              <span className="text-[10px] text-white/30 italic">
                drag a card to the discard pile
              </span>
            )}
            <AnimatePresence>
              {playerHand?.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="px-3 py-1 rounded-full font-black text-xs tracking-widest"
                  style={{
                    background:
                      "linear-gradient(90deg, #ff2d2d, #ffe835, #1fc95b, #2d8bff)",
                    color: "white",
                    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                    boxShadow: "0 0 20px rgba(255,100,100,0.6)",
                  }}
                >
                  UNO! 🔥
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Pre-play hint --- tells you BEFORE you commit whether going out
              with your last card would actually win, or just draw you 2 and
              keep you in the game. Avoids surprising forced-draw moments. ── */}
          <AnimatePresence>
            {isLastCard &&
              playerHand &&
              playerHand[0] &&
              (() => {
                const { wouldWin, projectedWealth } = predictLastCardOutcome();
                return (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mb-3 px-3 py-2 rounded-xl text-xs font-semibold text-center border"
                    style={
                      wouldWin
                        ? {
                            background: "rgba(34,197,94,0.15)",
                            borderColor: "rgba(74,222,128,0.4)",
                            color: "#86efac",
                          }
                        : {
                            background: "rgba(234,179,8,0.15)",
                            borderColor: "rgba(250,204,21,0.4)",
                            color: "#fde68a",
                          }
                    }
                  >
                    {wouldWin
                      ? `✅ Playing your last card wins it --- you'd have $${projectedWealth.toLocaleString()}, the most at the table.`
                      : `⚠️ Not the richest yet ($${projectedWealth.toLocaleString()} vs $${maxOpponentWealth.toLocaleString()}) --- going out now means drawing 2 instead of winning.`}
                  </motion.div>
                );
              })()}
          </AnimatePresence>

          <div className="flex flex-wrap justify-center gap-1.5 max-h-44 overflow-visible pt-3 pb-1">
            {playerHand?.map((cardId, i) => {
              const playable =
                isMyTurn &&
                isCardPlayable(
                  cardId,
                  topCard,
                  game.currentColor,
                  game.drawStack,
                );
              return (
                // Outer wrapper handles the HTML5 drag --- framer-motion's own
                // drag conflicts with the discard drop target, so we use the
                // native API here and keep framer-motion just for hover/tap.
                <div
                  key={`${cardId}-${i}`}
                  draggable={playable}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("cardId", cardId);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingCard(cardId);
                    // Clone the element at its natural (non-hovered) position for the ghost
                    const el = e.currentTarget as HTMLElement;
                    const clone = el.cloneNode(true) as HTMLElement;
                    clone.style.position = "fixed";
                    clone.style.top = "-9999px";
                    clone.style.left = "-9999px";
                    clone.style.transform = "none"; // strip framer-motion transforms
                    clone.style.opacity = "1";
                    document.body.appendChild(clone);
                    e.dataTransfer.setDragImage(
                      clone,
                      el.offsetWidth / 2,
                      el.offsetHeight / 2,
                    );
                    setTimeout(() => document.body.removeChild(clone), 0);
                  }}
                  onDragEnd={() => setDraggingCard(null)}
                  style={{ cursor: playable ? "grab" : "default" }}
                  className="active:cursor-grabbing"
                >
                  <UnoCard
                    cardId={cardId}
                    size="md"
                    isPlayable={playable && draggingCard !== cardId} // disable hover anim while dragging
                    isSelected={selectedCard === cardId}
                    onClick={() => handleCardClick(cardId)}
                    index={i}
                  />
                </div>
              );
            })}
          </div>

          {isMyTurn && game.drawStack > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs text-red-400 mt-2 font-semibold"
            >
              Play a matching +2 or +4, or draw {game.drawStack} cards!
            </motion.p>
          )}

          {/* ── My Wallet & Properties --- cash + owned houses, below the hand ── */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold backdrop-blur-sm"
              style={{
                borderColor:
                  richestUserId === currentUserId
                    ? "#facc15"
                    : "rgba(255,255,255,0.2)",
                background:
                  richestUserId === currentUserId
                    ? "rgba(250,204,21,0.15)"
                    : "rgba(0,0,0,0.3)",
                color: richestUserId === currentUserId ? "#fde68a" : "white",
              }}
              title="Your cash"
            >
              {richestUserId === currentUserId ? "👑" : "💰"}{" "}
              <AnimatedCash value={myMoney} />
            </div>
            {myProperties.length === 0 ? (
              <span className="text-[11px] text-white/30 italic px-1">
                No properties yet
              </span>
            ) : (
              myProperties.map((prop) => (
                <button
                  key={prop.instanceId}
                  onClick={() => setSelectedPropertyId(prop.instanceId)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-[11px] font-semibold hover:bg-emerald-400/20 hover:border-emerald-400/50 transition-all cursor-pointer"
                  title={`Bought for $${prop.price.toLocaleString()} · click to view & upgrade`}
                >
                  🏠 {prop.name}{" "}
                  <span className="text-emerald-300/70">
                    ${prop.value.toLocaleString()}
                  </span>
                  {prop.upgrades.length > 0 && (
                    <span className="text-emerald-300/50">
                      +{prop.upgrades.length}
                    </span>
                  )}
                </button>
              ))
            )}
            {myPropertyValue > 0 && (
              <div className="px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold text-white/60">
                Total wealth: <AnimatedCash value={myMoney + myPropertyValue} />
              </div>
            )}
            {/* ─── Rent additions ────────────────────────────────────────────
                2+ properties start earning rent (17% of combined purchase
                price) every payday, on top of salary. Shown only once it
                actually applies --- everything else here is unchanged. */}
            {myProperties.length > 1 && (
              <div
                className="px-2.5 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-[11px] font-semibold text-emerald-200"
                title="17% of your properties' combined purchase price, paid out every payday"
              >
                🏠💰 Earning{" "}
                <AnimatedCash
                  value={Math.round(
                    myProperties.reduce((s, pr) => s + pr.price, 0) * 0.17,
                  )}
                  suffix="/wk rent"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Wild color picker modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.7, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="p-7 rounded-3xl border border-white/20 text-center"
              style={{
                background:
                  "linear-gradient(145deg, rgba(30,15,60,0.97) 0%, rgba(15,10,40,0.97) 100%)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(139,92,246,0.3)",
              }}
            >
              <h3 className="font-black text-2xl mb-1 text-white tracking-tight">
                Choose a Color
              </h3>
              <p className="text-white/40 text-xs mb-5 uppercase tracking-widest">
                Wild card played
              </p>
              <div className="grid grid-cols-2 gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    className="w-28 h-24 rounded-2xl capitalize font-black text-white text-lg relative overflow-hidden"
                    style={{
                      background:
                        color === "red"
                          ? "linear-gradient(145deg, #ff2d2d, #8b0000)"
                          : color === "blue"
                            ? "linear-gradient(145deg, #2d8bff, #001e8b)"
                            : color === "green"
                              ? "linear-gradient(145deg, #1fc95b, #005220)"
                              : "linear-gradient(145deg, #ffe835, #9b6f00)",
                      boxShadow: `0 6px 24px ${COLOR_GLOW[color]}`,
                      textShadow: "0 2px 6px rgba(0,0,0,0.5)",
                    }}
                    onClick={() => handleColorChoice(color)}
                  >
                    <div
                      className="absolute inset-0 top-0 h-1/2 rounded-t-2xl"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                      }}
                    />
                    {color}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Property offer modal --- Accept/Decline ─────────────────────────── */}
      <AnimatePresence>
        {myPendingProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.7, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="p-7 rounded-3xl border border-white/20 text-center max-w-xs"
              style={{
                background:
                  "linear-gradient(145deg, rgba(6,60,55,0.97) 0%, rgba(4,35,32,0.97) 100%)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(45,212,191,0.3)",
              }}
            >
              <div className="text-5xl mb-2">🏠</div>
              {myPendingPropertyQueueLength > 1 && (
                <p className="text-[10px] uppercase tracking-widest text-emerald-300/60 mb-1">
                  Offer 1 of {myPendingPropertyQueueLength}
                </p>
              )}
              <h3 className="font-black text-2xl mb-1 text-white tracking-tight">
                You picked up: {myPendingProperty.name}
              </h3>
              <p className="text-white/60 text-sm mb-1">
                Price: ${myPendingProperty.price.toLocaleString()}
              </p>
              <p className="text-white/40 text-xs mb-5">
                Worth ${myPendingProperty.value.toLocaleString()} toward your
                total wealth if you buy it. You have ${myMoney.toLocaleString()}{" "}
                cash.
              </p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={respondingProperty}
                  className="px-5 py-2.5 rounded-xl font-bold text-white disabled:opacity-50"
                  style={{
                    background: "linear-gradient(145deg, #2dd4bf, #0f766e)",
                  }}
                  onClick={() => handlePropertyResponse(true)}
                >
                  Buy House
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={respondingProperty}
                  className="px-5 py-2.5 rounded-xl font-bold text-white/80 border border-white/20 disabled:opacity-50"
                  onClick={() => handlePropertyResponse(false)}
                >
                  Decline
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Property upgrade modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setSelectedPropertyId(null)}
          >
            <motion.div
              initial={{ scale: 0.7, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="p-7 rounded-3xl border border-white/20 text-center max-w-sm w-full"
              style={{
                background:
                  "linear-gradient(145deg, rgba(6,60,55,0.97) 0%, rgba(4,35,32,0.97) 100%)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(45,212,191,0.3)",
              }}
            >
              <div className="text-5xl mb-2">🏠</div>
              <h3 className="font-black text-2xl mb-1 text-white tracking-tight">
                {selectedProperty.name}
              </h3>
              <p className="text-white/60 text-sm mb-1">
                Bought for ${selectedProperty.price.toLocaleString()}
              </p>
              <p className="text-emerald-300 font-bold text-lg mb-4">
                Worth ${selectedProperty.value.toLocaleString()}
              </p>

              {selectedProperty.upgrades.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  {selectedProperty.upgrades.map((upId) => {
                    const meta = PROPERTY_UPGRADES_META.find(
                      (u) => u.id === upId,
                    );
                    return (
                      <span
                        key={upId}
                        className="text-[10px] px-2 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-200"
                      >
                        {meta?.emoji} {meta?.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {(() => {
                const nextUpgrade =
                  PROPERTY_UPGRADES_META[selectedProperty.upgrades.length];
                if (!nextUpgrade) {
                  return (
                    <p className="text-white/40 text-xs mb-2">
                      Fully upgraded — nothing left to add here.
                    </p>
                  );
                }
                const cost = Math.round(
                  selectedProperty.price * nextUpgrade.costMultiplier,
                );
                const valueGain = Math.round(
                  selectedProperty.price * nextUpgrade.valueMultiplier,
                );
                const canAfford = myMoney >= cost;
                return (
                  <div className="mb-2 p-4 rounded-2xl border border-white/10 bg-black/20 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{nextUpgrade.emoji}</span>
                      <span className="font-bold text-white text-sm">
                        {nextUpgrade.label}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs mb-3">
                      {nextUpgrade.description}
                    </p>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-white/60">
                        Cost:{" "}
                        <span className="text-white font-semibold">
                          ${cost.toLocaleString()}
                        </span>
                      </span>
                      <span className="text-emerald-300">
                        +${valueGain.toLocaleString()} value
                      </span>
                    </div>
                    <motion.button
                      whileHover={canAfford ? { scale: 1.03 } : undefined}
                      whileTap={canAfford ? { scale: 0.97 } : undefined}
                      disabled={!canAfford || upgrading}
                      onClick={handleUpgrade}
                      className="w-full py-2.5 rounded-xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(145deg, #2dd4bf, #0f766e)",
                      }}
                    >
                      {upgrading
                        ? "Upgrading…"
                        : canAfford
                          ? `Add ${nextUpgrade.label}`
                          : `Need $${(cost - myMoney).toLocaleString()} more`}
                    </motion.button>
                  </div>
                );
              })()}

              <button
                onClick={() => setSelectedPropertyId(null)}
                className="mt-2 text-white/50 text-xs hover:text-white/80 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Life event modal --- money card drawn, applied instantly ────────────── */}
      <AnimatePresence>
        {myPendingLifeEvents.length > 0 &&
          (() => {
            const totalDelta = myPendingLifeEvents.reduce(
              (s, e) => s + e.amount,
              0,
            );
            const isGain = totalDelta >= 0;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <motion.div
                  initial={{ scale: 0.7, y: 30, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.7, y: 30, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 360, damping: 26 }}
                  className="p-7 rounded-3xl border border-white/20 text-center max-w-xs"
                  style={{
                    background: isGain
                      ? "linear-gradient(145deg, rgba(6,60,30,0.97) 0%, rgba(4,35,18,0.97) 100%)"
                      : "linear-gradient(145deg, rgba(60,15,15,0.97) 0%, rgba(35,8,8,0.97) 100%)",
                    boxShadow: isGain
                      ? "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,197,94,0.3)"
                      : "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.3)",
                  }}
                >
                  <div className="text-5xl mb-2">{isGain ? "💰" : "💸"}</div>
                  <h3 className="font-black text-2xl mb-3 text-white tracking-tight">
                    {isGain
                      ? `You got $${totalDelta.toLocaleString()}!`
                      : `You owe $${Math.abs(totalDelta).toLocaleString()}!`}
                  </h3>
                  <div className="flex flex-col gap-1.5 mb-5">
                    {myPendingLifeEvents.map((e, i) => (
                      <p
                        key={`${e.id}-${i}`}
                        className="text-xs text-white/60 flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-white/5"
                      >
                        <span>{e.label}</span>
                        <span
                          className={
                            e.amount >= 0 ? "text-emerald-300" : "text-red-300"
                          }
                        >
                          {e.amount >= 0 ? "+" : "-"}$
                          {Math.abs(e.amount).toLocaleString()}
                        </span>
                      </p>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={acknowledgingLifeEvents}
                    className="px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50"
                    style={{
                      background: isGain
                        ? "linear-gradient(145deg, #22c55e, #15803d)"
                        : "linear-gradient(145deg, #ef4444, #991b1b)",
                    }}
                    onClick={handleAcknowledgeLifeEvents}
                  >
                    OK
                  </motion.button>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* ── Gamble result modal --- optional side-stack pull, applied instantly ── */}
      <AnimatePresence>
        {myPendingGambleEvent &&
          (() => {
            const g = myPendingGambleEvent;
            const isGain = g.amount >= 0;
            const heading = g.wipeOut
              ? "You lost it all!"
              : g.jackpot && isGain
                ? "JACKPOT!"
                : isGain
                  ? `You won $${g.amount.toLocaleString()}!`
                  : `You lost $${Math.abs(g.amount).toLocaleString()}!`;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <motion.div
                  initial={{ scale: 0.7, y: 30, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.7, y: 30, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 360, damping: 26 }}
                  className="p-7 rounded-3xl border border-white/20 text-center max-w-xs"
                  style={{
                    background: g.wipeOut
                      ? "linear-gradient(145deg, rgba(60,10,10,0.97) 0%, rgba(30,4,4,0.97) 100%)"
                      : g.jackpot
                        ? "linear-gradient(145deg, rgba(60,50,6,0.97) 0%, rgba(35,28,4,0.97) 100%)"
                        : isGain
                          ? "linear-gradient(145deg, rgba(6,60,30,0.97) 0%, rgba(4,35,18,0.97) 100%)"
                          : "linear-gradient(145deg, rgba(60,15,15,0.97) 0%, rgba(35,8,8,0.97) 100%)",
                    boxShadow: g.wipeOut
                      ? "0 30px 80px rgba(0,0,0,0.9), 0 0 70px rgba(239,68,68,0.5)"
                      : g.jackpot
                        ? "0 30px 80px rgba(0,0,0,0.8), 0 0 70px rgba(250,204,21,0.5)"
                        : isGain
                          ? "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,197,94,0.3)"
                          : "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.3)",
                  }}
                >
                  <motion.div
                    className="text-5xl mb-2"
                    animate={
                      g.wipeOut || g.jackpot
                        ? { rotate: [0, -8, 8, -8, 0], scale: [1, 1.1, 1] }
                        : {}
                    }
                    transition={{ duration: 0.6 }}
                  >
                    {g.wipeOut ? "💥" : g.jackpot ? "🎰" : isGain ? "🎲" : "🎲"}
                  </motion.div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Gamble Stack --- {g.label}
                  </p>
                  <h3 className="font-black text-2xl mb-2 text-white tracking-tight">
                    {heading}
                  </h3>
                  <p className="text-white/60 text-sm mb-5">{g.description}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={acknowledgingGamble}
                    className="px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50"
                    style={{
                      background: g.wipeOut
                        ? "linear-gradient(145deg, #ef4444, #991b1b)"
                        : isGain
                          ? "linear-gradient(145deg, #22c55e, #15803d)"
                          : "linear-gradient(145deg, #ef4444, #991b1b)",
                    }}
                    onClick={handleAcknowledgeGamble}
                  >
                    OK
                  </motion.button>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* ── Salary modal --- payday every 8th turn (a 7-day week), $200 ─────────── */}
      <AnimatePresence>
        {salaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.7, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="p-7 rounded-3xl border border-white/20 text-center max-w-xs"
              style={{
                background:
                  "linear-gradient(145deg, rgba(60,50,6,0.97) 0%, rgba(35,28,4,0.97) 100%)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(250,204,21,0.3)",
              }}
            >
              <div className="text-5xl mb-2">
                {salaryModal.rentAmount > 0 ? "💵🏠" : "💵"}
              </div>
              <h3 className="font-black text-2xl mb-1 text-white tracking-tight">
                You earned $
                {(salaryModal.amount + salaryModal.rentAmount).toLocaleString()}
                !
              </h3>
              {/* ─── Rent additions ─────────────────────────────────────────
                  Only shown when the player's portfolio actually earned rent
                  this payday (2+ properties owned) --- otherwise it's just
                  the plain salary, unchanged from before. */}
              {salaryModal.rentAmount > 0 && (
                <p className="text-xs text-emerald-300/80 mb-2 font-semibold">
                  ${salaryModal.amount.toLocaleString()} salary + $
                  {salaryModal.rentAmount.toLocaleString()} rent from your
                  properties
                </p>
              )}
              {/* ─── Animated wallet total ─────────────────────────────────
                  The whole point of this fix: count up from pre-payday cash
                  to post-payday cash right here in the modal, since the
                  wallet strip underneath the hand is hidden behind it while
                  this is open. Small delay lets the modal finish popping in
                  before the count-up starts. */}
              <div className="flex items-center justify-center gap-1.5 mb-3 px-4 py-2 rounded-xl bg-black/20 border border-yellow-400/20">
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  Your cash
                </span>
                <AnimatedCash
                  value={salaryModal.cashAfter}
                  from={salaryModal.cashBefore}
                  delay={250}
                  className="text-lg font-black text-yellow-200"
                />
              </div>
              {/* 7-days-of-the-week strip --- one pip per turn in the cycle */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background:
                        i === 6
                          ? "linear-gradient(145deg, #facc15, #a16207)"
                          : "rgba(255,255,255,0.1)",
                      color: i === 6 ? "#3f2d00" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <p className="text-white/50 text-xs mb-5">
                Another week&apos;s gone by at the table --- payday for everyone
                still playing!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 rounded-xl font-bold text-white"
                style={{
                  background: "linear-gradient(145deg, #facc15, #a16207)",
                }}
                onClick={() => setSalaryModal(null)}
              >
                Nice!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

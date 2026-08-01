// "use client";

// import { useMutation, useQuery } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import { toast } from "sonner";
// import { PropertyIcon } from "./PropertyIcon";
// import { PropertyMediaHeader } from "./PropertyMediaHeader";
// import { motion } from "framer-motion";
// import { useState, useEffect, useRef, useMemo } from "react";
// import { ConfettiBurst } from "./Confetti";

// interface PropertyHolding {
//   instanceId: string;
//   id: string;
//   name: string;
//   price: number;
//   value: number;
//   invested: number;
//   upgrades: string[];
// }

// interface TradeablePlayer {
//   userId: string;
//   name: string;
//   money: number;
//   properties: PropertyHolding[];
// }

// // ─── Propose-trade modal ─────────────────────────────────────────────────
// // Opened per-opponent (e.g. a "🤝 Trade" button next to their name in
// // Gameboard.tsx). Lets the current player pick properties + cash to offer,
// // and properties + cash to request back, then sends the offer to Convex.
// export function TradeModal({
//   roomId,
//   me,
//   opponent,
//   onClose,
//   onSent,
//   initialOfferPropertyId,
// }: {
//   roomId: Id<"rooms">;
//   me: TradeablePlayer;
//   opponent: TradeablePlayer;
//   onClose: () => void;
//   // Fired right after a successful send, with the new trade's id, so the
//   // caller can pop up the "waiting on them..." OutgoingOfferPopup.
//   onSent?: (tradeId: Id<"trades">) => void;
//   // When set (e.g. opened via a property card's "Offer to opponents" button
//   // instead of the generic per-opponent "🤝 Trade" button), this property
//   // starts pre-checked in the "You give" column so the person doesn't have
//   // to hunt for it again.
//   initialOfferPropertyId?: string | null;
// }) {
//   const proposeTrade = useMutation(api.trades.proposeTrade);
//   const [offerIds, setOfferIds] = useState<string[]>(
//     initialOfferPropertyId ? [initialOfferPropertyId] : [],
//   );
//   const [requestIds, setRequestIds] = useState<string[]>([]);
//   const [offerCash, setOfferCash] = useState(0);
//   const [requestCash, setRequestCash] = useState(0);
//   const [sending, setSending] = useState(false);

//   const toggle = (list: string[], set: (v: string[]) => void, id: string) => {
//     set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
//   };

//   const canSend =
//     (offerIds.length > 0 ||
//       requestIds.length > 0 ||
//       offerCash > 0 ||
//       requestCash > 0) &&
//     offerCash <= me.money &&
//     requestCash <= opponent.money;

//   const send = async () => {
//     setSending(true);
//     try {
//       const tradeId = await proposeTrade({
//         roomId,
//         fromUserId: me.userId,
//         toUserId: opponent.userId,
//         offerPropertyIds: offerIds,
//         offerCash,
//         requestPropertyIds: requestIds,
//         requestCash,
//       });
//       onSent?.(tradeId);
//       toast.success(`Trade offer sent to ${opponent.name}!`);
//       onClose();
//     } catch (e: unknown) {
//       toast.error(e instanceof Error ? e.message : "Couldn't send trade");
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
//       <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900 p-5 text-white shadow-2xl">
//         <div className="mb-4 flex items-center justify-between">
//           <h2 className="text-lg font-bold">
//             🤝 Propose a trade with {opponent.name}
//           </h2>
//           <button
//             onClick={onClose}
//             className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
//           >
//             ✕
//           </button>
//         </div>

//         {initialOfferPropertyId &&
//           (() => {
//             const preselected = me.properties.find(
//               (p) => p.instanceId === initialOfferPropertyId,
//             );
//             if (!preselected) return null;
//             return (
//               <p className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">
//                 🏠 {preselected.name} is pre-selected in what you&apos;re
//                 offering — add cash or ask for something back below, or uncheck
//                 it if this isn&apos;t what you meant.
//               </p>
//             );
//           })()}

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//           {/* What you give */}
//           <div className="rounded-xl border border-white/10 bg-white/5 p-3">
//             <h3 className="mb-2 text-sm font-semibold text-emerald-300">
//               You give
//             </h3>
//             <label className="mb-2 flex items-center gap-2 text-xs text-white/70">
//               Cash: $
//               <input
//                 type="number"
//                 min={0}
//                 max={me.money}
//                 value={offerCash}
//                 onChange={(e) =>
//                   setOfferCash(
//                     Math.max(
//                       0,
//                       Math.min(me.money, Number(e.target.value) || 0),
//                     ),
//                   )
//                 }
//                 className="w-24 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-white"
//               />
//               <span className="text-white/40">
//                 (you have ${me.money.toLocaleString()})
//               </span>
//             </label>
//             <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
//               {me.properties.length === 0 && (
//                 <p className="text-xs text-white/40">No properties to offer.</p>
//               )}
//               {me.properties.map((p) => (
//                 <label
//                   key={p.instanceId}
//                   className={`flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 text-xs transition ${
//                     offerIds.includes(p.instanceId)
//                       ? "border-emerald-400 bg-emerald-400/10"
//                       : "border-white/10 hover:border-white/30"
//                   }`}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={offerIds.includes(p.instanceId)}
//                     onChange={() => toggle(offerIds, setOfferIds, p.instanceId)}
//                   />
//                   <PropertyIcon
//                     propertyId={p.id}
//                     className="h-8 w-8 rounded object-cover"
//                   />
//                   <span className="flex-1">{p.name}</span>
//                   <span className="text-white/50">
//                     ${p.value.toLocaleString()}
//                   </span>
//                 </label>
//               ))}
//             </div>
//           </div>

//           {/* What you want */}
//           <div className="rounded-xl border border-white/10 bg-white/5 p-3">
//             <h3 className="mb-2 text-sm font-semibold text-amber-300">
//               You want
//             </h3>
//             <label className="mb-2 flex items-center gap-2 text-xs text-white/70">
//               Cash: $
//               <input
//                 type="number"
//                 min={0}
//                 max={opponent.money}
//                 value={requestCash}
//                 onChange={(e) =>
//                   setRequestCash(
//                     Math.max(
//                       0,
//                       Math.min(opponent.money, Number(e.target.value) || 0),
//                     ),
//                   )
//                 }
//                 className="w-24 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-white"
//               />
//               <span className="text-white/40">
//                 ({opponent.name} has ${opponent.money.toLocaleString()})
//               </span>
//             </label>
//             <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
//               {opponent.properties.length === 0 && (
//                 <p className="text-xs text-white/40">
//                   {opponent.name} has no properties.
//                 </p>
//               )}
//               {opponent.properties.map((p) => (
//                 <label
//                   key={p.instanceId}
//                   className={`flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 text-xs transition ${
//                     requestIds.includes(p.instanceId)
//                       ? "border-amber-400 bg-amber-400/10"
//                       : "border-white/10 hover:border-white/30"
//                   }`}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={requestIds.includes(p.instanceId)}
//                     onChange={() =>
//                       toggle(requestIds, setRequestIds, p.instanceId)
//                     }
//                   />
//                   <PropertyIcon
//                     propertyId={p.id}
//                     className="h-8 w-8 rounded object-cover"
//                   />
//                   <span className="flex-1">{p.name}</span>
//                   <span className="text-white/50">
//                     ${p.value.toLocaleString()}
//                   </span>
//                 </label>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 flex justify-end gap-2">
//           <button
//             onClick={onClose}
//             className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={send}
//             disabled={!canSend || sending}
//             className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
//           >
//             {sending ? "Sending…" : "Send offer"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Buy-offer modal ──────────────────────────────────────────────────────
// // The simple counterpart to TradeModal: "offer this much cash for your
// // property." Used by the standalone "🤝 Make an offer" button below the
// // hand in Gameboard.tsx — that button only ever targets an opponent who
// // already owns at least one property, so `opponent.properties` here is
// // never empty. Unlike TradeModal there's no "what do you want back" side:
// // you're not giving up anything of yours, just naming a cash price. Under
// // the hood it's still the same proposeTrade mutation (offerCash for
// // requestPropertyIds), so the existing accept/decline pipeline — including
// // bots auto-responding — just works.
// export function BuyOfferModal({
//   roomId,
//   me,
//   opponent,
//   onClose,
//   onSent,
// }: {
//   roomId: Id<"rooms">;
//   me: TradeablePlayer;
//   // Guaranteed by the caller to have properties.length > 0.
//   opponent: TradeablePlayer;
//   onClose: () => void;
//   onSent?: (tradeId: Id<"trades">) => void;
// }) {
//   const proposeTrade = useMutation(api.trades.proposeTrade);
//   const [propertyId, setPropertyId] = useState<string | null>(
//     opponent.properties[0]?.instanceId ?? null,
//   );
//   const property =
//     opponent.properties.find((p) => p.instanceId === propertyId) ?? null;
//   const [cash, setCash] = useState<number>(property?.value ?? 0);
//   const [sending, setSending] = useState(false);

//   const selectProperty = (p: PropertyHolding) => {
//     setPropertyId(p.instanceId);
//     setCash(p.value);
//   };

//   const canSend = !!property && cash > 0 && cash <= me.money;

//   const send = async () => {
//     if (!property) return;
//     setSending(true);
//     try {
//       const tradeId = await proposeTrade({
//         roomId,
//         fromUserId: me.userId,
//         toUserId: opponent.userId,
//         offerPropertyIds: [],
//         offerCash: cash,
//         requestPropertyIds: [property.instanceId],
//         requestCash: 0,
//       });
//       onSent?.(tradeId);
//       toast.success(`Offer sent to ${opponent.name}!`);
//       onClose();
//     } catch (e: unknown) {
//       toast.error(e instanceof Error ? e.message : "Couldn't send offer");
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
//       <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-neutral-900 p-5 text-white shadow-2xl">
//         <div className="mb-4 flex items-center justify-between">
//           <h2 className="text-lg font-bold">
//             🤝 Make an offer to {opponent.name}
//           </h2>
//           <button
//             onClick={onClose}
//             className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
//           >
//             ✕
//           </button>
//         </div>

//         {opponent.properties.length > 1 ? (
//           <div className="mb-4 flex flex-col gap-1.5">
//             <p className="mb-1 text-xs font-semibold text-white/60">
//               Which property?
//             </p>
//             {opponent.properties.map((p) => (
//               <label
//                 key={p.instanceId}
//                 className={`flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 text-xs transition ${
//                   propertyId === p.instanceId
//                     ? "border-amber-400 bg-amber-400/10"
//                     : "border-white/10 hover:border-white/30"
//                 }`}
//               >
//                 <input
//                   type="radio"
//                   name="buy-offer-property"
//                   checked={propertyId === p.instanceId}
//                   onChange={() => selectProperty(p)}
//                 />
//                 <PropertyIcon
//                   propertyId={p.id}
//                   className="h-8 w-8 rounded object-cover"
//                 />
//                 <span className="flex-1">{p.name}</span>
//                 <span className="text-white/50">
//                   ${p.value.toLocaleString()}
//                 </span>
//               </label>
//             ))}
//           </div>
//         ) : (
//           property && (
//             <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
//               <PropertyIcon
//                 propertyId={property.id}
//                 className="h-8 w-8 rounded object-cover"
//               />
//               <span className="flex-1">{property.name}</span>
//               <span className="text-white/50">
//                 ${property.value.toLocaleString()}
//               </span>
//             </div>
//           )
//         )}

//         <label className="mb-1 flex items-center gap-2 text-xs text-white/70">
//           Your offer: $
//           <input
//             type="number"
//             min={1}
//             max={me.money}
//             value={cash}
//             onChange={(e) =>
//               setCash(
//                 Math.max(0, Math.min(me.money, Number(e.target.value) || 0)),
//               )
//             }
//             className="w-28 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-white"
//           />
//         </label>
//         <p className="mb-4 text-[11px] text-white/40">
//           You have ${me.money.toLocaleString()} cash. {opponent.name} decides
//           whether to accept — you&apos;ll get the property automatically if they
//           do.
//         </p>

//         <div className="flex justify-end gap-2">
//           <button
//             onClick={onClose}
//             className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={send}
//             disabled={!canSend || sending}
//             className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
//           >
//             {sending ? "Sending…" : "Send offer"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Sell-offer modal ─────────────────────────────────────────────────────
// // Mirror of BuyOfferModal: you already know which of YOUR properties you're
// // offering (passed in directly, since it's opened from that property's own
// // card/modal) --- the only decision here is the asking price. Same
// // proposeTrade mutation under the hood, just the other direction (you
// // offer the property, you request cash back), so acceptance still runs
// // through the normal trade pipeline.
// export function SellOfferModal({
//   roomId,
//   me,
//   opponent,
//   property,
//   onClose,
//   onSent,
// }: {
//   roomId: Id<"rooms">;
//   me: TradeablePlayer;
//   opponent: TradeablePlayer;
//   property: PropertyHolding;
//   onClose: () => void;
//   onSent?: (tradeId: Id<"trades">) => void;
// }) {
//   const proposeTrade = useMutation(api.trades.proposeTrade);
//   const [cash, setCash] = useState<number>(property.value);
//   const [sending, setSending] = useState(false);

//   const canSend = cash >= 0;

//   const send = async () => {
//     setSending(true);
//     try {
//       const tradeId = await proposeTrade({
//         roomId,
//         fromUserId: me.userId,
//         toUserId: opponent.userId,
//         offerPropertyIds: [property.instanceId],
//         offerCash: 0,
//         requestPropertyIds: [],
//         requestCash: cash,
//       });
//       onSent?.(tradeId);
//       toast.success(`Offer sent to ${opponent.name}!`);
//       onClose();
//     } catch (e: unknown) {
//       toast.error(e instanceof Error ? e.message : "Couldn't send offer");
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
//       <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-neutral-900 p-5 text-white shadow-2xl">
//         <div className="mb-4 flex items-center justify-between">
//           <h2 className="text-lg font-bold">
//             🤝 Offer {property.name} to {opponent.name}
//           </h2>
//           <button
//             onClick={onClose}
//             className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
//           >
//             ✕
//           </button>
//         </div>

//         <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
//           <PropertyIcon
//             propertyId={property.id}
//             className="h-8 w-8 rounded object-cover"
//           />
//           <span className="flex-1">{property.name}</span>
//           <span className="text-white/50">
//             Bought for ${property.price.toLocaleString()}
//           </span>
//         </div>

//         <label className="mb-1 flex items-center gap-2 text-xs text-white/70">
//           Asking price: $
//           <input
//             type="number"
//             min={0}
//             value={cash}
//             onChange={(e) => setCash(Math.max(0, Number(e.target.value) || 0))}
//             className="w-28 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-white"
//           />
//         </label>
//         <p className="mb-4 text-[11px] text-white/40">
//           {opponent.name} has ${opponent.money.toLocaleString()} cash. They
//           decide whether to accept — you&apos;ll get the cash automatically if
//           they do.
//         </p>

//         <div className="flex justify-end gap-2">
//           <button
//             onClick={onClose}
//             className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={send}
//             disabled={!canSend || sending}
//             className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
//           >
//             {sending ? "Sending…" : "Send offer"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Incoming offer popup (recipient side) ────────────────────────────────
// // Fires automatically the instant a new incoming trade shows up in the
// // TradeInbox query below — not just when the person opens the inbox panel.
// // Gives them a 10s countdown ring to decide. Accepting fires confetti and
// // holds the screen open until they close it themselves (their "win" moment
// // is worth pausing on); declining, or letting the clock run out, closes
// // immediately and auto-declines so an offer can never sit in limbo.
// interface TradePropertyDetail {
//   id: string;
//   name: string;
// }

// interface IncomingTrade {
//   _id: Id<"trades">;
//   fromName: string;
//   offerPropertyIds: string[];
//   offerPropertyDetails?: TradePropertyDetail[];
//   offerCash: number;
//   requestPropertyIds: string[];
//   requestPropertyDetails?: TradePropertyDetail[];
//   requestCash: number;
// }

// // Renders a trade's "side" (what's being given or asked for) as icon+name
// // chips for properties plus a plain cash badge — used by the countdown
// // popup, the outgoing-offer popup, and the inbox list, so all three name
// // the actual property instead of falling back to "1 property".
// function TradeItemsRow({
//   properties,
//   propertyIds,
//   cash,
//   accent,
// }: {
//   properties?: TradePropertyDetail[];
//   propertyIds: string[];
//   cash: number;
//   accent: "give" | "get";
// }) {
//   const chipClass =
//     accent === "give"
//       ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
//       : "border-amber-400/30 bg-amber-400/10 text-amber-200";
//   const cashClass = accent === "give" ? "text-emerald-300" : "text-amber-300";

//   const hasProps = propertyIds.length > 0;
//   if (!hasProps && !cash) {
//     return <span className="text-white/40">nothing</span>;
//   }

//   return (
//     <span className="inline-flex flex-wrap items-center gap-1 align-middle">
//       {hasProps &&
//         (properties?.length ? (
//           properties.map((p, i) => (
//             <span
//               key={`${p.id}-${i}`}
//               className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold ${chipClass}`}
//             >
//               <PropertyIcon
//                 propertyId={p.id}
//                 className="h-4 w-4 rounded object-cover"
//               />
//               {p.name}
//             </span>
//           ))
//         ) : (
//           // Fallback for older trades created before this field existed
//           <span
//             className={`rounded-full border px-1.5 py-0.5 text-[11px] font-semibold ${chipClass}`}
//           >
//             {propertyIds.length} propert{propertyIds.length === 1 ? "y" : "ies"}
//           </span>
//         ))}
//       {cash > 0 && (
//         <span className={`text-[11px] font-semibold ${cashClass}`}>
//           ${cash.toLocaleString()}
//         </span>
//       )}
//     </span>
//   );
// }

// // The single property to feature as a big video header on the incoming
// // offer popup -- this is what makes "the bot offers ... for one of your
// // properties" become "the bot offers ... for Maple Cottage" with a clip
// // of the actual place. Only shown when the trade points at exactly one
// // property overall (the common bot case: cash for one specific property);
// // multi-property trades fall back to the icon+name chips below instead.
// function spotlightProperty(trade: IncomingTrade): TradePropertyDetail | null {
//   const request = trade.requestPropertyDetails ?? [];
//   const offer = trade.offerPropertyDetails ?? [];
//   if (request.length === 1 && offer.length === 0) return request[0];
//   if (offer.length === 1 && request.length === 0) return offer[0];
//   return null;
// }

// const COUNTDOWN_SECONDS = 10;
// const RING_RADIUS = 45;
// const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// function TradeOfferPopup({
//   trade,
//   userId,
//   onDone,
// }: {
//   trade: IncomingTrade;
//   userId: string;
//   onDone: () => void;
// }) {
//   const respondTrade = useMutation(api.trades.respondTrade);
//   const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
//   const [resolving, setResolving] = useState<"accept" | "decline" | null>(null);
//   const [showConfetti, setShowConfetti] = useState(false);
//   const settledRef = useRef(false);
//   const spotlight = spotlightProperty(trade);

//   const settle = async (accept: boolean, reason?: "timeout") => {
//     if (settledRef.current) return;
//     settledRef.current = true;
//     setResolving(accept ? "accept" : "decline");
//     try {
//       await respondTrade({ tradeId: trade._id, userId, accept });
//       if (accept) {
//         setShowConfetti(true);
//         toast.success("Deal made! 🎉");
//         // stays open on purpose — the recipient closes this one manually
//       } else {
//         if (reason === "timeout")
//           toast("Offer expired — declined automatically.");
//         onDone();
//       }
//     } catch (e: unknown) {
//       toast.error(e instanceof Error ? e.message : "Couldn't respond to trade");
//       onDone();
//     }
//   };

//   useEffect(() => {
//     if (resolving) return;
//     if (secondsLeft <= 0) {
//       settle(false, "timeout");
//       return;
//     }
//     const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [secondsLeft, resolving]);

//   const urgent = secondsLeft <= 3;

//   return (
//     <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
//       {showConfetti && <ConfettiBurst trigger={trade._id} variant="win" />}
//       <motion.div
//         initial={{ scale: 0.7, y: 30, opacity: 0 }}
//         animate={{ scale: 1, y: 0, opacity: 1 }}
//         transition={{ type: "spring", stiffness: 360, damping: 26 }}
//         className="w-full max-w-sm rounded-3xl border border-white/20 p-6 text-center text-white shadow-2xl"
//         style={{
//           background:
//             "linear-gradient(145deg, rgba(40,15,60,0.97) 0%, rgba(20,8,35,0.97) 100%)",
//           boxShadow:
//             "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(147,51,234,0.35)",
//         }}
//       >
//         {spotlight && (
//           <div className="relative -mx-6 -mt-6 mb-4 h-32 overflow-hidden rounded-t-3xl">
//             <PropertyMediaHeader propertyId={spotlight.id} heightClass="h-32" />
//             <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent px-3 pb-2 pt-8">
//               <p className="text-sm font-black text-white drop-shadow">
//                 {spotlight.name}
//               </p>
//             </div>
//           </div>
//         )}
//         {resolving === "accept" ? (
//           <div className="py-4">
//             <div className="mb-2 text-4xl">🎉</div>
//             <p className="mb-4 text-lg font-black">You accepted the trade!</p>
//             <button
//               onClick={onDone}
//               className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-400"
//             >
//               Nice! Close
//             </button>
//           </div>
//         ) : (
//           <>
//             <div className="relative mx-auto mb-3 h-24 w-24">
//               <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
//                 <circle
//                   cx="50"
//                   cy="50"
//                   r={RING_RADIUS}
//                   fill="none"
//                   stroke="rgba(255,255,255,0.12)"
//                   strokeWidth="8"
//                 />
//                 <motion.circle
//                   key={trade._id}
//                   cx="50"
//                   cy="50"
//                   r={RING_RADIUS}
//                   fill="none"
//                   stroke={urgent ? "#ef4444" : "#facc15"}
//                   strokeWidth="8"
//                   strokeLinecap="round"
//                   strokeDasharray={RING_CIRCUMFERENCE}
//                   initial={{ strokeDashoffset: 0 }}
//                   animate={{ strokeDashoffset: RING_CIRCUMFERENCE }}
//                   transition={{ duration: COUNTDOWN_SECONDS, ease: "linear" }}
//                 />
//               </svg>
//               <div
//                 className={`absolute inset-0 flex items-center justify-center text-2xl font-black ${
//                   urgent ? "text-red-400" : "text-yellow-300"
//                 }`}
//               >
//                 {secondsLeft}
//               </div>
//             </div>
//             <h2 className="mb-1 text-lg font-black">
//               🤝 {trade.fromName} made you an offer!
//             </h2>
//             <p className="mb-5 flex flex-wrap items-center justify-center gap-1 text-sm text-white/70">
//               Gives you{" "}
//               <TradeItemsRow
//                 properties={trade.offerPropertyDetails}
//                 propertyIds={trade.offerPropertyIds}
//                 cash={trade.offerCash}
//                 accent="give"
//               />{" "}
//               for your{" "}
//               <TradeItemsRow
//                 properties={trade.requestPropertyDetails}
//                 propertyIds={trade.requestPropertyIds}
//                 cash={trade.requestCash}
//                 accent="get"
//               />
//             </p>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => settle(false)}
//                 disabled={!!resolving}
//                 className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-40"
//               >
//                 Decline
//               </button>
//               <motion.button
//                 whileHover={{ scale: 1.03 }}
//                 whileTap={{ scale: 0.97 }}
//                 onClick={() => settle(true)}
//                 disabled={!!resolving}
//                 className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-400 disabled:opacity-40"
//               >
//                 Accept
//               </motion.button>
//             </div>
//           </>
//         )}
//       </motion.div>
//     </div>
//   );
// }

// // ─── Outgoing offer popup (proposer side) ─────────────────────────────────
// // Opens automatically the instant you send an offer (via the onSent
// // callback on TradeModal/BuyOfferModal/SellOfferModal). Watches that one
// // trade by id via getTrade: shows a "waiting" spinner while pending
// // (resolves almost instantly against bots), then confetti + congrats on
// // accept, or a funny jab on decline — then closes itself so play just
// // continues. Unlike TradeOfferPopup, this one does NOT wait for a manual
// // close on the happy path.
// const FUNNY_DECLINES = [
//   "😤 They took one look and laughed.",
//   "🚫 Rejected faster than a bad Tinder match.",
//   "🧊 Cold shoulder. Try sweetening the deal.",
//   "📉 They valued their property higher than that.",
//   "🙅 Hard pass from the other side of the board.",
//   "💸 Not enough cash to move the needle, apparently.",
// ];

// export function OutgoingOfferPopup({
//   tradeId,
//   onDone,
// }: {
//   tradeId: Id<"trades">;
//   onDone: () => void;
// }) {
//   const trade = useQuery(api.trades.getTrade, { tradeId });
//   const closedRef = useRef(false);

//   // Side effect: once the trade lands on a final status, schedule the
//   // auto-close. This is the only thing that actually needs an effect —
//   // everything else below is derived straight from `trade` during render.
//   useEffect(() => {
//     if (!trade || closedRef.current) return;
//     if (trade.status === "accepted" || trade.status === "declined") {
//       closedRef.current = true;
//       const t = setTimeout(onDone, 2600);
//       return () => clearTimeout(t);
//     }
//     if (trade.status === "cancelled") {
//       closedRef.current = true;
//       onDone();
//     }
//   }, [trade, onDone]);

//   if (!trade) return null;

//   // Pure, derived from data already in hand — no state/effect needed.
//   const showConfetti = trade.status === "accepted";
//   const funnyLine =
//     trade.status === "declined"
//       ? FUNNY_DECLINES[
//           [...trade._id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
//             FUNNY_DECLINES.length
//         ]
//       : null;

//   return (
//     <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
//       {showConfetti && <ConfettiBurst trigger={trade._id} variant="win" />}
//       <motion.div
//         initial={{ scale: 0.7, y: 30, opacity: 0 }}
//         animate={{ scale: 1, y: 0, opacity: 1 }}
//         transition={{ type: "spring", stiffness: 360, damping: 26 }}
//         className="w-full max-w-sm rounded-3xl border border-white/20 p-6 text-center text-white shadow-2xl"
//         style={{
//           background:
//             "linear-gradient(145deg, rgba(40,15,60,0.97) 0%, rgba(20,8,35,0.97) 100%)",
//           boxShadow:
//             "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(147,51,234,0.35)",
//         }}
//       >
//         <p className="mb-4 flex flex-wrap items-center justify-center gap-1 text-xs text-white/60">
//           You give{" "}
//           <TradeItemsRow
//             properties={trade.offerPropertyDetails}
//             propertyIds={trade.offerPropertyIds}
//             cash={trade.offerCash}
//             accent="give"
//           />{" "}
//           for their{" "}
//           <TradeItemsRow
//             properties={trade.requestPropertyDetails}
//             propertyIds={trade.requestPropertyIds}
//             cash={trade.requestCash}
//             accent="get"
//           />
//         </p>
//         {trade.status === "pending" && (
//           <>
//             <div className="relative mx-auto mb-3 h-20 w-20">
//               <motion.div
//                 animate={{ rotate: 360 }}
//                 transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
//                 className="h-20 w-20 rounded-full border-4 border-white/10"
//                 style={{ borderTopColor: "#facc15" }}
//               />
//               <div className="absolute inset-0 flex items-center justify-center text-2xl">
//                 🤝
//               </div>
//             </div>
//             <h2 className="mb-1 text-lg font-black">
//               Waiting on {trade.toName}&hellip;
//             </h2>
//             <p className="text-sm text-white/60">
//               They&apos;re deciding whether to accept your offer.
//             </p>
//           </>
//         )}
//         {trade.status === "accepted" && (
//           <div className="py-4">
//             <div className="mb-2 text-4xl">🎉</div>
//             <h2 className="text-lg font-black">
//               {trade.toName} accepted your offer!
//             </h2>
//           </div>
//         )}
//         {trade.status === "declined" && (
//           <div className="py-4">
//             <div className="mb-2 text-4xl">💔</div>
//             <h2 className="mb-1 text-lg font-black">
//               {trade.toName} declined.
//             </h2>
//             <p className="text-sm text-white/60">{funnyLine}</p>
//           </div>
//         )}
//       </motion.div>
//     </div>
//   );
// }

// // ─── Trade inbox ──────────────────────────────────────────────────────────
// // A small floating panel showing trades sent to you (Accept/Decline) and
// // trades you've sent (Cancel). Drop <TradeInbox roomId={...} userId={...} />
// // once near the top-level of the game screen — it's self-contained.
// //
// // Also owns the auto-popping TradeOfferPopup: the moment a new incoming
// // trade shows up in the query below, it's shown full-screen with the
// // countdown, one at a time, without waiting for the person to open the
// // panel themselves.
// export function TradeInbox({
//   roomId,
//   userId,
// }: {
//   roomId: Id<"rooms">;
//   userId: string;
// }) {
//   const trades = useQuery(api.trades.listTrades, { roomId, userId });
//   const respondTrade = useMutation(api.trades.respondTrade);
//   const cancelTrade = useMutation(api.trades.cancelTrade);
//   const [open, setOpen] = useState(false);

//   const incoming = trades?.incoming ?? [];
//   const outgoing = trades?.outgoing ?? [];
//   const total = incoming.length + outgoing.length;

//   // Tracks ids that have already been shown as a popup and resolved, so a
//   // stale query result can't re-trigger the same trade a second time.
//   const dismissedIds = useRef<Set<string>>(new Set());
//   const [activePopupId, setActivePopupId] = useState<string | null>(null);

//   useEffect(() => {
//     if (activePopupId) return;
//     const next = incoming.find((t) => !dismissedIds.current.has(t._id));
//     if (next) setActivePopupId(next._id);
//   }, [incoming, activePopupId]);

//   const activeTrade = incoming.find((t) => t._id === activePopupId) ?? null;

//   if (total === 0) return null;

//   return (
//     <div className="fixed bottom-4 right-4 z-40">
//       <button
//         onClick={() => setOpen((o) => !o)}
//         className="relative rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-purple-500"
//       >
//         🤝 Trades
//         <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
//           {total}
//         </span>
//       </button>

//       {open && (
//         <div className="absolute bottom-14 right-0 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/15 bg-neutral-900 p-3 text-white shadow-2xl">
//           {incoming.length > 0 && (
//             <div className="mb-3">
//               <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-white/50">
//                 Offers for you
//               </h4>
//               {incoming.map((t) => {
//                 return (
//                   <div
//                     key={t._id}
//                     className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs"
//                   >
//                     <p className="mb-1 font-semibold">{t.fromName} offers:</p>
//                     <p className="flex flex-wrap items-center gap-1 text-white/70">
//                       Gives you{" "}
//                       <TradeItemsRow
//                         properties={t.offerPropertyDetails}
//                         propertyIds={t.offerPropertyIds}
//                         cash={t.offerCash}
//                         accent="give"
//                       />{" "}
//                       for your{" "}
//                       <TradeItemsRow
//                         properties={t.requestPropertyDetails}
//                         propertyIds={t.requestPropertyIds}
//                         cash={t.requestCash}
//                         accent="get"
//                       />
//                     </p>
//                     <div className="mt-1.5 flex gap-1.5">
//                       <button
//                         onClick={async () => {
//                           try {
//                             await respondTrade({
//                               tradeId: t._id,
//                               userId,
//                               accept: true,
//                             });
//                             toast.success("Trade accepted!");
//                           } catch (e: unknown) {
//                             toast.error(
//                               e instanceof Error
//                                 ? e.message
//                                 : "Couldn't accept trade",
//                             );
//                           }
//                         }}
//                         className="flex-1 rounded-md bg-emerald-500 px-2 py-1 font-semibold hover:bg-emerald-400"
//                       >
//                         Accept
//                       </button>
//                       <button
//                         onClick={async () => {
//                           try {
//                             await respondTrade({
//                               tradeId: t._id,
//                               userId,
//                               accept: false,
//                             });
//                           } catch (e: unknown) {
//                             toast.error(
//                               e instanceof Error
//                                 ? e.message
//                                 : "Couldn't decline trade",
//                             );
//                           }
//                         }}
//                         className="flex-1 rounded-md bg-white/10 px-2 py-1 font-semibold hover:bg-white/20"
//                       >
//                         Decline
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {outgoing.length > 0 && (
//             <div>
//               <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-white/50">
//                 Your pending offers
//               </h4>
//               {outgoing.map((t) => {
//                 return (
//                   <div
//                     key={t._id}
//                     className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs"
//                   >
//                     <p className="mb-1 font-semibold">To {t.toName}:</p>
//                     <p className="flex flex-wrap items-center gap-1 text-white/70">
//                       You give{" "}
//                       <TradeItemsRow
//                         properties={t.offerPropertyDetails}
//                         propertyIds={t.offerPropertyIds}
//                         cash={t.offerCash}
//                         accent="give"
//                       />{" "}
//                       for{" "}
//                       <TradeItemsRow
//                         properties={t.requestPropertyDetails}
//                         propertyIds={t.requestPropertyIds}
//                         cash={t.requestCash}
//                         accent="get"
//                       />
//                     </p>
//                     <button
//                       onClick={async () => {
//                         try {
//                           await cancelTrade({ tradeId: t._id, userId });
//                         } catch (e: unknown) {
//                           toast.error(
//                             e instanceof Error
//                               ? e.message
//                               : "Couldn't cancel trade",
//                           );
//                         }
//                       }}
//                       className="mt-1.5 w-full rounded-md bg-white/10 px-2 py-1 font-semibold hover:bg-white/20"
//                     >
//                       Cancel offer
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       )}

//       {activeTrade && (
//         <TradeOfferPopup
//           trade={activeTrade}
//           userId={userId}
//           onDone={() => {
//             dismissedIds.current.add(activeTrade._id);
//             setActivePopupId(null);
//           }}
//         />
//       )}
//     </div>
//   );
// }
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { PropertyIcon } from "./PropertyIcon";
import { PropertyMediaHeader } from "./PropertyMediaHeader";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";
import { ConfettiBurst } from "./Confetti";

interface PropertyHolding {
  instanceId: string;
  id: string;
  name: string;
  price: number;
  value: number;
  invested: number;
  upgrades: string[];
}

interface TradeablePlayer {
  userId: string;
  name: string;
  money: number;
  properties: PropertyHolding[];
}

// ─── Propose-trade modal ─────────────────────────────────────────────────
// Opened per-opponent (e.g. a "🤝 Trade" button next to their name in
// Gameboard.tsx). Lets the current player pick properties + cash to offer,
// and properties + cash to request back, then sends the offer to Convex.
export function TradeModal({
  roomId,
  me,
  opponent,
  onClose,
  onSent,
  initialOfferPropertyId,
}: {
  roomId: Id<"rooms">;
  me: TradeablePlayer;
  opponent: TradeablePlayer;
  onClose: () => void;
  // Fired right after a successful send, with the new trade's id, so the
  // caller can pop up the "waiting on them..." OutgoingOfferPopup.
  onSent?: (tradeId: Id<"trades">) => void;
  // When set (e.g. opened via a property card's "Offer to opponents" button
  // instead of the generic per-opponent "🤝 Trade" button), this property
  // starts pre-checked in the "You give" column so the person doesn't have
  // to hunt for it again.
  initialOfferPropertyId?: string | null;
}) {
  const proposeTrade = useMutation(api.trades.proposeTrade);
  const [offerIds, setOfferIds] = useState<string[]>(
    initialOfferPropertyId ? [initialOfferPropertyId] : [],
  );
  const [requestIds, setRequestIds] = useState<string[]>([]);
  const [offerCash, setOfferCash] = useState(0);
  const [requestCash, setRequestCash] = useState(0);
  const [sending, setSending] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const canSend =
    (offerIds.length > 0 ||
      requestIds.length > 0 ||
      offerCash > 0 ||
      requestCash > 0) &&
    offerCash <= me.money &&
    requestCash <= opponent.money;

  const send = async () => {
    setSending(true);
    try {
      const tradeId = await proposeTrade({
        roomId,
        fromUserId: me.userId,
        toUserId: opponent.userId,
        offerPropertyIds: offerIds,
        offerCash,
        requestPropertyIds: requestIds,
        requestCash,
      });
      onSent?.(tradeId);
      toast.success(`Trade offer sent to ${opponent.name}!`);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't send trade");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900 p-5 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            🤝 Propose a trade with {opponent.name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {initialOfferPropertyId &&
          (() => {
            const preselected = me.properties.find(
              (p) => p.instanceId === initialOfferPropertyId,
            );
            if (!preselected) return null;
            return (
              <p className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">
                🏠 {preselected.name} is pre-selected in what you&apos;re
                offering — add cash or ask for something back below, or uncheck
                it if this isn&apos;t what you meant.
              </p>
            );
          })()}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* What you give */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <h3 className="mb-2 text-sm font-semibold text-emerald-300">
              You give
            </h3>
            <label className="mb-2 flex items-center gap-2 text-xs text-white/70">
              Cash: $
              <input
                type="number"
                min={0}
                max={me.money}
                value={offerCash}
                onChange={(e) =>
                  setOfferCash(
                    Math.max(
                      0,
                      Math.min(me.money, Number(e.target.value) || 0),
                    ),
                  )
                }
                className="w-24 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-white"
              />
              <span className="text-white/40">
                (you have ${me.money.toLocaleString()})
              </span>
            </label>
            <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
              {me.properties.length === 0 && (
                <p className="text-xs text-white/40">No properties to offer.</p>
              )}
              {me.properties.map((p) => (
                <label
                  key={p.instanceId}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 text-xs transition ${
                    offerIds.includes(p.instanceId)
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={offerIds.includes(p.instanceId)}
                    onChange={() => toggle(offerIds, setOfferIds, p.instanceId)}
                  />
                  <PropertyIcon
                    propertyId={p.id}
                    className="h-8 w-8 rounded object-cover"
                  />
                  <span className="flex-1">{p.name}</span>
                  <span className="text-white/50">
                    ${p.value.toLocaleString()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* What you want */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <h3 className="mb-2 text-sm font-semibold text-amber-300">
              You want
            </h3>
            <label className="mb-2 flex items-center gap-2 text-xs text-white/70">
              Cash: $
              <input
                type="number"
                min={0}
                max={opponent.money}
                value={requestCash}
                onChange={(e) =>
                  setRequestCash(
                    Math.max(
                      0,
                      Math.min(opponent.money, Number(e.target.value) || 0),
                    ),
                  )
                }
                className="w-24 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-white"
              />
              <span className="text-white/40">
                ({opponent.name} has ${opponent.money.toLocaleString()})
              </span>
            </label>
            <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
              {opponent.properties.length === 0 && (
                <p className="text-xs text-white/40">
                  {opponent.name} has no properties.
                </p>
              )}
              {opponent.properties.map((p) => (
                <label
                  key={p.instanceId}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 text-xs transition ${
                    requestIds.includes(p.instanceId)
                      ? "border-amber-400 bg-amber-400/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={requestIds.includes(p.instanceId)}
                    onChange={() =>
                      toggle(requestIds, setRequestIds, p.instanceId)
                    }
                  />
                  <PropertyIcon
                    propertyId={p.id}
                    className="h-8 w-8 rounded object-cover"
                  />
                  <span className="flex-1">{p.name}</span>
                  <span className="text-white/50">
                    ${p.value.toLocaleString()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={send}
            disabled={!canSend || sending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send offer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Buy-offer modal ──────────────────────────────────────────────────────
// The simple counterpart to TradeModal: "offer this much cash for your
// property." Used by the standalone "🤝 Make an offer" button below the
// hand in Gameboard.tsx — that button only ever targets an opponent who
// already owns at least one property, so `opponent.properties` here is
// never empty. Unlike TradeModal there's no "what do you want back" side:
// you're not giving up anything of yours, just naming a cash price. Under
// the hood it's still the same proposeTrade mutation (offerCash for
// requestPropertyIds), so the existing accept/decline pipeline — including
// bots auto-responding — just works.
export function BuyOfferModal({
  roomId,
  me,
  opponent,
  onClose,
  onSent,
}: {
  roomId: Id<"rooms">;
  me: TradeablePlayer;
  // Guaranteed by the caller to have properties.length > 0.
  opponent: TradeablePlayer;
  onClose: () => void;
  onSent?: (tradeId: Id<"trades">) => void;
}) {
  const proposeTrade = useMutation(api.trades.proposeTrade);
  const [propertyId, setPropertyId] = useState<string | null>(
    opponent.properties[0]?.instanceId ?? null,
  );
  const property =
    opponent.properties.find((p) => p.instanceId === propertyId) ?? null;
  const [cash, setCash] = useState<number>(property?.value ?? 0);
  const [sending, setSending] = useState(false);

  const selectProperty = (p: PropertyHolding) => {
    setPropertyId(p.instanceId);
    setCash(p.value);
  };

  const canSend = !!property && cash > 0 && cash <= me.money;

  const send = async () => {
    if (!property) return;
    setSending(true);
    try {
      const tradeId = await proposeTrade({
        roomId,
        fromUserId: me.userId,
        toUserId: opponent.userId,
        offerPropertyIds: [],
        offerCash: cash,
        requestPropertyIds: [property.instanceId],
        requestCash: 0,
      });
      onSent?.(tradeId);
      toast.success(`Offer sent to ${opponent.name}!`);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't send offer");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-neutral-900 p-5 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            🤝 Make an offer to {opponent.name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {opponent.properties.length > 1 ? (
          <div className="mb-4 flex flex-col gap-1.5">
            <p className="mb-1 text-xs font-semibold text-white/60">
              Which property?
            </p>
            {opponent.properties.map((p) => (
              <label
                key={p.instanceId}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 text-xs transition ${
                  propertyId === p.instanceId
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <input
                  type="radio"
                  name="buy-offer-property"
                  checked={propertyId === p.instanceId}
                  onChange={() => selectProperty(p)}
                />
                <PropertyIcon
                  propertyId={p.id}
                  className="h-8 w-8 rounded object-cover"
                />
                <span className="flex-1">{p.name}</span>
                <span className="text-white/50">
                  ${p.value.toLocaleString()}
                </span>
              </label>
            ))}
          </div>
        ) : (
          property && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
              <PropertyIcon
                propertyId={property.id}
                className="h-8 w-8 rounded object-cover"
              />
              <span className="flex-1">{property.name}</span>
              <span className="text-white/50">
                ${property.value.toLocaleString()}
              </span>
            </div>
          )
        )}

        <label className="mb-1 flex items-center gap-2 text-xs text-white/70">
          Your offer: $
          <input
            type="number"
            min={1}
            max={me.money}
            value={cash}
            onChange={(e) =>
              setCash(
                Math.max(0, Math.min(me.money, Number(e.target.value) || 0)),
              )
            }
            className="w-28 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-white"
          />
        </label>
        <p className="mb-4 text-[11px] text-white/40">
          You have ${me.money.toLocaleString()} cash. {opponent.name} decides
          whether to accept — you&apos;ll get the property automatically if they
          do.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={send}
            disabled={!canSend || sending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send offer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sell-offer modal ─────────────────────────────────────────────────────
// Mirror of BuyOfferModal: you already know which of YOUR properties you're
// offering (passed in directly, since it's opened from that property's own
// card/modal) --- the only decision here is the asking price. Same
// proposeTrade mutation under the hood, just the other direction (you
// offer the property, you request cash back), so acceptance still runs
// through the normal trade pipeline.
export function SellOfferModal({
  roomId,
  me,
  opponent,
  property,
  onClose,
  onSent,
}: {
  roomId: Id<"rooms">;
  me: TradeablePlayer;
  opponent: TradeablePlayer;
  property: PropertyHolding;
  onClose: () => void;
  onSent?: (tradeId: Id<"trades">) => void;
}) {
  const proposeTrade = useMutation(api.trades.proposeTrade);
  const [cash, setCash] = useState<number>(property.value);
  const [sending, setSending] = useState(false);

  const canSend = cash >= 0;

  const send = async () => {
    setSending(true);
    try {
      const tradeId = await proposeTrade({
        roomId,
        fromUserId: me.userId,
        toUserId: opponent.userId,
        offerPropertyIds: [property.instanceId],
        offerCash: 0,
        requestPropertyIds: [],
        requestCash: cash,
      });
      onSent?.(tradeId);
      toast.success(`Offer sent to ${opponent.name}!`);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't send offer");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-neutral-900 p-5 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            🤝 Offer {property.name} to {opponent.name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
          <PropertyIcon
            propertyId={property.id}
            className="h-8 w-8 rounded object-cover"
          />
          <span className="flex-1">{property.name}</span>
          <span className="text-white/50">
            Bought for ${property.price.toLocaleString()}
          </span>
        </div>

        <label className="mb-1 flex items-center gap-2 text-xs text-white/70">
          Asking price: $
          <input
            type="number"
            min={0}
            value={cash}
            onChange={(e) => setCash(Math.max(0, Number(e.target.value) || 0))}
            className="w-28 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-white"
          />
        </label>
        <p className="mb-4 text-[11px] text-white/40">
          {opponent.name} has ${opponent.money.toLocaleString()} cash. They
          decide whether to accept — you&apos;ll get the cash automatically if
          they do.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={send}
            disabled={!canSend || sending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send offer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Incoming offer popup (recipient side) ────────────────────────────────
// Fires automatically the instant a new incoming trade shows up in the
// TradeInbox query below — not just when the person opens the inbox panel.
// Gives them a 10s countdown ring to decide. Accepting fires confetti and
// holds the screen open until they close it themselves (their "win" moment
// is worth pausing on); declining, or letting the clock run out, closes
// immediately and auto-declines so an offer can never sit in limbo.
interface TradePropertyDetail {
  id: string;
  name: string;
}

interface IncomingTrade {
  _id: Id<"trades">;
  fromName: string;
  offerPropertyIds: string[];
  offerPropertyDetails?: TradePropertyDetail[];
  offerCash: number;
  requestPropertyIds: string[];
  requestPropertyDetails?: TradePropertyDetail[];
  requestCash: number;
}

// Renders a trade's "side" (what's being given or asked for) as icon+name
// chips for properties plus a plain cash badge — used by the countdown
// popup, the outgoing-offer popup, and the inbox list, so all three name
// the actual property instead of falling back to "1 property".
function TradeItemsRow({
  properties,
  propertyIds,
  cash,
  accent,
}: {
  properties?: TradePropertyDetail[];
  propertyIds: string[];
  cash: number;
  accent: "give" | "get";
}) {
  const chipClass =
    accent === "give"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : "border-amber-400/30 bg-amber-400/10 text-amber-200";
  const cashClass = accent === "give" ? "text-emerald-300" : "text-amber-300";

  const hasProps = propertyIds.length > 0;
  if (!hasProps && !cash) {
    return <span className="text-white/40">nothing</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1 align-middle">
      {hasProps &&
        (properties?.length ? (
          properties.map((p, i) => (
            <span
              key={`${p.id}-${i}`}
              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold ${chipClass}`}
            >
              <PropertyIcon
                propertyId={p.id}
                className="h-4 w-4 rounded object-cover"
              />
              {p.name}
            </span>
          ))
        ) : (
          // Fallback for older trades created before this field existed
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[11px] font-semibold ${chipClass}`}
          >
            {propertyIds.length} propert{propertyIds.length === 1 ? "y" : "ies"}
          </span>
        ))}
      {cash > 0 && (
        <span className={`text-[11px] font-semibold ${cashClass}`}>
          ${cash.toLocaleString()}
        </span>
      )}
    </span>
  );
}

// The single property to feature as a big video header on the incoming
// offer popup -- this is what makes "the bot offers ... for one of your
// properties" become "the bot offers ... for Maple Cottage" with a clip
// of the actual place. Only shown when the trade points at exactly one
// property overall (the common bot case: cash for one specific property);
// multi-property trades fall back to the icon+name chips below instead.
function spotlightProperty(trade: IncomingTrade): TradePropertyDetail | null {
  const request = trade.requestPropertyDetails ?? [];
  const offer = trade.offerPropertyDetails ?? [];
  if (request.length === 1 && offer.length === 0) return request[0];
  if (offer.length === 1 && request.length === 0) return offer[0];
  return null;
}

const COUNTDOWN_SECONDS = 10;
const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function TradeOfferPopup({
  trade,
  userId,
  onDone,
}: {
  trade: IncomingTrade;
  userId: string;
  onDone: () => void;
}) {
  const respondTrade = useMutation(api.trades.respondTrade);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [resolving, setResolving] = useState<"accept" | "decline" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const settledRef = useRef(false);
  const spotlight = spotlightProperty(trade);

  const settle = async (accept: boolean, reason?: "timeout") => {
    if (settledRef.current) return;
    settledRef.current = true;
    setResolving(accept ? "accept" : "decline");
    try {
      await respondTrade({ tradeId: trade._id, userId, accept });
      if (accept) {
        setShowConfetti(true);
        toast.success("Deal made! 🎉");
        // stays open on purpose — the recipient closes this one manually
      } else {
        if (reason === "timeout")
          toast("Offer expired — declined automatically.");
        onDone();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't respond to trade");
      onDone();
    }
  };

  useEffect(() => {
    if (resolving) return;
    if (secondsLeft <= 0) {
      settle(false, "timeout");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, resolving]);

  const urgent = secondsLeft <= 3;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      {showConfetti && <ConfettiBurst trigger={trade._id} variant="win" />}
      <motion.div
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 26 }}
        className="w-full max-w-sm rounded-3xl border border-white/20 p-6 text-center text-white shadow-2xl"
        style={{
          background:
            "linear-gradient(145deg, rgba(40,15,60,0.97) 0%, rgba(20,8,35,0.97) 100%)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(147,51,234,0.35)",
        }}
      >
        {spotlight && (
          <div className="relative -mx-6 -mt-6 mb-4 h-32 overflow-hidden rounded-t-3xl">
            <PropertyMediaHeader propertyId={spotlight.id} heightClass="h-32" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent px-3 pb-2 pt-8">
              <p className="text-sm font-black text-white drop-shadow">
                {spotlight.name}
              </p>
            </div>
          </div>
        )}
        {resolving === "accept" ? (
          <div className="py-4">
            <div className="mb-2 text-4xl">🎉</div>
            <p className="mb-4 text-lg font-black">You accepted the trade!</p>
            <button
              onClick={onDone}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-400"
            >
              Nice! Close
            </button>
          </div>
        ) : (
          <>
            <div className="relative mx-auto mb-3 h-24 w-24">
              <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="8"
                />
                <motion.circle
                  key={trade._id}
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={urgent ? "#ef4444" : "#facc15"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                  transition={{ duration: COUNTDOWN_SECONDS, ease: "linear" }}
                />
              </svg>
              <div
                className={`absolute inset-0 flex items-center justify-center text-2xl font-black ${
                  urgent ? "text-red-400" : "text-yellow-300"
                }`}
              >
                {secondsLeft}
              </div>
            </div>
            <h2 className="mb-1 text-lg font-black">
              🤝 {trade.fromName} made you an offer!
            </h2>
            <p className="mb-5 flex flex-wrap items-center justify-center gap-1 text-sm text-white/70">
              Gives you{" "}
              <TradeItemsRow
                properties={trade.offerPropertyDetails}
                propertyIds={trade.offerPropertyIds}
                cash={trade.offerCash}
                accent="give"
              />{" "}
              for your{" "}
              <TradeItemsRow
                properties={trade.requestPropertyDetails}
                propertyIds={trade.requestPropertyIds}
                cash={trade.requestCash}
                accent="get"
              />
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => settle(false)}
                disabled={!!resolving}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-40"
              >
                Decline
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => settle(true)}
                disabled={!!resolving}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-400 disabled:opacity-40"
              >
                Accept
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Outgoing offer popup (proposer side) ─────────────────────────────────
// Opens automatically the instant you send an offer (via the onSent
// callback on TradeModal/BuyOfferModal/SellOfferModal). Watches that one
// trade by id via getTrade: shows a "waiting" spinner while pending
// (resolves almost instantly against bots), then confetti + congrats on
// accept, or a funny jab on decline — then closes itself so play just
// continues. Unlike TradeOfferPopup, this one does NOT wait for a manual
// close on the happy path.
const FUNNY_DECLINES = [
  "😤 They took one look and laughed.",
  "🚫 Rejected faster than a bad Tinder match.",
  "🧊 Cold shoulder. Try sweetening the deal.",
  "📉 They valued their property higher than that.",
  "🙅 Hard pass from the other side of the board.",
  "💸 Not enough cash to move the needle, apparently.",
];

export function OutgoingOfferPopup({
  tradeId,
  onDone,
}: {
  tradeId: Id<"trades">;
  onDone: () => void;
}) {
  const trade = useQuery(api.trades.getTrade, { tradeId });
  const closedRef = useRef(false);

  // Keep the latest onDone without making the effect below depend on its
  // identity — the parent passes an inline arrow function that's a new
  // reference every render, which would otherwise tear the effect down
  // and cancel the pending close before it ever fires.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Side effect: once the trade lands on a final status, schedule the
  // auto-close. Depend only on trade?.status (a primitive) — Convex's
  // live query gives `trade` a new object identity on nearly every poll,
  // and depending on the object itself would re-run this effect (and
  // clear the in-flight timeout) constantly, so the popup would never
  // actually close.
  useEffect(() => {
    if (!trade || closedRef.current) return;
    if (trade.status === "accepted" || trade.status === "declined") {
      closedRef.current = true;
      const t = setTimeout(() => onDoneRef.current(), 2600);
      return () => clearTimeout(t);
    }
    if (trade.status === "cancelled") {
      closedRef.current = true;
      onDoneRef.current();
    }
  }, [trade?.status]);

  if (!trade) return null;

  // Pure, derived from data already in hand — no state/effect needed.
  const showConfetti = trade.status === "accepted";
  const funnyLine =
    trade.status === "declined"
      ? FUNNY_DECLINES[
          [...trade._id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
            FUNNY_DECLINES.length
        ]
      : null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      {showConfetti && <ConfettiBurst trigger={trade._id} variant="win" />}
      <motion.div
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 26 }}
        className="w-full max-w-sm rounded-3xl border border-white/20 p-6 text-center text-white shadow-2xl"
        style={{
          background:
            "linear-gradient(145deg, rgba(40,15,60,0.97) 0%, rgba(20,8,35,0.97) 100%)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(147,51,234,0.35)",
        }}
      >
        <p className="mb-4 flex flex-wrap items-center justify-center gap-1 text-xs text-white/60">
          You give{" "}
          <TradeItemsRow
            properties={trade.offerPropertyDetails}
            propertyIds={trade.offerPropertyIds}
            cash={trade.offerCash}
            accent="give"
          />{" "}
          for their{" "}
          <TradeItemsRow
            properties={trade.requestPropertyDetails}
            propertyIds={trade.requestPropertyIds}
            cash={trade.requestCash}
            accent="get"
          />
        </p>
        {trade.status === "pending" && (
          <>
            <div className="relative mx-auto mb-3 h-20 w-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="h-20 w-20 rounded-full border-4 border-white/10"
                style={{ borderTopColor: "#facc15" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                🤝
              </div>
            </div>
            <h2 className="mb-1 text-lg font-black">
              Waiting on {trade.toName}&hellip;
            </h2>
            <p className="text-sm text-white/60">
              They&apos;re deciding whether to accept your offer.
            </p>
          </>
        )}
        {trade.status === "accepted" && (
          <div className="py-4">
            <div className="mb-2 text-4xl">🎉</div>
            <h2 className="text-lg font-black">
              {trade.toName} accepted your offer!
            </h2>
          </div>
        )}
        {trade.status === "declined" && (
          <div className="py-4">
            <div className="mb-2 text-4xl">💔</div>
            <h2 className="mb-1 text-lg font-black">
              {trade.toName} declined.
            </h2>
            <p className="text-sm text-white/60">{funnyLine}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Trade inbox ──────────────────────────────────────────────────────────
// A small floating panel showing trades sent to you (Accept/Decline) and
// trades you've sent (Cancel). Drop <TradeInbox roomId={...} userId={...} />
// once near the top-level of the game screen — it's self-contained.
//
// Also owns the auto-popping TradeOfferPopup: the moment a new incoming
// trade shows up in the query below, it's shown full-screen with the
// countdown, one at a time, without waiting for the person to open the
// panel themselves.
export function TradeInbox({
  roomId,
  userId,
}: {
  roomId: Id<"rooms">;
  userId: string;
}) {
  const trades = useQuery(api.trades.listTrades, { roomId, userId });
  const respondTrade = useMutation(api.trades.respondTrade);
  const cancelTrade = useMutation(api.trades.cancelTrade);
  const [open, setOpen] = useState(false);

  const incoming = trades?.incoming ?? [];
  const outgoing = trades?.outgoing ?? [];
  const total = incoming.length + outgoing.length;

  // Tracks ids that have already been shown as a popup and resolved, so a
  // stale query result can't re-trigger the same trade a second time.
  const dismissedIds = useRef<Set<string>>(new Set());
  const [activePopupId, setActivePopupId] = useState<string | null>(null);

  useEffect(() => {
    if (activePopupId) return;
    const next = incoming.find((t) => !dismissedIds.current.has(t._id));
    if (next) setActivePopupId(next._id);
  }, [incoming, activePopupId]);

  const activeTrade = incoming.find((t) => t._id === activePopupId) ?? null;

  if (total === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-purple-500"
      >
        🤝 Trades
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
          {total}
        </span>
      </button>

      {open && (
        <div className="absolute bottom-14 right-0 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/15 bg-neutral-900 p-3 text-white shadow-2xl">
          {incoming.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-white/50">
                Offers for you
              </h4>
              {incoming.map((t) => {
                return (
                  <div
                    key={t._id}
                    className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs"
                  >
                    <p className="mb-1 font-semibold">{t.fromName} offers:</p>
                    <p className="flex flex-wrap items-center gap-1 text-white/70">
                      Gives you{" "}
                      <TradeItemsRow
                        properties={t.offerPropertyDetails}
                        propertyIds={t.offerPropertyIds}
                        cash={t.offerCash}
                        accent="give"
                      />{" "}
                      for your{" "}
                      <TradeItemsRow
                        properties={t.requestPropertyDetails}
                        propertyIds={t.requestPropertyIds}
                        cash={t.requestCash}
                        accent="get"
                      />
                    </p>
                    <div className="mt-1.5 flex gap-1.5">
                      <button
                        onClick={async () => {
                          try {
                            await respondTrade({
                              tradeId: t._id,
                              userId,
                              accept: true,
                            });
                            toast.success("Trade accepted!");
                          } catch (e: unknown) {
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Couldn't accept trade",
                            );
                          }
                        }}
                        className="flex-1 rounded-md bg-emerald-500 px-2 py-1 font-semibold hover:bg-emerald-400"
                      >
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await respondTrade({
                              tradeId: t._id,
                              userId,
                              accept: false,
                            });
                          } catch (e: unknown) {
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Couldn't decline trade",
                            );
                          }
                        }}
                        className="flex-1 rounded-md bg-white/10 px-2 py-1 font-semibold hover:bg-white/20"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {outgoing.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-white/50">
                Your pending offers
              </h4>
              {outgoing.map((t) => {
                return (
                  <div
                    key={t._id}
                    className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs"
                  >
                    <p className="mb-1 font-semibold">To {t.toName}:</p>
                    <p className="flex flex-wrap items-center gap-1 text-white/70">
                      You give{" "}
                      <TradeItemsRow
                        properties={t.offerPropertyDetails}
                        propertyIds={t.offerPropertyIds}
                        cash={t.offerCash}
                        accent="give"
                      />{" "}
                      for{" "}
                      <TradeItemsRow
                        properties={t.requestPropertyDetails}
                        propertyIds={t.requestPropertyIds}
                        cash={t.requestCash}
                        accent="get"
                      />
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          await cancelTrade({ tradeId: t._id, userId });
                        } catch (e: unknown) {
                          toast.error(
                            e instanceof Error
                              ? e.message
                              : "Couldn't cancel trade",
                          );
                        }
                      }}
                      className="mt-1.5 w-full rounded-md bg-white/10 px-2 py-1 font-semibold hover:bg-white/20"
                    >
                      Cancel offer
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTrade && (
        <TradeOfferPopup
          trade={activeTrade}
          userId={userId}
          onDone={() => {
            dismissedIds.current.add(activeTrade._id);
            setActivePopupId(null);
          }}
        />
      )}
    </div>
  );
}

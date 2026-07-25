"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { PropertyIcon } from "./PropertyIcon";

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
}: {
  roomId: Id<"rooms">;
  me: TradeablePlayer;
  opponent: TradeablePlayer;
  onClose: () => void;
}) {
  const proposeTrade = useMutation(api.trades.proposeTrade);
  const [offerIds, setOfferIds] = useState<string[]>([]);
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
      await proposeTrade({
        roomId,
        fromUserId: me.userId,
        toUserId: opponent.userId,
        offerPropertyIds: offerIds,
        offerCash,
        requestPropertyIds: requestIds,
        requestCash,
      });
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

// ─── Trade inbox ──────────────────────────────────────────────────────────
// A small floating panel showing trades sent to you (Accept/Decline) and
// trades you've sent (Cancel). Drop <TradeInbox roomId={...} userId={...} />
// once near the top-level of the game screen — it's self-contained.
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

  if (total === 0) return null;

  const describe = (t: {
    offerPropertyIds: string[];
    offerCash: number;
    requestPropertyIds: string[];
    requestCash: number;
  }) => {
    const give: string[] = [];
    if (t.offerPropertyIds.length)
      give.push(
        `${t.offerPropertyIds.length} propert${t.offerPropertyIds.length === 1 ? "y" : "ies"}`,
      );
    if (t.offerCash) give.push(`$${t.offerCash.toLocaleString()}`);
    const get: string[] = [];
    if (t.requestPropertyIds.length)
      get.push(
        `${t.requestPropertyIds.length} propert${t.requestPropertyIds.length === 1 ? "y" : "ies"}`,
      );
    if (t.requestCash) get.push(`$${t.requestCash.toLocaleString()}`);
    return {
      give: give.join(" + ") || "nothing",
      get: get.join(" + ") || "nothing",
    };
  };

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
                const d = describe(t);
                return (
                  <div
                    key={t._id}
                    className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs"
                  >
                    <p className="mb-1 font-semibold">{t.fromName} offers:</p>
                    <p className="text-white/70">
                      Gives you{" "}
                      <span className="text-emerald-300">{d.give}</span> for
                      your <span className="text-amber-300">{d.get}</span>
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
                const d = describe(t);
                return (
                  <div
                    key={t._id}
                    className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs"
                  >
                    <p className="mb-1 font-semibold">To {t.toName}:</p>
                    <p className="text-white/70">
                      You give{" "}
                      <span className="text-emerald-300">{d.give}</span> for{" "}
                      <span className="text-amber-300">{d.get}</span>
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
    </div>
  );
}

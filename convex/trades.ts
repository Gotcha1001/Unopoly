import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Trading ────────────────────────────────────────────────────────────
// Lets two players in the same room swap properties and/or cash. A trade
// is just an offer sitting in the `trades` table until the recipient
// accepts, declines, or the proposer cancels it. Nothing moves hands
// until `respondTrade` is called with accept: true — proposing a trade
// never touches money or property ownership on its own.

type PropertyHolding = Doc<"players">["properties"][number];

async function getPlayer(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">,
  userId: string,
): Promise<Doc<"players"> | null> {
  return await ctx.db
    .query("players")
    .withIndex("by_user_room", (q) =>
      q.eq("userId", userId).eq("roomId", roomId),
    )
    .first();
}

// All trades relevant to a player in a room: pending offers sent TO them,
// and pending offers THEY sent (so they can see/cancel their own asks).
export const listTrades = query({
  args: { roomId: v.id("rooms"), userId: v.string() },
  handler: async (
    ctx,
    { roomId, userId },
  ): Promise<{ incoming: Doc<"trades">[]; outgoing: Doc<"trades">[] }> => {
    const roomTrades = await ctx.db
      .query("trades")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    const pending = roomTrades.filter((t) => t.status === "pending");
    return {
      incoming: pending.filter((t) => t.toUserId === userId),
      outgoing: pending.filter((t) => t.fromUserId === userId),
    };
  },
});

export const proposeTrade = mutation({
  args: {
    roomId: v.id("rooms"),
    fromUserId: v.string(),
    toUserId: v.string(),
    offerPropertyIds: v.array(v.string()),
    offerCash: v.number(),
    requestPropertyIds: v.array(v.string()),
    requestCash: v.number(),
  },
  handler: async (
    ctx,
    {
      roomId,
      fromUserId,
      toUserId,
      offerPropertyIds,
      offerCash,
      requestPropertyIds,
      requestCash,
    },
  ): Promise<Id<"trades">> => {
    if (fromUserId === toUserId) {
      throw new Error("You can't trade with yourself");
    }
    if (
      offerPropertyIds.length === 0 &&
      requestPropertyIds.length === 0 &&
      offerCash <= 0 &&
      requestCash <= 0
    ) {
      throw new Error("Offer something before sending a trade");
    }
    if (offerCash < 0 || requestCash < 0) {
      throw new Error("Cash amounts can't be negative");
    }

    const fromPlayer = await getPlayer(ctx, roomId, fromUserId);
    const toPlayer = await getPlayer(ctx, roomId, toUserId);
    if (!fromPlayer || !toPlayer) throw new Error("Player not found");

    if (offerCash > (fromPlayer.money ?? 0)) {
      throw new Error("You don't have that much cash to offer");
    }
    const fromOwned = new Set(
      (fromPlayer.properties ?? []).map((p: PropertyHolding) => p.instanceId),
    );
    if (!offerPropertyIds.every((id) => fromOwned.has(id))) {
      throw new Error("You don't own one of the properties you're offering");
    }
    const toOwned = new Set(
      (toPlayer.properties ?? []).map((p: PropertyHolding) => p.instanceId),
    );
    if (!requestPropertyIds.every((id) => toOwned.has(id))) {
      throw new Error(
        `${toPlayer.name} doesn't own one of the properties you're requesting`,
      );
    }

    const tradeId = await ctx.db.insert("trades", {
      roomId,
      fromUserId,
      fromName: fromPlayer.name,
      toUserId,
      toName: toPlayer.name,
      offerPropertyIds,
      offerCash,
      requestPropertyIds,
      requestCash,
      status: "pending",
      createdAt: Date.now(),
    });

    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (game) {
      await ctx.db.patch(game._id, {
        lastAction: `🤝 ${fromPlayer.name} proposed a trade to ${toPlayer.name}.`,
      });
    }

    return tradeId;
  },
});

export const cancelTrade = mutation({
  args: { tradeId: v.id("trades"), userId: v.string() },
  handler: async (ctx, { tradeId, userId }): Promise<void> => {
    const trade = await ctx.db.get(tradeId);
    if (!trade) throw new Error("Trade not found");
    if (trade.fromUserId !== userId) {
      throw new Error("Only the proposer can cancel this trade");
    }
    if (trade.status !== "pending") throw new Error("Trade already resolved");
    await ctx.db.patch(tradeId, {
      status: "cancelled",
      resolvedAt: Date.now(),
    });
  },
});

export const respondTrade = mutation({
  args: { tradeId: v.id("trades"), userId: v.string(), accept: v.boolean() },
  handler: async (ctx, { tradeId, userId, accept }): Promise<void> => {
    const trade = await ctx.db.get(tradeId);
    if (!trade) throw new Error("Trade not found");
    if (trade.toUserId !== userId) {
      throw new Error("This trade wasn't sent to you");
    }
    if (trade.status !== "pending") throw new Error("Trade already resolved");

    if (!accept) {
      await ctx.db.patch(tradeId, {
        status: "declined",
        resolvedAt: Date.now(),
      });
      const game = await ctx.db
        .query("games")
        .withIndex("by_room", (q) => q.eq("roomId", trade.roomId))
        .first();
      if (game) {
        await ctx.db.patch(game._id, {
          lastAction: `${trade.toName} declined ${trade.fromName}'s trade offer.`,
        });
      }
      return;
    }

    const fromPlayer = await getPlayer(ctx, trade.roomId, trade.fromUserId);
    const toPlayer = await getPlayer(ctx, trade.roomId, trade.toUserId);
    if (!fromPlayer || !toPlayer) throw new Error("Player not found");

    // Re-validate everything at accept time — properties/cash may have
    // moved (sold, upgraded, spent, another trade) since the offer went out.
    if ((fromPlayer.money ?? 0) < trade.offerCash) {
      throw new Error(`${trade.fromName} no longer has enough cash`);
    }
    if ((toPlayer.money ?? 0) < trade.requestCash) {
      throw new Error("You no longer have enough cash for this trade");
    }
    const fromProps = fromPlayer.properties ?? [];
    const toProps = toPlayer.properties ?? [];
    const offered = fromProps.filter((p: PropertyHolding) =>
      trade.offerPropertyIds.includes(p.instanceId),
    );
    const requested = toProps.filter((p: PropertyHolding) =>
      trade.requestPropertyIds.includes(p.instanceId),
    );
    if (offered.length !== trade.offerPropertyIds.length) {
      throw new Error(
        `${trade.fromName} no longer owns one of those properties`,
      );
    }
    if (requested.length !== trade.requestPropertyIds.length) {
      throw new Error("You no longer own one of the requested properties");
    }

    const newFromProps: PropertyHolding[] = [
      ...fromProps.filter(
        (p: PropertyHolding) => !trade.offerPropertyIds.includes(p.instanceId),
      ),
      ...requested,
    ];
    const newToProps: PropertyHolding[] = [
      ...toProps.filter(
        (p: PropertyHolding) =>
          !trade.requestPropertyIds.includes(p.instanceId),
      ),
      ...offered,
    ];

    await ctx.db.patch(fromPlayer._id, {
      money: (fromPlayer.money ?? 0) - trade.offerCash + trade.requestCash,
      properties: newFromProps,
    });
    await ctx.db.patch(toPlayer._id, {
      money: (toPlayer.money ?? 0) - trade.requestCash + trade.offerCash,
      properties: newToProps,
    });
    await ctx.db.patch(tradeId, {
      status: "accepted",
      resolvedAt: Date.now(),
    });

    // Any other pending trades that reference a property which just
    // changed hands are now invalid — auto-decline them so no one can
    // accept a trade for a property they don't own anymore.
    const movedIds = new Set([
      ...trade.offerPropertyIds,
      ...trade.requestPropertyIds,
    ]);
    const roomTrades = await ctx.db
      .query("trades")
      .withIndex("by_room", (q) => q.eq("roomId", trade.roomId))
      .collect();
    for (const t of roomTrades) {
      if (
        t._id !== tradeId &&
        t.status === "pending" &&
        [...t.offerPropertyIds, ...t.requestPropertyIds].some((id) =>
          movedIds.has(id),
        )
      ) {
        await ctx.db.patch(t._id, {
          status: "declined",
          resolvedAt: Date.now(),
        });
      }
    }

    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", trade.roomId))
      .first();
    if (game) {
      const bits: string[] = [];
      if (offered.length)
        bits.push(
          `${offered.length} propert${offered.length === 1 ? "y" : "ies"}`,
        );
      if (trade.offerCash) bits.push(`$${trade.offerCash.toLocaleString()}`);
      const gaveStr = bits.join(" + ") || "nothing";
      await ctx.db.patch(game._id, {
        lastAction: `🤝 ${trade.fromName} and ${trade.toName} completed a trade (${trade.fromName} gave ${gaveStr})!`,
      });
    }
  },
});

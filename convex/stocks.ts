import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { STOCKS } from "../lib/Stocks";

type StockPrice = { id: string; price: number };

function basePrices(): StockPrice[] {
  return STOCKS.map((s) => ({ id: s.id, price: s.basePrice }));
}

async function getGameByRoom(ctx: QueryCtx | MutationCtx, roomId: Id<"rooms">) {
  return ctx.db
    .query("games")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .first();
}

async function getPlayer(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">,
  userId: string,
) {
  return ctx.db
    .query("players")
    .withIndex("by_user_room", (q) =>
      q.eq("userId", userId).eq("roomId", roomId),
    )
    .first();
}

// ─── Public: current market ─────────────────────────────────────────────
// Joins live prices (or base prices if the game hasn't run a payday yet)
// with the static catalog, plus % change since the previous payday, so
// the client gets everything it needs in one query.
export const getMarket = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const game = await getGameByRoom(ctx, roomId);
    const live = game?.stockPrices ?? basePrices();
    const priceById = new Map(live.map((p) => [p.id, p.price]));
    const history = game?.stockPriceHistory ?? [];
    const prevSnapshot =
      history.length >= 2 ? history[history.length - 2].prices : null;
    const prevById = new Map((prevSnapshot ?? []).map((p) => [p.id, p.price]));
    return STOCKS.map((s) => {
      const price = priceById.get(s.id) ?? s.basePrice;
      const prev = prevById.get(s.id);
      const pctChange = prev ? ((price - prev) / prev) * 100 : undefined;
      return { ...s, price, pctChange };
    });
  },
});

// ─── Buy ─────────────────────────────────────────────────────────────────
export const buyShares = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.string(),
    stockId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, { roomId, userId, stockId, quantity }) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Enter a whole number of shares greater than 0");
    }
    const stock = STOCKS.find((s) => s.id === stockId);
    if (!stock) throw new Error("Unknown stock");
    const game = await getGameByRoom(ctx, roomId);
    const live = game?.stockPrices ?? basePrices();
    const price = live.find((p) => p.id === stockId)?.price ?? stock.basePrice;
    const cost = price * quantity;
    const player = await getPlayer(ctx, roomId, userId);
    if (!player) throw new Error("Player not found");
    if (cost > player.money) {
      throw new Error("You don't have enough cash for that");
    }
    const holdings = player.shares ?? [];
    const existing = holdings.find((h) => h.stockId === stockId);
    const nextHoldings = existing
      ? holdings.map((h) => {
          if (h.stockId !== stockId) return h;
          const totalQty = h.quantity + quantity;
          const totalCost = h.avgCost * h.quantity + cost;
          return { ...h, quantity: totalQty, avgCost: totalCost / totalQty };
        })
      : [...holdings, { stockId, quantity, avgCost: price }];
    await ctx.db.patch(player._id, {
      money: player.money - cost,
      shares: nextHoldings,
    });
    if (game) {
      await ctx.db.patch(game._id, {
        lastAction: `📈 ${player.name} bought ${quantity} share${quantity === 1 ? "" : "s"} of ${stock.symbol}.`,
      });
    }
    return { price, cost };
  },
});

// ─── Sell — allowed anytime, not just on the player's turn ──────────────
export const sellShares = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.string(),
    stockId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, { roomId, userId, stockId, quantity }) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Enter a whole number of shares greater than 0");
    }
    const stock = STOCKS.find((s) => s.id === stockId);
    if (!stock) throw new Error("Unknown stock");
    const player = await getPlayer(ctx, roomId, userId);
    if (!player) throw new Error("Player not found");
    const holdings = player.shares ?? [];
    const existing = holdings.find((h) => h.stockId === stockId);
    if (!existing || existing.quantity < quantity) {
      throw new Error("You don't own that many shares");
    }
    const game = await getGameByRoom(ctx, roomId);
    const live = game?.stockPrices ?? basePrices();
    const price = live.find((p) => p.id === stockId)?.price ?? stock.basePrice;
    const proceeds = price * quantity;
    const remaining = existing.quantity - quantity;
    const nextHoldings =
      remaining > 0
        ? holdings.map((h) =>
            h.stockId === stockId ? { ...h, quantity: remaining } : h,
          )
        : holdings.filter((h) => h.stockId !== stockId);
    await ctx.db.patch(player._id, {
      money: player.money + proceeds,
      shares: nextHoldings,
    });
    if (game) {
      await ctx.db.patch(game._id, {
        lastAction: `📉 ${player.name} sold ${quantity} share${quantity === 1 ? "" : "s"} of ${stock.symbol}.`,
      });
    }
    return { price, proceeds };
  },
});

// ─── Payday fluctuation ──────────────────────────────────────────────────
// Call this from game.ts's paySalaryIfDue, once per payday, alongside the
// salary/rent/interest payouts — see convex/game.stocks-integration.md for
// the exact call site. Bounded random walk per stock: each stock moves by
// up to its own `volatility` (see lib/Stocks.ts), floored at $1 so a price
// can never hit zero, with a small built-in upward bias so a long game
// trends up on average instead of decaying to nothing.
const MAX_HISTORY_ENTRIES = 20;

export const fluctuatePrices = internalMutation({
  args: { roomId: v.id("rooms"), turnCount: v.number() },
  handler: async (ctx, { roomId, turnCount }) => {
    const game = await getGameByRoom(ctx, roomId);
    if (!game) return;
    const current = game.stockPrices ?? basePrices();
    const changes: { id: string; price: number; pctChange: number }[] = [];
    const next = current.map((p) => {
      const stock = STOCKS.find((s) => s.id === p.id);
      const volatility = stock?.volatility ?? 0.1;
      const swing = (Math.random() * 2 - 1) * volatility + volatility * 0.08;
      const nextPrice = Math.max(1, Math.round(p.price * (1 + swing)));
      const pctChange =
        p.price > 0 ? ((nextPrice - p.price) / p.price) * 100 : 0;
      changes.push({ id: p.id, price: nextPrice, pctChange });
      return { id: p.id, price: nextPrice };
    });
    const history = game.stockPriceHistory ?? [];
    const nextHistory = [...history, { turnCount, prices: next }].slice(
      -MAX_HISTORY_ENTRIES,
    );
    await ctx.db.patch(game._id, {
      stockPrices: next,
      stockPriceHistory: nextHistory,
      stockMarketNotice: { turnCount, changes, at: Date.now() },
    });
  },
});

// import { v } from "convex/values";
// import { internalMutation, internalQuery, query } from "./_generated/server";

// export const getPlayersForCoach = internalQuery({
//   args: { roomId: v.id("rooms") },
//   handler: async (ctx, { roomId }) =>
//     ctx.db
//       .query("players")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .collect(),
// });

// export const getGameForCoach = internalQuery({
//   args: { roomId: v.id("rooms") },
//   handler: async (ctx, { roomId }) =>
//     ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first(),
// });

// export const startCommentary = internalMutation({
//   args: { roomId: v.id("rooms"), turnCount: v.number() },
//   handler: async (ctx, { roomId, turnCount }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game) return;
//     const players = await ctx.db
//       .query("players")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .collect();

//     const humanPlayers = players.filter((p) => !p.isBot);
//     const at = Date.now();
//     await ctx.db.patch(game._id, {
//       coachCommentary: humanPlayers.map((p) => ({
//         userId: p.userId,
//         text: "",
//         status: "pending" as const,
//         turnCount,
//         at,
//       })),
//     });
//   },
// });

// export const appendCommentaryChunk = internalMutation({
//   args: {
//     roomId: v.id("rooms"),
//     turnCount: v.number(),
//     userId: v.string(),
//     textSoFar: v.string(),
//   },
//   handler: async (ctx, { roomId, turnCount, userId, textSoFar }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game?.coachCommentary) return;
//     let touched = false;
//     const next = game.coachCommentary.map((entry) => {
//       if (entry.userId !== userId || entry.turnCount !== turnCount) {
//         return entry;
//       }
//       touched = true;
//       return { ...entry, text: textSoFar, status: "streaming" as const };
//     });
//     // Guard against a late chunk from a stale/previous payday landing here.
//     if (!touched) return;
//     await ctx.db.patch(game._id, { coachCommentary: next });
//   },
// });

// export const finishCommentary = internalMutation({
//   args: {
//     roomId: v.id("rooms"),
//     turnCount: v.number(),
//     userId: v.string(),
//     text: v.string(),
//   },
//   handler: async (ctx, { roomId, turnCount, userId, text }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game) return;
//     const existing = game.coachCommentary ?? [];
//     const at = Date.now();
//     let touched = false;
//     const next = existing.map((entry) => {
//       if (entry.userId !== userId || entry.turnCount !== turnCount) {
//         return entry;
//       }
//       touched = true;
//       return { ...entry, text, status: "done" as const, at };
//     });
//     // Even if turnCount has since moved on, still write the final record
//     // so a slow response doesn't just vanish — the client filters by
//     // userId+turnCount anyway, so a stale/extra write here is harmless.
//     await ctx.db.patch(game._id, {
//       coachCommentary: touched
//         ? next
//         : [
//             ...existing,
//             { userId, text, status: "done" as const, turnCount, at },
//           ],
//     });
//   },
// });

// export const getCommentary = query({
//   args: { roomId: v.id("rooms"), turnCount: v.number(), userId: v.string() },
//   handler: async (ctx, { roomId, turnCount, userId }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game?.coachCommentary) return null;
//     const entry = game.coachCommentary.find(
//       (e) => e.userId === userId && e.turnCount === turnCount,
//     );
//     if (!entry) return null;
//     const { status, text } = entry;
//     return { status, text };
//   },
// });

// export const startWinCommentary = internalMutation({
//   args: { roomId: v.id("rooms") },
//   handler: async (ctx, { roomId }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game) return;
//     await ctx.db.patch(game._id, {
//       winCommentary: { text: "", status: "pending" as const, at: Date.now() },
//     });
//   },
// });

// export const appendWinCommentaryChunk = internalMutation({
//   args: { roomId: v.id("rooms"), textSoFar: v.string() },
//   handler: async (ctx, { roomId, textSoFar }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game?.winCommentary) return;
//     await ctx.db.patch(game._id, {
//       winCommentary: {
//         ...game.winCommentary,
//         text: textSoFar,
//         status: "streaming" as const,
//       },
//     });
//   },
// });

// export const finishWinCommentary = internalMutation({
//   args: { roomId: v.id("rooms"), text: v.string() },
//   handler: async (ctx, { roomId, text }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game) return;
//     await ctx.db.patch(game._id, {
//       winCommentary: { text, status: "done" as const, at: Date.now() },
//     });
//   },
// });

// export const getWinCommentary = query({
//   args: { roomId: v.id("rooms") },
//   handler: async (ctx, { roomId }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     return game?.winCommentary ?? null;
//   },
// });
import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

export const getPlayersForCoach = internalQuery({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) =>
    ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect(),
});

export const getGameForCoach = internalQuery({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) =>
    ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first(),
});

// ─── Payday commentary (unchanged from before) ─────────────────────────
export const startCommentary = internalMutation({
  args: { roomId: v.id("rooms"), turnCount: v.number() },
  handler: async (ctx, { roomId, turnCount }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game) return;
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    const humanPlayers = players.filter((p) => !p.isBot);
    const at = Date.now();
    await ctx.db.patch(game._id, {
      coachCommentary: humanPlayers.map((p) => ({
        userId: p.userId,
        text: "",
        status: "pending" as const,
        turnCount,
        at,
      })),
    });
  },
});

export const appendCommentaryChunk = internalMutation({
  args: {
    roomId: v.id("rooms"),
    turnCount: v.number(),
    userId: v.string(),
    textSoFar: v.string(),
  },
  handler: async (ctx, { roomId, turnCount, userId, textSoFar }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game?.coachCommentary) return;
    let touched = false;
    const next = game.coachCommentary.map((entry) => {
      if (entry.userId !== userId || entry.turnCount !== turnCount)
        return entry;
      touched = true;
      return { ...entry, text: textSoFar, status: "streaming" as const };
    });
    if (!touched) return;
    await ctx.db.patch(game._id, { coachCommentary: next });
  },
});

export const finishCommentary = internalMutation({
  args: {
    roomId: v.id("rooms"),
    turnCount: v.number(),
    userId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { roomId, turnCount, userId, text }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game) return;
    const existing = game.coachCommentary ?? [];
    const at = Date.now();
    let touched = false;
    const next = existing.map((entry) => {
      if (entry.userId !== userId || entry.turnCount !== turnCount)
        return entry;
      touched = true;
      return { ...entry, text, status: "done" as const, at };
    });
    await ctx.db.patch(game._id, {
      coachCommentary: touched
        ? next
        : [
            ...existing,
            { userId, text, status: "done" as const, turnCount, at },
          ],
    });
  },
});

export const getCommentary = query({
  args: { roomId: v.id("rooms"), turnCount: v.number(), userId: v.string() },
  handler: async (ctx, { roomId, turnCount, userId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game?.coachCommentary) return null;
    const entry = game.coachCommentary.find(
      (e) => e.userId === userId && e.turnCount === turnCount,
    );
    if (!entry) return null;
    const { status, text } = entry;
    return { status, text };
  },
});

// ─── Win commentary — multiplayer/room games ───────────────────────────
export const startWinCommentary = internalMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game) return;
    await ctx.db.patch(game._id, {
      winCommentary: { text: "", status: "pending" as const, at: Date.now() },
    });
  },
});

export const appendWinCommentaryChunk = internalMutation({
  args: { roomId: v.id("rooms"), textSoFar: v.string() },
  handler: async (ctx, { roomId, textSoFar }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game?.winCommentary) return;
    await ctx.db.patch(game._id, {
      winCommentary: {
        ...game.winCommentary,
        text: textSoFar,
        status: "streaming" as const,
      },
    });
  },
});

export const finishWinCommentary = internalMutation({
  args: { roomId: v.id("rooms"), text: v.string() },
  handler: async (ctx, { roomId, text }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game) return;
    await ctx.db.patch(game._id, {
      winCommentary: { text, status: "done" as const, at: Date.now() },
    });
  },
});

export const getWinCommentary = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    return game?.winCommentary ?? null;
  },
});

// ─── Win commentary — standalone LocalPlayPage sessions ────────────────
// Same three-state dance as everything above, just keyed by a client-
// generated sessionId instead of a roomId since there's no room/game doc.
export const startLocalCommentary = internalMutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const existing = await ctx.db
      .query("localCommentary")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();
    const at = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        text: "",
        status: "pending" as const,
        at,
      });
    } else {
      await ctx.db.insert("localCommentary", {
        sessionId,
        text: "",
        status: "pending" as const,
        at,
      });
    }
  },
});

export const appendLocalCommentaryChunk = internalMutation({
  args: { sessionId: v.string(), textSoFar: v.string() },
  handler: async (ctx, { sessionId, textSoFar }) => {
    const row = await ctx.db
      .query("localCommentary")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();
    if (!row) return;
    await ctx.db.patch(row._id, {
      text: textSoFar,
      status: "streaming" as const,
    });
  },
});

export const finishLocalCommentary = internalMutation({
  args: { sessionId: v.string(), text: v.string() },
  handler: async (ctx, { sessionId, text }) => {
    const row = await ctx.db
      .query("localCommentary")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();
    if (!row) return;
    await ctx.db.patch(row._id, {
      text,
      status: "done" as const,
      at: Date.now(),
    });
  },
});

export const getLocalCommentary = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const row = await ctx.db
      .query("localCommentary")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();
    if (!row) return null;
    const { status, text } = row;
    return { status, text };
  },
});

// House-keeping: local sessions never get "reset" the way rooms do, so old
// rows would otherwise accumulate forever. Call this from a cron (Convex
// scheduled function) e.g. daily, or fire-and-forget it whenever a new
// local session starts.
export const pruneOldLocalCommentary = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const stale = await ctx.db.query("localCommentary").collect();
    await Promise.all(
      stale.filter((r) => r.at < cutoff).map((r) => ctx.db.delete(r._id)),
    );
  },
});

// // convex/coachData.ts
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

// // ─── Called synchronously from the payday mutation itself, BEFORE the
// // generation action is even scheduled. This is what kills the race: by
// // the time the client's turnCount changes, coachCommentary.turnCount
// // already matches it with status "pending" — so the UI never has a
// // window where it looks like "not a coach week" while actually just
// // waiting on the LLM. ─────────────────────────────────────────────────
// export const startCommentary = internalMutation({
//   args: { roomId: v.id("rooms"), turnCount: v.number() },
//   handler: async (ctx, { roomId, turnCount }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game) return;
//     await ctx.db.patch(game._id, {
//       coachCommentary: {
//         text: "",
//         status: "pending",
//         turnCount,
//         at: Date.now(),
//       },
//     });
//   },
// });

// // ─── Called repeatedly (throttled) while tokens stream in from
// // OpenRouter. Appends to the existing text rather than replacing it,
// // and flips status to "streaming" so the client knows generation has
// // actually started producing output. ───────────────────────────────
// export const appendCommentaryChunk = internalMutation({
//   args: { roomId: v.id("rooms"), turnCount: v.number(), textSoFar: v.string() },
//   handler: async (ctx, { roomId, turnCount, textSoFar }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game?.coachCommentary) return;
//     // Guard against a late chunk from a stale/previous payday landing here.
//     if (game.coachCommentary.turnCount !== turnCount) return;
//     await ctx.db.patch(game._id, {
//       coachCommentary: {
//         ...game.coachCommentary,
//         text: textSoFar,
//         status: "streaming",
//       },
//     });
//   },
// });

// export const finishCommentary = internalMutation({
//   args: { roomId: v.id("rooms"), turnCount: v.number(), text: v.string() },
//   handler: async (ctx, { roomId, turnCount, text }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game) return;
//     // Even if turnCount has since moved on, still write the final record
//     // so a slow response doesn't just vanish — the client filters by
//     // turnCount anyway, so a stale write here is harmless.
//     await ctx.db.patch(game._id, {
//       coachCommentary: { text, status: "done", turnCount, at: Date.now() },
//     });
//   },
// });

// // ─── Public query the client subscribes to. Returns:
// //   null                             -> no commentary for THIS turn
// //                                        (not a coach week, or Convex
// //                                        still doing its initial fetch)
// //   { status: "pending", text: "" }  -> coach hasn't started producing
// //                                        tokens yet -> show "please wait"
// //   { status: "streaming", text }    -> tokens arriving -> render text,
// //                                        it'll keep growing
// //   { status: "done", text }         -> finished
// export const getCommentary = query({
//   args: { roomId: v.id("rooms"), turnCount: v.number() },
//   handler: async (ctx, { roomId, turnCount }) => {
//     const game = await ctx.db
//       .query("games")
//       .withIndex("by_room", (q) => q.eq("roomId", roomId))
//       .first();
//     if (!game?.coachCommentary) return null;
//     if (game.coachCommentary.turnCount !== turnCount) return null;
//     const { status, text } = game.coachCommentary;
//     return { status, text };
//   },
// });
// convex/coachData.ts
// convex/coachData.ts
import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

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

// ─── Called synchronously from the payday mutation itself, BEFORE the
// generation action is even scheduled. Seeds one "pending" entry PER
// PLAYER (not one shared entry for the room) so every client's own
// getCommentary(userId) query immediately has a row to read the instant
// the new turnCount lands — no window where it looks like "not a coach
// week" for anyone at the table. ─────────────────────────────────────
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
    // Bots don't open the payday modal, so they don't need — and
    // shouldn't burn an LLM call for — their own commentary row. Only
    // seed pending entries for real (non-bot) players.
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

// ─── Called repeatedly (throttled) while tokens stream in from
// OpenRouter, once per PLAYER — only patches that player's entry in the
// array, leaving everyone else's commentary untouched. ──────────────
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
      if (entry.userId !== userId || entry.turnCount !== turnCount) {
        return entry;
      }
      touched = true;
      return { ...entry, text: textSoFar, status: "streaming" as const };
    });
    // Guard against a late chunk from a stale/previous payday landing here.
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
      if (entry.userId !== userId || entry.turnCount !== turnCount) {
        return entry;
      }
      touched = true;
      return { ...entry, text, status: "done" as const, at };
    });
    // Even if turnCount has since moved on, still write the final record
    // so a slow response doesn't just vanish — the client filters by
    // userId+turnCount anyway, so a stale/extra write here is harmless.
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

// ─── Public query the client subscribes to, now scoped to the calling
// player's own userId. Returns:
//   null                             -> no commentary for THIS player
//                                        this turn (not a coach week, or
//                                        Convex's initial-fetch loading
//                                        state)
//   { status: "pending", text: "" }  -> coach hasn't started producing
//                                        tokens yet -> show "please wait"
//   { status: "streaming", text }    -> tokens arriving -> render text,
//                                        it'll keep growing
//   { status: "done", text }         -> finished
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

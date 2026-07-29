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

export const writeCommentary = internalMutation({
  args: { roomId: v.id("rooms"), text: v.string(), turnCount: v.number() },
  handler: async (ctx, { roomId, text, turnCount }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game) return;
    await ctx.db.patch(game._id, {
      coachCommentary: { text, turnCount, at: Date.now() },
    });
  },
});
export const getCommentary = query({
  args: { roomId: v.id("rooms"), turnCount: v.number() },
  handler: async (ctx, { roomId, turnCount }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game?.coachCommentary) return null;
    // Only return it if it matches the turn the client is asking about —
    // stops a stale commentary from a previous payday leaking through.
    if (game.coachCommentary.turnCount !== turnCount) return null;
    return game.coachCommentary.text;
  },
});

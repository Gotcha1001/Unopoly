import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deposit = mutation({
  args: { roomId: v.id("rooms"), userId: v.string(), amount: v.number() },
  handler: async (ctx, { roomId, userId, amount }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .unique();
    if (!player) throw new Error("Player not found");
    if (amount <= 0 || amount > player.money)
      throw new Error("Invalid deposit amount");
    await ctx.db.patch(player._id, {
      money: player.money - amount,
      savings: (player.savings ?? 0) + amount,
    });
  },
});

export const withdraw = mutation({
  args: { roomId: v.id("rooms"), userId: v.string(), amount: v.number() },
  handler: async (ctx, { roomId, userId, amount }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .unique();
    if (!player) throw new Error("Player not found");
    const savings = player.savings ?? 0;
    if (amount <= 0 || amount > savings)
      throw new Error("Invalid withdrawal amount");
    await ctx.db.patch(player._id, {
      money: player.money + amount, // your rule: this can push money above 0 even if it was negative
      savings: savings - amount,
    });
  },
});

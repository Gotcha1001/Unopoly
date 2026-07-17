import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  rooms: defineTable({
    name: v.string(),
    hostId: v.string(),
    hostName: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("finished"),
    ),
    maxPlayers: v.number(),
    playerIds: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  players: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    isBot: v.boolean(),
    isReady: v.boolean(),
    isConnected: v.boolean(),
    hand: v.array(v.string()),
    seatIndex: v.number(),
    // ─── Monopoly-Uno additions ────────────────────────────────────────
    // Cash on hand. Starts at STARTING_MONEY (see rooms.ts) and is adjusted
    // by "life" event cards (lottery wins, bills, etc.), property deals,
    // and now the optional Gamble stack too.
    money: v.number(),
    // Properties the player has actually bought (accepted the offer for).
    properties: v.array(
      v.object({
        instanceId: v.string(), // NEW — unique per owned copy, needed to target upgrades
        id: v.string(),
        name: v.string(),
        price: v.number(),
        value: v.number(),
        invested: v.number(), // NEW — price + $ spent on upgrades; drives rent
        upgrades: v.array(v.string()), // NEW — upgrade ids purchased, in tier order
      }),
    ),
    // Set the instant a "property" card is DRAWN by this player --- it never
    // enters their hand. Each entry is a house/hotel/etc. offer they can
    // still Accept or Decline via game.respondProperty. A queue (not a
    // single object) so drawing more than one property in the same turn
    // (e.g. a forced 2-card draw) doesn't clobber an earlier offer.
    pendingProperties: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          price: v.number(),
          value: v.number(),
        }),
      ),
    ),
    // Set the instant a "life" (money/expense) card is DRAWN by this
    // player --- the money is applied immediately and these entries exist
    // purely so the client can pop up a "you got/owed $X" modal, then
    // clear them via game.acknowledgeLifeEvents. The card never enters
    // the hand at all.
    pendingLifeEvents: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          amount: v.number(),
        }),
      ),
    ),
    // ─── Gamble stack additions ─────────────────────────────────────────
    // A side stack the player can OPTIONALLY tap during their own turn.
    // Unlike life-event cards (which are forced whenever they're drawn
    // from the main deck), this is purely elective and never ends the
    // turn --- the player still has to play a card or draw to actually
    // pass play. Money is applied the instant they pull a gamble card;
    // this field just carries the result to the client for a "you won/
    // lost $X" modal, cleared via game.acknowledgeGambleEvent.
    pendingGambleEvent: v.optional(
      v.object({
        id: v.string(),
        label: v.string(),
        description: v.string(),
        // Actual signed amount applied to `money` (for a wipeout this is
        // -(money before the pull), not a fixed catalog amount).
        amount: v.number(),
        wipeOut: v.boolean(),
        jackpot: v.boolean(),
      }),
    ),
    // The game's `turnCount` value at the moment this player last pulled a
    // gamble card --- limits them to one pull per own turn (compared
    // against games.turnCount, which only advances when someone plays or
    // draws). Prevents spamming the stack for free money mid-turn.
    lastGambleTurn: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_user_room", ["userId", "roomId"]),

  games: defineTable({
    roomId: v.id("rooms"),
    deck: v.array(v.string()),
    discardPile: v.array(v.string()),
    currentColor: v.string(),
    currentPlayerIndex: v.number(),
    playerOrder: v.array(v.string()),
    direction: v.number(),
    drawStack: v.number(),
    lastAction: v.optional(v.string()),
    winnerId: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("finished")),
    createdAt: v.number(),
    // ─── Monopoly-Uno additions ────────────────────────────────────────
    // Counts every individual turn taken (by any player, human or bot).
    // A 7-day week (turns 1-7), then payday on the 8th turn --- like hitting
    // next Monday --- everyone at the table is paid a $200 "salary" --- see
    // game.ts's paySalaryIfDue.
    turnCount: v.optional(v.number()),
    // Broadcasts the most recent salary payout so every client can show a
    // "you earned $200" modal at the same moment. `at` is a timestamp used
    // by the client to detect a *new* payout vs. one it already showed.
    salaryNotice: v.optional(
      v.object({
        turnCount: v.number(),
        amount: v.number(), // salary only, unchanged
        rentByPlayer: v.array(
          v.object({ userId: v.string(), amount: v.number() }),
        ),
        at: v.number(),
      }),
    ),
    // ─── Gamble stack additions ─────────────────────────────────────────
    // Shuffled queue of gamble-event ids, drawn from top when a player
    // taps the Gamble pile. Reshuffled from the full GAMBLE_EVENTS catalog
    // whenever it runs out, so results still feel varied over a long game.
    gambleDeck: v.optional(v.array(v.string())),
  }).index("by_room", ["roomId"]),

  messages: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(),
    userName: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
});

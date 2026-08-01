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
    savings: v.optional(v.number()),
    lastInterestTurn: v.optional(v.number()),
    difficulty: v.optional(
      v.union(v.literal("aggressive"), v.literal("conservative")),
    ),
    isReady: v.boolean(),
    isConnected: v.boolean(),
    hand: v.array(v.string()),
    seatIndex: v.number(),
    money: v.number(),
    properties: v.array(
      v.object({
        instanceId: v.string(),
        id: v.string(),
        name: v.string(),
        price: v.number(),
        value: v.number(),
        invested: v.number(),
        upgrades: v.array(v.string()),
      }),
    ),
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
    pendingLifeEvents: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          amount: v.number(),
        }),
      ),
    ),
    pendingGambleEvent: v.optional(
      v.object({
        id: v.string(),
        label: v.string(),
        description: v.string(),
        amount: v.number(),
        wipeOut: v.boolean(),
        jackpot: v.boolean(),
      }),
    ),
    lastGambleTurn: v.optional(v.number()),
    // ─── Stock market additions ──────────────────────────────────────────
    // Shares this player currently holds. `avgCost` is the volume-weighted
    // average price paid per share across all buys — needed so the UI can
    // show a real gain/loss instead of just current value. A stock's entry
    // is removed entirely once quantity hits 0 (see convex/stocks.ts).
    shares: v.optional(
      v.array(
        v.object({
          stockId: v.string(), // matches an id in lib/Stocks.ts
          quantity: v.number(),
          avgCost: v.number(),
        }),
      ),
    ),
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
    turnCount: v.optional(v.number()),

    salaryNotice: v.optional(
      v.object({
        turnCount: v.number(),
        amount: v.number(),
        rentByPlayer: v.array(
          v.object({ userId: v.string(), amount: v.number() }),
        ),
        interestByPlayer: v.array(
          v.object({ userId: v.string(), amount: v.number() }),
        ),
        at: v.number(),
      }),
    ),
    botGambleNotice: v.optional(
      v.object({
        botName: v.string(),
        label: v.string(),
        description: v.string(),
        amount: v.number(),
        wipeOut: v.boolean(),
        jackpot: v.boolean(),
        at: v.number(),
      }),
    ),
    coachCommentary: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          text: v.string(),
          status: v.union(
            v.literal("pending"),
            v.literal("streaming"),
            v.literal("done"),
          ),
          turnCount: v.number(),
          at: v.number(),
        }),
      ),
    ),
    gambleDeck: v.optional(v.array(v.string())),
    // ─── Stock market additions ──────────────────────────────────────────
    // Current live price per stock. Falls back to each stock's basePrice
    // (see lib/Stocks.ts) via getMarket in convex/stocks.ts until the
    // first payday fluctuation writes real numbers here.
    stockPrices: v.optional(
      v.array(v.object({ id: v.string(), price: v.number() })),
    ),
    // A capped trailing log of price snapshots, one entry per payday, used
    // to compute % change and (optionally) draw a price history chart.
    // Capped at MAX_HISTORY_ENTRIES in convex/stocks.ts so this never grows
    // unbounded over a long game.
    stockPriceHistory: v.optional(
      v.array(
        v.object({
          turnCount: v.number(),
          prices: v.array(v.object({ id: v.string(), price: v.number() })),
        }),
      ),
    ),
    // Broadcasts the most recent payday's price moves so every client can
    // show a "the market moved" toast at the same moment — same pattern as
    // salaryNotice above.
    stockMarketNotice: v.optional(
      v.object({
        turnCount: v.number(),
        changes: v.array(
          v.object({
            id: v.string(),
            price: v.number(),
            pctChange: v.number(),
          }),
        ),
        at: v.number(),
      }),
    ),
    winCommentary: v.optional(
      v.object({
        text: v.string(),
        status: v.union(
          v.literal("pending"),
          v.literal("streaming"),
          v.literal("done"),
        ),
        at: v.number(),
      }),
    ),
  }).index("by_room", ["roomId"]),
  messages: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(),
    userName: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  trades: defineTable({
    roomId: v.id("rooms"),
    fromUserId: v.string(),
    fromName: v.string(),
    toUserId: v.string(),
    toName: v.string(),
    offerPropertyIds: v.array(v.string()),
    offerPropertyDetails: v.optional(
      v.array(v.object({ id: v.string(), name: v.string() })),
    ),
    offerCash: v.number(),
    requestPropertyIds: v.array(v.string()),
    requestPropertyDetails: v.optional(
      v.array(v.object({ id: v.string(), name: v.string() })),
    ),
    requestCash: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("cancelled"),
    ),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_to_user", ["toUserId"])
    .index("by_from_user", ["fromUserId"]),

  localCommentary: defineTable({
    sessionId: v.string(),
    text: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("streaming"),
      v.literal("done"),
    ),
    at: v.number(),
  }).index("by_session", ["sessionId"]),
});

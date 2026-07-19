import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { GAMBLE_EVENTS, gambleDef } from "../lib/Gambleevents";
import { LIFE_EVENTS } from "@/lib/LifeEvents";
import { PROPERTIES } from "@/lib/Properties";
import { PROPERTY_UPGRADES } from "@/lib/PropertyUpgrades";

// ─── Deck Helpers ────────────────────────────────────────────────────
const COLORS = ["red", "blue", "green", "yellow"] as const;
const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const ACTIONS = ["skip", "reverse", "draw2"];
const WILDS = ["wild", "wild_draw4"];

const BOT_DIFFICULTY = {
  aggressive: {
    // Cash buffer a bot insists on keeping after buying a property.
    propertyBuffer: 50,
    // Cash buffer a bot insists on keeping after paying for an upgrade.
    upgradeBuffer: 100,
    // Chance (0-1), checked once per own turn, of pulling the Gamble stack.
    gambleChance: 0.6,
  },
  conservative: {
    propertyBuffer: 150,
    upgradeBuffer: 300,
    gambleChance: 0.15,
  },
} as const;

type BotDifficulty = keyof typeof BOT_DIFFICULTY;

function difficultyOf(bot: { difficulty?: BotDifficulty }): BotDifficulty {
  return bot.difficulty ?? "conservative";
}

function nextUpgradeFor(prop: { price: number; upgrades?: string[] }) {
  const owned = prop.upgrades ?? [];
  if (owned.length >= PROPERTY_UPGRADES.length) return null;
  return PROPERTY_UPGRADES[owned.length];
}

function makeInstanceId() {
  return `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function lifeEvent(cardId: string) {
  return LIFE_EVENTS.find((e) => e.id === cardId);
}

function propertyDef(cardId: string) {
  return PROPERTIES.find((p) => p.id === cardId);
}

function wealthOf(p: { money?: number; properties?: { value: number }[] }) {
  return (
    (p.money ?? 0) + (p.properties ?? []).reduce((s, pr) => s + pr.value, 0)
  );
}

export function createDeck(): string[] {
  const deck: string[] = [];
  for (const color of COLORS) {
    deck.push(`${color}_0`);
    for (const num of [...NUMBERS.slice(1), ...ACTIONS]) {
      deck.push(`${color}_${num}`, `${color}_${num}`);
    }
  }
  for (const wild of WILDS) {
    for (let i = 0; i < 4; i++) deck.push(wild);
  }
  // Two of each life event, one of each property --- enough to matter without
  // drowning out the normal Uno mechanics.
  for (const event of LIFE_EVENTS) {
    deck.push(event.id, event.id);
  }
  // Multiple copies per property, weighted so cheaper ones turn up more
  // often --- a starter apartment should show up early and regularly, while
  // the mansion stays a rarer late-game jackpot.
  const PROPERTY_COPIES = [4, 3, 3, 2, 2]; // apartment, house, condo, hotel, mansion
  PROPERTIES.forEach((prop, i) => {
    const copies = PROPERTY_COPIES[i] ?? 2;
    for (let c = 0; c < copies; c++) deck.push(prop.id);
  });
  return shuffle(deck);
}

// The Gamble stack is a completely separate deck from the main Uno deck ---
// it never gets shuffled in with numbers/actions/wilds, and drawing from it
// is never forced. This just builds/reshuffles the catalog into a random
// order.
export function createGambleDeck(): string[] {
  return shuffle(GAMBLE_EVENTS.map((g) => g.id));
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface ResolvedDraw {
  deck: string[];
  discardPile: string[];
  keep: string[];
  lifeEvents: { id: string; label: string; amount: number }[];
  propertyOffers: { id: string; name: string; price: number; value: number }[];
}

function drawAndResolve(
  count: number,
  deckIn: string[],
  discardIn: string[],
): ResolvedDraw {
  let deck = [...deckIn];
  let discardPile = [...discardIn];
  const keep: string[] = [];
  const lifeEvents: ResolvedDraw["lifeEvents"] = [];
  const propertyOffers: ResolvedDraw["propertyOffers"] = [];

  for (let n = 0; n < count; n++) {
    if (deck.length === 0) {
      if (discardPile.length <= 1) break; // nothing left to reshuffle
      const top = discardPile.pop()!;
      deck = shuffle(discardPile);
      discardPile = [top];
    }
    const cardId = deck.shift();
    if (!cardId) break;
    const life = lifeEvent(cardId);
    const prop = propertyDef(cardId);
    if (life) {
      lifeEvents.push({ id: life.id, label: life.label, amount: life.amount });
    } else if (prop) {
      propertyOffers.push({
        id: prop.id,
        name: prop.label,
        price: prop.price,
        value: prop.value,
      });
    } else {
      keep.push(cardId);
    }
  }

  return { deck, discardPile, keep, lifeEvents, propertyOffers };
}

// Deals a hand of exactly `count` *playable* cards to a fresh player at game
// start. Unlike a mid-game draw, life/property cards hit during the deal are
// NOT resolved --- no money is paid/charged and no offer is queued. They're
// just skipped over and replaced with the next card, so every player starts
// with an identical $3000 regardless of how the shuffle fell. Applying a
// random bonus/bill before anyone has taken a single turn would be an unfair
// coin flip, not gameplay.
function dealInitialHand(
  count: number,
  deckIn: string[],
): {
  deck: string[];
  hand: string[];
} {
  const deck = [...deckIn];
  const hand: string[] = [];
  // Life/property cards hit during the deal are set aside, NOT destroyed ---
  // they get pushed back onto the deck once the hand is filled so they're
  // still in play for later draws.
  const setAside: string[] = [];
  while (hand.length < count && deck.length > 0) {
    const cardId = deck.shift()!;
    if (lifeEvent(cardId) || propertyDef(cardId)) {
      setAside.push(cardId);
      continue;
    }
    hand.push(cardId);
  }
  return { deck: [...deck, ...setAside], hand };
}

// ─── Salary: every 8th turn *per player* (a 7-day week, then payday --- "next
// Monday") --- everyone still in the game gets paid. Amount grows a little
// each payday instead of staying flat at $200. ─────────────────────────────
const SALARY_INTERVAL = 8;
const SALARY_BASE = 500; // salary on the very first payday
const SALARY_GROWTH_PER_PAYDAY = 50; // flat increase each payday after that

const RENT_PERCENTAGE = 0.17;
const RENT_MIN_PROPERTIES = 2;

function calculateRent(
  properties: { price: number; invested?: number }[] | undefined,
): number {
  if (!properties || properties.length < RENT_MIN_PROPERTIES) return 0;
  const combinedInvested = properties.reduce(
    (s, pr) => s + (pr.invested ?? pr.price),
    0,
  );
  return Math.round(combinedInvested * RENT_PERCENTAGE);
}

async function paySalaryIfDue(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  newTurnCount: number,
): Promise<
  | {
      turnCount: number;
      amount: number;
      rentByPlayer: { userId: string; amount: number }[];
      at: number;
    }
  | undefined
> {
  const allPlayers = await ctx.db
    .query("players")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();

  const numPlayers = allPlayers.length || 1;
  const scaledInterval = SALARY_INTERVAL * numPlayers;

  if (newTurnCount === 0 || newTurnCount % scaledInterval !== 0) {
    return undefined;
  }

  // Which payday is this? 1st, 2nd, 3rd... --- used to scale the amount up
  // a little each time so the salary keeps pace as the game (and property
  // prices) get bigger later on.
  const paydayNumber = newTurnCount / scaledInterval;
  const salaryAmount =
    SALARY_BASE + (paydayNumber - 1) * SALARY_GROWTH_PER_PAYDAY;

  const rentByPlayer: { userId: string; amount: number }[] = [];

  for (const p of allPlayers) {
    const rent = calculateRent(p.properties);
    await ctx.db.patch(p._id, {
      money: (p.money ?? 0) + salaryAmount + rent,
    });
    if (rent > 0) {
      rentByPlayer.push({ userId: p.userId, amount: rent });
    }
  }

  return {
    turnCount: newTurnCount,
    amount: salaryAmount,
    rentByPlayer,
    at: Date.now(),
  };
}

function resolveBotPropertyOffers(
  startingMoney: number,
  offers: { id: string; name: string; price: number; value: number }[],
  difficulty: BotDifficulty = "conservative",
): {
  money: number;
  properties: {
    id: string;
    name: string;
    price: number;
    value: number;
    instanceId: string;
    invested: number;
    upgrades: string[];
  }[];
} {
  const { propertyBuffer } = BOT_DIFFICULTY[difficulty];
  let money = startingMoney;
  const properties: {
    id: string;
    name: string;
    price: number;
    value: number;
    instanceId: string;
    invested: number;
    upgrades: string[];
  }[] = [];
  for (const offer of offers) {
    if (money - offer.price >= propertyBuffer) {
      money -= offer.price;
      properties.push({
        instanceId: makeInstanceId(),
        id: offer.id,
        name: offer.name,
        price: offer.price,
        value: offer.value,
        invested: offer.price,
        upgrades: [],
      });
    }
  }
  return { money, properties };
}

type BotProperty = ReturnType<
  typeof resolveBotPropertyOffers
>["properties"][number];

export function parseCard(cardId: string): { color: string; value: string } {
  if (cardId === "wild" || cardId === "wild_draw4")
    return { color: "wild", value: cardId };
  if (lifeEvent(cardId)) return { color: "life", value: cardId };
  if (propertyDef(cardId)) return { color: "property", value: cardId };
  const idx = cardId.indexOf("_");
  if (idx === -1) return { color: "wild", value: cardId };
  return { color: cardId.slice(0, idx), value: cardId.slice(idx + 1) };
}

export function canPlayCard(
  card: string,
  topCard: string,
  currentColor: string,
): boolean {
  const { color, value } = parseCard(card);
  const { value: topValue } = parseCard(topCard);
  // Wild, life-event, and property cards are all playable regardless of the
  // current color or top card.
  if (color === "wild" || color === "life" || color === "property") return true;
  if (color === currentColor) return true;
  if (value === topValue) return true;
  return false;
}

function isStackableDrawCard(cardId: string): boolean {
  const { value } = parseCard(cardId);
  return value === "draw2" || cardId === "wild_draw4";
}

// ─── Queries ─────────────────────────────────────────────────────────
export const getGame = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();

    if (!game) return game;

    const rentByPlayer: Record<string, number> = {};
    for (const entry of game.salaryNotice?.rentByPlayer ?? []) {
      rentByPlayer[entry.userId] = entry.amount;
    }

    return {
      ...game,
      salaryNotice: game.salaryNotice
        ? { ...game.salaryNotice, rentByPlayer }
        : undefined,
    };
  },
});

export const getPlayerHand = query({
  args: { roomId: v.id("rooms"), userId: v.string() },
  handler: async (ctx, { roomId, userId }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .first();
    return player?.hand ?? [];
  },
});

// ─── Start Game ────────────────────────────────────────────────────────
export const startGame = mutation({
  args: { roomId: v.id("rooms"), requesterId: v.string() },
  handler: async (ctx, { roomId, requesterId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== requesterId) throw new Error("Only host can start");
    if (room.playerIds.length < 2) throw new Error("Need at least 2 players");

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();

    const sortedPlayers = players.sort((a, b) => a.seatIndex - b.seatIndex);
    const playerOrder = sortedPlayers.map((p) => p.userId);

    let deck = createDeck();
    const hands: Record<string, string[]> = {};

    for (const player of sortedPlayers) {
      const dealt = dealInitialHand(7, deck);
      deck = dealt.deck;
      hands[player.userId] = dealt.hand;
    }

    let firstCard = deck.shift()!;
    while (
      firstCard.startsWith("wild") ||
      lifeEvent(firstCard) ||
      propertyDef(firstCard)
    ) {
      deck.push(firstCard);
      deck = shuffle(deck);
      firstCard = deck.shift()!;
    }
    const { color: firstColor } = parseCard(firstCard);

    for (const player of sortedPlayers) {
      await ctx.db.patch(player._id, {
        hand: hands[player.userId],
        // Fresh, EQUAL financial slate every game --- nobody starts richer or
        // poorer than anyone else.
        money: 3000,
        properties: [],
        pendingProperties: [],
        pendingLifeEvents: [],
        pendingGambleEvent: undefined,
        lastGambleTurn: undefined,
      });
    }

    await ctx.db.insert("games", {
      roomId,
      deck,
      // Only ever holds cards that were actually played --- never a resolved
      // life/property card, since its last entry is the visible "top card".
      discardPile: [firstCard],
      currentColor: firstColor,
      currentPlayerIndex: 0,
      playerOrder,
      direction: 1,
      drawStack: 0,
      turnCount: 0,
      lastAction: `Game started! ${firstCard} is the first card`,
      status: "active",
      createdAt: Date.now(),
      gambleDeck: createGambleDeck(),
    });

    await ctx.db.patch(roomId, { status: "playing" });

    const firstPlayerId = playerOrder[0];
    if (firstPlayerId.startsWith("bot_")) {
      await ctx.scheduler.runAfter(1500, internal.game.botTurn, { roomId });
    }
  },
});

export const playCard = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.string(),
    cardId: v.string(),
    chosenColor: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, userId, cardId, chosenColor }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game || game.status !== "active") throw new Error("No active game");

    const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
    if (currentPlayerId !== userId) throw new Error("Not your turn");

    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .first();
    if (!player) throw new Error("Player not found");

    const topCard = game.discardPile[game.discardPile.length - 1];
    if (!canPlayCard(cardId, topCard, game.currentColor)) {
      throw new Error("Cannot play that card");
    }

    // ── Penalty stack enforcement ─────────────────────────────────────────
    // Either a +2 or a +4 can be stacked on top of either a +2 or a +4 ---
    // players can freely escalate or pass the penalty back and forth.
    if (game.drawStack > 0 && !isStackableDrawCard(cardId)) {
      throw new Error("You must play a +2 or +4 to stack, or draw!");
    }
    // ─────────────────────────────────────────────────────────────────────

    const cardIdx = player.hand.indexOf(cardId);
    if (cardIdx === -1) throw new Error("Card not in hand");
    const handCopy = [...player.hand];
    handCopy.splice(cardIdx, 1);

    const parsedCard = parseCard(cardId);

    // ── Standard turn-advance mechanics (skip/reverse/draw2/wild/etc.) ────
    const newColor =
      parsedCard.color === "wild" ? (chosenColor ?? "red") : parsedCard.color;
    let newDirection = game.direction;
    let nextIndex = game.currentPlayerIndex;
    let newDrawStack = game.drawStack;
    let lastAction = `${player.name} played ${cardId}`;
    const numPlayers = game.playerOrder.length;

    if (parsedCard.value === "reverse") {
      newDirection = game.direction * -1;
      nextIndex =
        numPlayers === 2
          ? (nextIndex + newDirection * 2 + numPlayers * 2) % numPlayers
          : (nextIndex + newDirection + numPlayers) % numPlayers;
      lastAction += " --- Direction reversed!";
    } else if (parsedCard.value === "skip") {
      nextIndex = (nextIndex + newDirection * 2 + numPlayers * 2) % numPlayers;
      lastAction += " --- Next player skipped!";
    } else if (parsedCard.value === "draw2") {
      newDrawStack += 2;
      nextIndex = (nextIndex + newDirection + numPlayers) % numPlayers;
      lastAction += ` --- Next player must draw ${newDrawStack}!`;
    } else if (cardId === "wild_draw4") {
      newDrawStack += 4;
      nextIndex = (nextIndex + newDirection + numPlayers) % numPlayers;
      lastAction += ` --- Next player must draw ${newDrawStack} and color is ${newColor}!`;
    } else {
      nextIndex = (nextIndex + newDirection + numPlayers) % numPlayers;
    }

    if (parsedCard.value !== "draw2" && cardId !== "wild_draw4") {
      newDrawStack = 0;
    }

    if (cardId === "wild") lastAction += ` --- Color changed to ${newColor}!`;

    const newTurnCount = (game.turnCount ?? 0) + 1;

    // ── Check for "going out" --- but only a win if you're the wealthiest ───
    if (handCopy.length === 0) {
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_room", (q) => q.eq("roomId", roomId))
        .collect();

      const myWealth =
        (player.money ?? 0) +
        (player.properties ?? []).reduce((s, pr) => s + pr.value, 0);
      const otherWealths = allPlayers
        .filter((p) => p.userId !== userId)
        .map((p) => wealthOf(p));
      const maxOtherWealth =
        otherWealths.length > 0 ? Math.max(...otherWealths) : -Infinity;
      const eligibleToWin = myWealth >= maxOtherWealth;

      if (eligibleToWin) {
        await ctx.db.patch(player._id, { hand: [] });
        await ctx.db.patch(game._id, {
          discardPile: [...game.discardPile, cardId],
          winnerId: userId,
          status: "finished",
          lastAction: `🎉 ${player.name} went out with $${myWealth.toLocaleString()} in total wealth --- the richest player --- and WINS!`,
        });
        await ctx.db.patch(roomId, { status: "finished" });
        return {
          outcome: "won" as const,
          myWealth,
          maxOtherWealth: otherWealths.length > 0 ? maxOtherWealth : 0,
        };
      }

      // Not the wealthiest --- blocked from winning. Draw 2 penalty cards
      // (resolved through the same life/property pipeline as any draw) and
      // stay in the game.
      const resolved = drawAndResolve(2, game.deck, [
        ...game.discardPile,
        cardId,
      ]);
      const lifeMoneyDelta = resolved.lifeEvents.reduce(
        (s, e) => s + e.amount,
        0,
      );

      await ctx.db.patch(player._id, {
        hand: [...handCopy, ...resolved.keep],
        money: (player.money ?? 0) + lifeMoneyDelta,
        pendingProperties: [
          ...(player.pendingProperties ?? []),
          ...resolved.propertyOffers,
        ],
        pendingLifeEvents: [
          ...(player.pendingLifeEvents ?? []),
          ...resolved.lifeEvents,
        ],
      });

      const salaryNotice = await paySalaryIfDue(ctx, roomId, newTurnCount);

      await ctx.db.patch(game._id, {
        deck: resolved.deck,
        discardPile: resolved.discardPile,
        currentColor: newColor,
        currentPlayerIndex: nextIndex,
        direction: newDirection,
        drawStack: newDrawStack,
        turnCount: newTurnCount,
        ...(salaryNotice ? { salaryNotice } : {}),
        lastAction: `${player.name} went out but only has $${myWealth.toLocaleString()} --- not the richest player! Forced to draw 2 and stay in the game.`,
      });

      const nextPlayerId = game.playerOrder[nextIndex];
      if (nextPlayerId.startsWith("bot_")) {
        await ctx.scheduler.runAfter(1500, internal.game.botTurn, { roomId });
      }

      return {
        outcome: "blocked" as const,
        myWealth,
        maxOtherWealth,
      };
    }

    await ctx.db.patch(player._id, { hand: handCopy });

    const salaryNotice = await paySalaryIfDue(ctx, roomId, newTurnCount);

    await ctx.db.patch(game._id, {
      discardPile: [...game.discardPile, cardId],
      currentColor: newColor,
      currentPlayerIndex: nextIndex,
      direction: newDirection,
      drawStack: newDrawStack,
      turnCount: newTurnCount,
      ...(salaryNotice ? { salaryNotice } : {}),
      lastAction,
    });

    const nextPlayerId = game.playerOrder[nextIndex];
    if (nextPlayerId.startsWith("bot_")) {
      await ctx.scheduler.runAfter(1500, internal.game.botTurn, { roomId });
    }

    return { outcome: "played" as const };
  },
});

export const respondProperty = mutation({
  args: { roomId: v.id("rooms"), userId: v.string(), accept: v.boolean() },
  handler: async (ctx, { roomId, userId, accept }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .first();
    if (!player) throw new Error("Player not found");

    const queue = player.pendingProperties ?? [];
    const offer = queue[0];
    if (!offer) throw new Error("No pending property offer");
    const restQueue = queue.slice(1);

    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();

    if (accept) {
      if ((player.money ?? 0) < offer.price) {
        await ctx.db.patch(player._id, { pendingProperties: restQueue });
        if (game) {
          await ctx.db.patch(game._id, {
            lastAction: `${player.name} couldn't afford ${offer.name} ($${offer.price.toLocaleString()}) and had to pass.`,
          });
        }
        return;
      }

      await ctx.db.patch(player._id, {
        money: (player.money ?? 0) - offer.price,
        properties: [
          ...(player.properties ?? []),
          {
            instanceId: makeInstanceId(),
            id: offer.id,
            name: offer.name,
            price: offer.price,
            value: offer.value,
            invested: offer.price,
            upgrades: [],
          },
        ],
        pendingProperties: restQueue,
      });

      if (game) {
        await ctx.db.patch(game._id, {
          lastAction: `🏠 ${player.name} bought ${offer.name} for $${offer.price.toLocaleString()} (worth $${offer.value.toLocaleString()})!`,
        });
      }
    } else {
      await ctx.db.patch(player._id, { pendingProperties: restQueue });
      if (game) {
        await ctx.db.patch(game._id, {
          lastAction: `${player.name} declined to buy ${offer.name}.`,
        });
      }
    }
  },
});

export const upgradeProperty = mutation({
  args: { roomId: v.id("rooms"), userId: v.string(), instanceId: v.string() },
  handler: async (ctx, { roomId, userId, instanceId }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .first();
    if (!player) throw new Error("Player not found");

    const properties = player.properties ?? [];
    const idx = properties.findIndex((p) => p.instanceId === instanceId);
    if (idx === -1) throw new Error("You don't own that property");

    const prop = properties[idx];
    const upgrade = nextUpgradeFor(prop);
    if (!upgrade) throw new Error("This property is already fully upgraded");

    const cost = Math.round(prop.price * upgrade.costMultiplier);
    const valueGain = Math.round(prop.price * upgrade.valueMultiplier);
    if ((player.money ?? 0) < cost) {
      throw new Error(
        `You need $${cost.toLocaleString()} for ${upgrade.label}`,
      );
    }

    const updatedProperties = [...properties];
    updatedProperties[idx] = {
      ...prop,
      value: prop.value + valueGain,
      invested: (prop.invested ?? prop.price) + cost,
      upgrades: [...(prop.upgrades ?? []), upgrade.id],
    };

    await ctx.db.patch(player._id, {
      money: (player.money ?? 0) - cost,
      properties: updatedProperties,
    });

    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (game) {
      await ctx.db.patch(game._id, {
        lastAction: `${upgrade.emoji} ${player.name} added ${upgrade.label} to ${prop.name} (+$${valueGain.toLocaleString()} value)!`,
      });
    }

    return { newValue: updatedProperties[idx].value, cost, valueGain };
  },
});

// ─── Acknowledge Life Events ───────────────────────────────────────────────
// The money from a "life" card is applied the instant it's drawn --- this
// mutation just clears the queue once the player has seen the "you got/owed
// $X" modal, so it doesn't pop up again.
export const acknowledgeLifeEvents = mutation({
  args: { roomId: v.id("rooms"), userId: v.string() },
  handler: async (ctx, { roomId, userId }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .first();
    if (!player) throw new Error("Player not found");
    await ctx.db.patch(player._id, { pendingLifeEvents: [] });
  },
});

// ─── Gamble Stack: pull a card ──────────────────────────────────────────
// Purely elective, purely on your own turn, and never ends your turn ---
// you still have to play a card or draw from the main pile afterward to
// actually pass play. Limited to one pull per own turn via lastGambleTurn,
// so it can't be spammed for free money before you act.
export const drawGambleCard = mutation({
  args: { roomId: v.id("rooms"), userId: v.string() },
  handler: async (ctx, { roomId, userId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game || game.status !== "active") throw new Error("No active game");

    const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
    if (currentPlayerId !== userId) throw new Error("Not your turn");

    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .first();
    if (!player) throw new Error("Player not found");

    const turnCount = game.turnCount ?? 0;
    if ((player.lastGambleTurn ?? -1) === turnCount) {
      throw new Error("You've already tried your luck this turn!");
    }

    let gambleDeck = [...(game.gambleDeck ?? [])];
    if (gambleDeck.length === 0) {
      gambleDeck = createGambleDeck();
    }
    const cardId = gambleDeck.shift()!;
    const def = gambleDef(cardId);
    if (!def) throw new Error("Unknown gamble card");

    const moneyBefore = player.money ?? 0;
    const appliedAmount = def.wipeOut ? -moneyBefore : (def.amount ?? 0);
    const newMoney = def.wipeOut ? 0 : moneyBefore + appliedAmount;

    await ctx.db.patch(player._id, {
      money: newMoney,
      lastGambleTurn: turnCount,
      pendingGambleEvent: {
        id: def.id,
        label: def.label,
        description: def.description,
        amount: appliedAmount,
        wipeOut: def.wipeOut,
        jackpot: def.jackpot,
      },
    });

    await ctx.db.patch(game._id, {
      gambleDeck,
      lastAction: `🎲 ${player.name} tried their luck: ${def.label}!`,
    });
  },
});

export const acknowledgeGambleEvent = mutation({
  args: { roomId: v.id("rooms"), userId: v.string() },
  handler: async (ctx, { roomId, userId }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .first();
    if (!player) throw new Error("Player not found");
    await ctx.db.patch(player._id, { pendingGambleEvent: undefined });
  },
});

// ─── Draw Card ───────────────────────────────────────────────────────────
export const drawCard = mutation({
  args: { roomId: v.id("rooms"), userId: v.string() },
  handler: async (ctx, { roomId, userId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game || game.status !== "active") throw new Error("No active game");

    const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
    if (currentPlayerId !== userId) throw new Error("Not your turn");

    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", userId).eq("roomId", roomId),
      )
      .first();
    if (!player) throw new Error("Player not found");

    const drawCount = game.drawStack > 0 ? game.drawStack : 1;
    const resolved = drawAndResolve(drawCount, game.deck, game.discardPile);
    const lifeMoneyDelta = resolved.lifeEvents.reduce(
      (s, e) => s + e.amount,
      0,
    );

    await ctx.db.patch(player._id, {
      hand: [...player.hand, ...resolved.keep],
      money: (player.money ?? 0) + lifeMoneyDelta,
      pendingProperties: [
        ...(player.pendingProperties ?? []),
        ...resolved.propertyOffers,
      ],
      pendingLifeEvents: [
        ...(player.pendingLifeEvents ?? []),
        ...resolved.lifeEvents,
      ],
    });

    const numPlayers = game.playerOrder.length;
    const nextIndex =
      (game.currentPlayerIndex + game.direction + numPlayers) % numPlayers;
    const newTurnCount = (game.turnCount ?? 0) + 1;
    const salaryNotice = await paySalaryIfDue(ctx, roomId, newTurnCount);

    await ctx.db.patch(game._id, {
      deck: resolved.deck,
      discardPile: resolved.discardPile,
      drawStack: 0,
      currentPlayerIndex: nextIndex,
      turnCount: newTurnCount,
      ...(salaryNotice ? { salaryNotice } : {}),
      lastAction: `${player.name} drew ${drawCount} card${drawCount > 1 ? "s" : ""}`,
    });

    const nextPlayerId = game.playerOrder[nextIndex];
    if (nextPlayerId.startsWith("bot_")) {
      await ctx.scheduler.runAfter(1500, internal.game.botTurn, { roomId });
    }
  },
});

export const botTurn = internalMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .first();
    if (!game || game.status !== "active") return;
    const botId = game.playerOrder[game.currentPlayerIndex];
    if (!botId.startsWith("bot_")) return;
    const bot = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", botId).eq("roomId", roomId),
      )
      .first();
    if (!bot) return;

    const difficulty = difficultyOf(bot);
    const turnCount = game.turnCount ?? 0;

    let botMoney = bot.money ?? 0;
    let gambleDeck = [...(game.gambleDeck ?? [])];
    let gambleLastAction: string | null = null;
    let gamblePulled = false;
    let botGambleNotice: {
      botName: string;
      label: string;
      description: string;
      amount: number;
      wipeOut: boolean;
      jackpot: boolean;
      at: number;
    } | null = null;
    if (
      (bot.lastGambleTurn ?? -1) !== turnCount &&
      Math.random() < BOT_DIFFICULTY[difficulty].gambleChance
    ) {
      if (gambleDeck.length === 0) gambleDeck = createGambleDeck();
      const cardId = gambleDeck.shift()!;
      const def = gambleDef(cardId);
      if (def) {
        const appliedAmount = def.wipeOut ? -botMoney : (def.amount ?? 0);
        botMoney = def.wipeOut ? 0 : botMoney + appliedAmount;
        gambleLastAction = `🎲 ${bot.name} tried their luck: ${def.label}!`;
        gamblePulled = true;
        botGambleNotice = {
          botName: bot.name,
          label: def.label,
          description: def.description,
          amount: appliedAmount,
          wipeOut: def.wipeOut,
          jackpot: def.jackpot,
          at: Date.now(),
        };
      }
    }

    // NEW — Property upgrade, at most one per turn, before the bot decides
    // what to play (so a payday-fresh bot can immediately reinvest).
    const upgradeResult = resolveBotUpgrade(
      botMoney,
      bot.properties ?? [],
      difficulty,
    );
    botMoney = upgradeResult.money;
    const botProperties = upgradeResult.properties;
    const upgradeLastAction = upgradeResult.label;

    const combinedPrefix = [gambleLastAction, upgradeLastAction]
      .filter(Boolean)
      .join(" ");

    const topCard = game.discardPile[game.discardPile.length - 1];
    const drawStack = game.drawStack;
    const isPenaltyStackTurn = drawStack > 0;
    const playable = bot.hand.filter((card) => {
      if (!canPlayCard(card, topCard, game.currentColor)) return false;
      if (!isPenaltyStackTurn) return true;
      return isStackableDrawCard(card);
    });
    const newTurnCount = (game.turnCount ?? 0) + 1;

    if (playable.length > 0) {
      const card =
        playable.find((c) => parseCard(c).value.includes("draw")) ??
        playable.find((c) =>
          ["skip", "reverse"].includes(parseCard(c).value),
        ) ??
        playable[0];
      const { color } = parseCard(card);
      const chosenColor =
        color === "wild"
          ? (COLORS[Math.floor(Math.random() * 4)] as string)
          : color;
      const handCopy = [...bot.hand];
      handCopy.splice(handCopy.indexOf(card), 1);
      const parsedCard = parseCard(card);
      let botLastAction = `🤖 ${bot.name} played ${card}`;
      const newColor =
        parsedCard.color === "wild" ? chosenColor : parsedCard.color;
      let newDirection = game.direction;
      let nextIndex = game.currentPlayerIndex;
      let newDrawStack = game.drawStack;
      const numPlayers = game.playerOrder.length;

      if (parsedCard.value === "reverse") {
        newDirection *= -1;
        nextIndex =
          numPlayers === 2
            ? (nextIndex + newDirection * 2 + numPlayers * 2) % numPlayers
            : (nextIndex + newDirection + numPlayers) % numPlayers;
        botLastAction += " -- Direction reversed!";
      } else if (parsedCard.value === "skip") {
        nextIndex =
          (nextIndex + newDirection * 2 + numPlayers * 2) % numPlayers;
        botLastAction += " -- Next player skipped!";
      } else if (parsedCard.value === "draw2") {
        newDrawStack += 2;
        nextIndex = (nextIndex + newDirection + numPlayers) % numPlayers;
        botLastAction += ` -- Next player must draw ${newDrawStack}!`;
      } else if (card === "wild_draw4") {
        newDrawStack += 4;
        nextIndex = (nextIndex + newDirection + numPlayers) % numPlayers;
        botLastAction += ` -- Next player must draw ${newDrawStack} and color is ${newColor}!`;
      } else {
        nextIndex = (nextIndex + newDirection + numPlayers) % numPlayers;
      }
      if (parsedCard.value !== "draw2" && card !== "wild_draw4") {
        newDrawStack = 0;
      }
      if (card === "wild") botLastAction += ` -- Color changed to ${newColor}!`;

      // ── Check for "going out" -- wealth-gated, same as human players ──
      if (handCopy.length === 0) {
        const allPlayers = await ctx.db
          .query("players")
          .withIndex("by_room", (q) => q.eq("roomId", roomId))
          .collect();
        const myWealth = wealthOf({
          money: botMoney,
          properties: botProperties,
        });
        const otherWealths = allPlayers
          .filter((p) => p.userId !== botId)
          .map((p) => wealthOf(p));
        const maxOtherWealth =
          otherWealths.length > 0 ? Math.max(...otherWealths) : -Infinity;
        const eligibleToWin = myWealth >= maxOtherWealth;

        if (eligibleToWin) {
          await ctx.db.patch(bot._id, {
            hand: [],
            money: botMoney,
            properties: botProperties,
            ...(gamblePulled ? { lastGambleTurn: turnCount } : {}),
          });
          await ctx.db.patch(game._id, {
            discardPile: [...game.discardPile, card],
            gambleDeck,
            ...(botGambleNotice ? { botGambleNotice } : {}),
            winnerId: botId,
            status: "finished",
            lastAction: `${combinedPrefix ? combinedPrefix + " " : ""}🤖🎉 ${bot.name} went out with $${myWealth.toLocaleString()} in total wealth -- the richest player -- and wins!`,
          });
          await ctx.db.patch(roomId, { status: "finished" });
          return;
        }

        // Blocked -- draw 2 (through the same life/property pipeline) and stay in.
        const resolved = drawAndResolve(2, game.deck, [
          ...game.discardPile,
          card,
        ]);
        const lifeMoneyDelta = resolved.lifeEvents.reduce(
          (s, e) => s + e.amount,
          0,
        );
        const { money: botMoneyAfterDraw, properties: botPropsAfterDraw } =
          resolveBotPropertyOffers(
            botMoney,
            resolved.propertyOffers,
            difficulty,
          );
        await ctx.db.patch(bot._id, {
          hand: [...handCopy, ...resolved.keep],
          money: botMoneyAfterDraw + lifeMoneyDelta,
          properties: [...botProperties, ...botPropsAfterDraw],
          ...(gamblePulled ? { lastGambleTurn: turnCount } : {}),
        });
        const salaryNotice = await paySalaryIfDue(ctx, roomId, newTurnCount);
        await ctx.db.patch(game._id, {
          deck: resolved.deck,
          discardPile: resolved.discardPile,
          currentColor: newColor,
          currentPlayerIndex: nextIndex,
          direction: newDirection,
          drawStack: newDrawStack,
          turnCount: newTurnCount,
          gambleDeck,
          ...(botGambleNotice ? { botGambleNotice } : {}),
          ...(salaryNotice ? { salaryNotice } : {}),
          lastAction: `${combinedPrefix ? combinedPrefix + " " : ""}🤖 ${bot.name} went out but only has $${myWealth.toLocaleString()} -- not the richest! Forced to draw 2 and stay in the game.`,
        });
        const nextPlayerId = game.playerOrder[nextIndex];
        if (nextPlayerId.startsWith("bot_")) {
          await ctx.scheduler.runAfter(1500, internal.game.botTurn, { roomId });
        }
        return;
      }

      await ctx.db.patch(bot._id, {
        hand: handCopy,
        money: botMoney,
        properties: botProperties,
        ...(gamblePulled ? { lastGambleTurn: turnCount } : {}),
      });
      const salaryNotice = await paySalaryIfDue(ctx, roomId, newTurnCount);
      await ctx.db.patch(game._id, {
        discardPile: [...game.discardPile, card],
        currentColor: newColor,
        currentPlayerIndex: nextIndex,
        direction: newDirection,
        drawStack: newDrawStack,
        turnCount: newTurnCount,
        gambleDeck,
        ...(botGambleNotice ? { botGambleNotice } : {}),
        ...(salaryNotice ? { salaryNotice } : {}),
        lastAction: `${combinedPrefix ? combinedPrefix + " " : ""}${botLastAction}`,
      });
      const nextPlayerId = game.playerOrder[nextIndex];
      if (nextPlayerId.startsWith("bot_")) {
        await ctx.scheduler.runAfter(1500, internal.game.botTurn, { roomId });
      }
    } else {
      const drawCount = drawStack > 0 ? drawStack : 1;
      const resolved = drawAndResolve(drawCount, game.deck, game.discardPile);
      const lifeMoneyDelta = resolved.lifeEvents.reduce(
        (s, e) => s + e.amount,
        0,
      );
      const { money: botMoneyAfterDraw, properties: botPropsAfterDraw } =
        resolveBotPropertyOffers(botMoney, resolved.propertyOffers, difficulty);
      await ctx.db.patch(bot._id, {
        hand: [...bot.hand, ...resolved.keep],
        money: botMoneyAfterDraw + lifeMoneyDelta,
        properties: [...botProperties, ...botPropsAfterDraw],
        ...(gamblePulled ? { lastGambleTurn: turnCount } : {}),
      });
      const numPlayers = game.playerOrder.length;
      const nextIndex =
        (game.currentPlayerIndex + game.direction + numPlayers) % numPlayers;
      const salaryNotice = await paySalaryIfDue(ctx, roomId, newTurnCount);
      await ctx.db.patch(game._id, {
        deck: resolved.deck,
        discardPile: resolved.discardPile,
        drawStack: 0,
        currentPlayerIndex: nextIndex,
        turnCount: newTurnCount,
        gambleDeck,
        ...(botGambleNotice ? { botGambleNotice } : {}),
        ...(salaryNotice ? { salaryNotice } : {}),
        lastAction: `${combinedPrefix ? combinedPrefix + " " : ""}🤖 ${bot.name} drew ${drawCount} card${drawCount > 1 ? "s" : ""}`,
      });
      const nextPlayerId = game.playerOrder[nextIndex];
      if (nextPlayerId.startsWith("bot_")) {
        await ctx.scheduler.runAfter(1500, internal.game.botTurn, { roomId });
      }
    }
  },
});

// ─── Game History ─────────────────────────────────────────────────────────
export const getFinishedGames = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(50);
  },
});

export const getFinishedGamesForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const allFinished = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(200);
    return allFinished.filter((game) => game.playerOrder.includes(userId));
  },
});

function resolveBotUpgrade(
  money: number,
  properties: BotProperty[],
  difficulty: BotDifficulty,
): { money: number; properties: BotProperty[]; label: string | null } {
  const { upgradeBuffer } = BOT_DIFFICULTY[difficulty];

  const candidates = properties
    .map((prop, idx) => ({ prop, idx, upgrade: nextUpgradeFor(prop) }))
    .filter(
      (
        c,
      ): c is {
        prop: BotProperty;
        idx: number;
        upgrade: NonNullable<ReturnType<typeof nextUpgradeFor>>;
      } => c.upgrade !== null,
    )
    .sort((a, b) =>
      difficulty === "aggressive"
        ? b.prop.price - a.prop.price
        : a.prop.price - b.prop.price,
    );

  for (const { prop, idx, upgrade } of candidates) {
    const cost = Math.round(prop.price * upgrade.costMultiplier);
    if (money - cost < upgradeBuffer) continue;
    const valueGain = Math.round(prop.price * upgrade.valueMultiplier);
    const updated = [...properties];
    updated[idx] = {
      ...prop,
      value: prop.value + valueGain,
      invested: (prop.invested ?? prop.price) + cost,
      upgrades: [...(prop.upgrades ?? []), upgrade.id],
    };
    return {
      money: money - cost,
      properties: updated,
      label: `${upgrade.emoji} ${prop.name} +${upgrade.label}`,
    };
  }
  return { money, properties, label: null };
}

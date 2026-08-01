"use node";
import { v } from "convex/values";
import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";

interface OpenRouterErrorPayload {
  message?: string;
  code?: number;
}

interface OpenRouterStreamChunk {
  choices?: {
    delta?: { content?: string };
    finish_reason?: string | null;
  }[];
  error?: OpenRouterErrorPayload;
}

const FALLBACK_TEXT =
  '"A winner! Curiouser and curiouser," cackles the Hatter, tipping his hat ' +
  'clean off. "Pop the kettle, darling — you out-hoarded the whole table."';

const FLUSH_INTERVAL_MS = 120;

const VICTORY_VOICE = `You are the Coach in a board game called Unopoly (Uno + Monopoly), played as a gleefully unhinged Mad Hatter — whimsical, riddling, prone to tea-party metaphors and Wonderland flourishes. The game just ended. Roast/celebrate the WINNER directly, second person, bragging on their behalf about how they crushed the table. Reference their actual numbers (cash, properties, total wealth) and name-drop at least one specific opponent's numbers by name for comparison, e.g. "while poor Sarah was still financing a single lot on Vine Street." Be short, funny, a little savage toward the losers, warmly chaotic. Max 3-4 sentences total. No markdown, plain text only. Respond with ONLY the commentary text, nothing else.`;

interface RankedPlayer {
  name: string;
  isBot: boolean;
  money: number;
  propertyCount: number;
  propertyValue: number;
  savings: number;
  wealth: number;
}

function rankPlayers(
  players: {
    name: string;
    isBot: boolean;
    money: number;
    properties: { value: number }[];
    savings?: number;
    shares?: { stockId: string; quantity: number; avgCost: number }[];
  }[],
  priceById: Map<string, number>,
): RankedPlayer[] {
  return players
    .map((p) => {
      const propertyValue = p.properties.reduce((s, pr) => s + pr.value, 0);
      const savings = p.savings ?? 0;
      const sharesValue = (p.shares ?? []).reduce(
        (s, h) => s + (priceById.get(h.stockId) ?? h.avgCost) * h.quantity,
        0,
      );
      return {
        name: p.name,
        isBot: p.isBot,
        money: p.money,
        propertyCount: p.properties.length,
        propertyValue,
        savings,
        wealth: p.money + propertyValue + savings + sharesValue,
      };
    })
    .sort((a, b) => b.wealth - a.wealth);
}

function buildPrompt(winnerName: string, ranked: RankedPlayer[]): string {
  const winner = ranked.find((p) => p.name === winnerName) ?? ranked[0];
  const others = ranked
    .filter((p) => p !== winner)
    .map(
      (r) =>
        `${r.isBot ? `${r.name} (bot)` : r.name}: ~$${Math.round(r.wealth)} net worth, ${r.propertyCount} properties`,
    )
    .join("\n");

  return `${VICTORY_VOICE}

WINNER: ${winner.name}
- Cash: $${winner.money}
- Properties: ${winner.propertyCount} (worth ~$${Math.round(winner.propertyValue)})
- Savings: $${winner.savings}
- Total wealth: ~$${Math.round(winner.wealth)}

EVERYONE ELSE (compare the winner against these):
${others || "No one else — a solo table."}`;
}

// Shared streaming call — takes an onChunk/onDone callback so the room
// version and the local version can each write to their own storage.
// NB: onChunk returns Promise<unknown>, not Promise<void> — Convex
// mutations resolve to Promise<null>, which isn't assignable to void.
async function streamVictoryCommentary(
  prompt: string,
  onChunk: (textSoFar: string) => Promise<unknown>,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[winCoach] OPENROUTER_API_KEY missing/undefined.");
    return FALLBACK_TEXT;
  }

  let fullText = "";
  let lastFlushed = "";
  let lastFlushAt = 0;

  const flush = async (force = false) => {
    if (fullText === lastFlushed) return;
    const now = Date.now();
    if (!force && now - lastFlushAt < FLUSH_INTERVAL_MS) return;
    lastFlushAt = now;
    lastFlushed = fullText;
    await onChunk(fullText);
  };

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      },
    );

    if (!response.ok || !response.body) {
      const rawBody = await response.text().catch(() => "");
      console.error(
        "[winCoach] OpenRouter non-OK/no body:",
        response.status,
        rawBody.slice(0, 500),
      );
    } else {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice("data:".length).trim();
          if (payload === "[DONE]") continue;

          let chunk: OpenRouterStreamChunk | null = null;
          try {
            chunk = JSON.parse(payload) as OpenRouterStreamChunk;
          } catch {
            continue;
          }

          if (chunk?.error) {
            console.error(
              "[winCoach] OpenRouter stream error payload:",
              JSON.stringify(chunk.error),
            );
            continue;
          }

          const delta = chunk?.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            await flush();
          }
        }
      }

      fullText = fullText.trim();
      if (!fullText) console.error("[winCoach] stream ended with no content");
    }
  } catch (e) {
    console.error("[winCoach] fetch threw an exception:", e);
  }

  await flush(true);
  return fullText || FALLBACK_TEXT;
}

// ─── Multiplayer/room version — triggered from convex/game.ts when a
// game's status flips to "finished". ────────────────────────────────────
export const generateWinCommentary = internalAction({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const players = await ctx.runQuery(internal.coachData.getPlayersForCoach, {
      roomId,
    });
    const game = await ctx.runQuery(internal.coachData.getGameForCoach, {
      roomId,
    });
    if (!players.length || !game) {
      console.error("[winCoach] Aborting: no players or no game found", {
        roomId,
      });
      return;
    }

    await ctx.runMutation(internal.coachData.startWinCommentary, { roomId });

    const priceById = new Map<string, number>(
      (game.stockPrices ?? []).map((s) => [s.id, s.price]),
    );
    const ranked = rankPlayers(players, priceById);
    const winnerName =
      players.find((p) => p.userId === game.winnerId)?.name ?? ranked[0].name;
    const prompt = buildPrompt(winnerName, ranked);

    const fullText = await streamVictoryCommentary(prompt, (textSoFar) =>
      ctx.runMutation(internal.coachData.appendWinCommentaryChunk, {
        roomId,
        textSoFar,
      }),
    );

    await ctx.runMutation(internal.coachData.finishWinCommentary, {
      roomId,
      text: fullText,
    });
  },
});

// ─── LocalPlayPage version — called directly from the client via useAction,
// no room/game doc involved, keyed by a client-generated sessionId. ──────
export const generateLocalWinCommentary = action({
  args: {
    sessionId: v.string(),
    winnerName: v.string(),
    players: v.array(
      v.object({
        name: v.string(),
        isBot: v.boolean(),
        money: v.number(),
        properties: v.array(v.object({ value: v.number() })),
        savings: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { sessionId, winnerName, players }) => {
    await ctx.runMutation(internal.coachData.startLocalCommentary, {
      sessionId,
    });

    const ranked = rankPlayers(players, new Map());
    const prompt = buildPrompt(winnerName, ranked);

    const fullText = await streamVictoryCommentary(prompt, (textSoFar) =>
      ctx.runMutation(internal.coachData.appendLocalCommentaryChunk, {
        sessionId,
        textSoFar,
      }),
    );

    await ctx.runMutation(internal.coachData.finishLocalCommentary, {
      sessionId,
      text: fullText,
    });
  },
});

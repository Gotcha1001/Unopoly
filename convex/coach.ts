// convex/coach.ts
"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

interface OpenRouterErrorPayload {
  message?: string;
  code?: number;
}

// Shape of one SSE "data:" line from OpenRouter's streaming endpoint —
// same delta shape as OpenAI's chat.completions stream.
interface OpenRouterStreamChunk {
  choices?: {
    delta?: { content?: string };
    finish_reason?: string | null;
  }[];
  error?: OpenRouterErrorPayload;
}

const FALLBACK_TEXT =
  "The Coach is speechless this week. Your wallets, however, are not.";

// How often (ms) we're willing to write partial text to Convex while
// streaming. Writing on every single token would hammer the db with a
// mutation per word; batching on a short timer keeps the "typing" feel
// smooth on the client while keeping write volume sane.
const FLUSH_INTERVAL_MS = 120;

export const generateWeeklyCommentary = internalAction({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const players = await ctx.runQuery(internal.coachData.getPlayersForCoach, {
      roomId,
    });
    const game = await ctx.runQuery(internal.coachData.getGameForCoach, {
      roomId,
    });
    if (!players.length || !game) {
      console.error("[coach] Aborting: no players or no game found", {
        roomId,
        playerCount: players.length,
        hasGame: !!game,
      });
      return;
    }

    const turnCount = game.turnCount ?? 0;

    // Flip the record to "pending" as a safety net in case the caller
    // didn't already do it synchronously in the payday mutation. If it
    // was already set (the normal path), this is a harmless no-op write.
    await ctx.runMutation(internal.coachData.startCommentary, {
      roomId,
      turnCount,
    });

    const summary = players
      .map((p) => {
        const netWorth =
          p.money + p.properties.reduce((s, prop) => s + prop.value, 0);
        return `- ${p.name}${p.isBot ? " (bot)" : ""}: $${p.money} cash, $${
          p.savings ?? 0
        } savings, ${p.properties.length} properties (net worth ~$${netWorth})`;
      })
      .join("\n");

    const prompt = `You are a snarky but lovable financial commentator for a board game called Unopoly (Uno + Monopoly). It's payday. Roast/hype the players based on their finances below. Be short, funny, a little savage, and give ONE quirky money tip mixed in. Max 3 sentences total. No markdown, just plain text.

PLAYERS:
${summary}

Respond with ONLY the commentary text, nothing else.`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error(
        "[coach] OPENROUTER_API_KEY is missing/undefined in this Convex deployment's env. " +
          "Run `npx convex env set OPENROUTER_API_KEY <key>` and redeploy.",
      );
      await ctx.runMutation(internal.coachData.finishCommentary, {
        roomId,
        turnCount,
        text: FALLBACK_TEXT,
      });
      return;
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
      await ctx.runMutation(internal.coachData.appendCommentaryChunk, {
        roomId,
        turnCount,
        textSoFar: fullText,
      });
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
          "[coach] OpenRouter returned non-OK status or no body:",
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

          // SSE frames are separated by a blank line; each frame is one
          // or more "data: ..." lines.
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? ""; // keep the last, possibly-partial frame

          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice("data:".length).trim();
            if (payload === "[DONE]") continue;

            let chunk: OpenRouterStreamChunk | null = null;
            try {
              chunk = JSON.parse(payload) as OpenRouterStreamChunk;
            } catch {
              continue; // ignore any malformed/partial frame
            }

            if (chunk?.error) {
              console.error(
                "[coach] OpenRouter stream error payload:",
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
        if (!fullText) {
          console.error("[coach] OpenRouter stream ended with no content");
        } else {
          console.log("[coach] Got commentary text:", fullText.slice(0, 100));
        }
      }
    } catch (e) {
      console.error("[coach] OpenRouter fetch threw an exception:", e);
    }

    if (!fullText) {
      fullText = FALLBACK_TEXT;
    }

    // Final write is unconditional (bypasses the throttle) so the client
    // always ends on the true, complete text — never a stale partial
    // chunk from the last throttle window.
    await ctx.runMutation(internal.coachData.finishCommentary, {
      roomId,
      turnCount,
      text: fullText,
    });
  },
});

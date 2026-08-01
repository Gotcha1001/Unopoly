// // convex/coach.ts
// "use node";

// import { v } from "convex/values";
// import { internalAction } from "./_generated/server";
// import { internal } from "./_generated/api";

// interface OpenRouterErrorPayload {
//   message?: string;
//   code?: number;
// }

// // Shape of one SSE "data:" line from OpenRouter's streaming endpoint —
// // same delta shape as OpenAI's chat.completions stream.
// interface OpenRouterStreamChunk {
//   choices?: {
//     delta?: { content?: string };
//     finish_reason?: string | null;
//   }[];
//   error?: OpenRouterErrorPayload;
// }

// const FALLBACK_TEXT =
//   "The Coach is speechless this week. Your wallets, however, are not.";

// // How often (ms) we're willing to write partial text to Convex while
// // streaming. Writing on every single token would hammer the db with a
// // mutation per word; batching on a short timer keeps the "typing" feel
// // smooth on the client while keeping write volume sane.
// const FLUSH_INTERVAL_MS = 120;

// export const generateWeeklyCommentary = internalAction({
//   args: { roomId: v.id("rooms") },
//   handler: async (ctx, { roomId }) => {
//     const players = await ctx.runQuery(internal.coachData.getPlayersForCoach, {
//       roomId,
//     });
//     const game = await ctx.runQuery(internal.coachData.getGameForCoach, {
//       roomId,
//     });
//     if (!players.length || !game) {
//       console.error("[coach] Aborting: no players or no game found", {
//         roomId,
//         playerCount: players.length,
//         hasGame: !!game,
//       });
//       return;
//     }

//     const turnCount = game.turnCount ?? 0;

//     // Flip the record to "pending" as a safety net in case the caller
//     // didn't already do it synchronously in the payday mutation. If it
//     // was already set (the normal path), this is a harmless no-op write.
//     await ctx.runMutation(internal.coachData.startCommentary, {
//       roomId,
//       turnCount,
//     });

//     // ─── Stock market additions ───────────────────────────────────────
//     // Live per-room prices, same fallback pattern used everywhere else
//     // that reads game.stockPrices (convex/stocks.ts, useStocks.ts client
//     // side): if the room hasn't fluctuated prices yet, fall back to each
//     // holding's avgCost so a share position still values as "roughly
//     // what you paid" instead of $0.
//     const priceById = new Map<string, number>(
//       (game.stockPrices ?? []).map((s) => [s.id, s.price]),
//     );

//     const summary = players
//       .map((p) => {
//         const propertyValue = p.properties.reduce(
//           (s, prop) => s + prop.value,
//           0,
//         );
//         const savings = p.savings ?? 0;
//         const holdings = p.shares ?? [];
//         const sharesValue = holdings.reduce(
//           (s, h) => s + (priceById.get(h.stockId) ?? h.avgCost) * h.quantity,
//           0,
//         );
//         const sharesGainLoss = holdings.reduce((s, h) => {
//           const price = priceById.get(h.stockId) ?? h.avgCost;
//           return s + (price - h.avgCost) * h.quantity;
//         }, 0);
//         const sharesCount = holdings.reduce((s, h) => s + h.quantity, 0);
//         const netWorth = p.money + propertyValue + savings + sharesValue;

//         const sharesPart =
//           sharesCount > 0
//             ? `${sharesCount} shares (~$${Math.round(sharesValue)}, ${
//                 sharesGainLoss >= 0 ? "+" : ""
//               }$${Math.round(sharesGainLoss)} gain/loss)`
//             : "no shares";

//         return `- ${p.name}${p.isBot ? " (bot)" : ""}: $${p.money} cash, $${savings} savings, ${p.properties.length} properties, ${sharesPart} (net worth ~$${Math.round(
//           netWorth,
//         )})`;
//       })
//       .join("\n");

//     const prompt = `You are a snarky but lovable financial commentator for a board game called Unopoly (Uno + Monopoly). It's payday. Roast/hype the players based on their finances below — including their savings balance and any stock positions (call out cash hoarders sitting on fat savings while the market moves, share-heavy players riding gains or nursing losses, or anyone with nothing liquid at all). Be short, funny, a little savage, and give ONE quirky money tip mixed in. Max 3 sentences total. No markdown, just plain text.

// PLAYERS:
// ${summary}

// Respond with ONLY the commentary text, nothing else.`;

//     const apiKey = process.env.OPENROUTER_API_KEY;
//     if (!apiKey) {
//       console.error(
//         "[coach] OPENROUTER_API_KEY is missing/undefined in this Convex deployment's env. " +
//           "Run `npx convex env set OPENROUTER_API_KEY <key>` and redeploy.",
//       );
//       await ctx.runMutation(internal.coachData.finishCommentary, {
//         roomId,
//         turnCount,
//         text: FALLBACK_TEXT,
//       });
//       return;
//     }

//     let fullText = "";
//     let lastFlushed = "";
//     let lastFlushAt = 0;

//     const flush = async (force = false) => {
//       if (fullText === lastFlushed) return;
//       const now = Date.now();
//       if (!force && now - lastFlushAt < FLUSH_INTERVAL_MS) return;
//       lastFlushAt = now;
//       lastFlushed = fullText;
//       await ctx.runMutation(internal.coachData.appendCommentaryChunk, {
//         roomId,
//         turnCount,
//         textSoFar: fullText,
//       });
//     };

//     try {
//       const response = await fetch(
//         "https://openrouter.ai/api/v1/chat/completions",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${apiKey}`,
//           },
//           body: JSON.stringify({
//             model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
//             messages: [{ role: "user", content: prompt }],
//             stream: true,
//           }),
//         },
//       );

//       if (!response.ok || !response.body) {
//         const rawBody = await response.text().catch(() => "");
//         console.error(
//           "[coach] OpenRouter returned non-OK status or no body:",
//           response.status,
//           rawBody.slice(0, 500),
//         );
//       } else {
//         const reader = response.body.getReader();
//         const decoder = new TextDecoder();
//         let buffer = "";

//         while (true) {
//           const { done, value } = await reader.read();
//           if (done) break;

//           buffer += decoder.decode(value, { stream: true });

//           // SSE frames are separated by a blank line; each frame is one
//           // or more "data: ..." lines.
//           const frames = buffer.split("\n\n");
//           buffer = frames.pop() ?? ""; // keep the last, possibly-partial frame

//           for (const frame of frames) {
//             const line = frame.trim();
//             if (!line.startsWith("data:")) continue;
//             const payload = line.slice("data:".length).trim();
//             if (payload === "[DONE]") continue;

//             let chunk: OpenRouterStreamChunk | null = null;
//             try {
//               chunk = JSON.parse(payload) as OpenRouterStreamChunk;
//             } catch {
//               continue; // ignore any malformed/partial frame
//             }

//             if (chunk?.error) {
//               console.error(
//                 "[coach] OpenRouter stream error payload:",
//                 JSON.stringify(chunk.error),
//               );
//               continue;
//             }

//             const delta = chunk?.choices?.[0]?.delta?.content;
//             if (delta) {
//               fullText += delta;
//               await flush();
//             }
//           }
//         }

//         fullText = fullText.trim();
//         if (!fullText) {
//           console.error("[coach] OpenRouter stream ended with no content");
//         } else {
//           console.log("[coach] Got commentary text:", fullText.slice(0, 100));
//         }
//       }
//     } catch (e) {
//       console.error("[coach] OpenRouter fetch threw an exception:", e);
//     }

//     if (!fullText) {
//       fullText = FALLBACK_TEXT;
//     }

//     // Final write is unconditional (bypasses the throttle) so the client
//     // always ends on the true, complete text — never a stale partial
//     // chunk from the last throttle window.
//     await ctx.runMutation(internal.coachData.finishCommentary, {
//       roomId,
//       turnCount,
//       text: fullText,
//     });
//   },
// });
// convex/coach.ts
// convex/coach.ts
// convex/coach.ts
"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
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
  '"Curiouser and curiouser," mutters the Coach, straightening his hat. ' +
  "\"My teacup's gone cold and so has my commentary — spend wisely anyway, won't you?\"";

// How often (ms) we're willing to write partial text to Convex while
// streaming. Same throttle as before, just applied independently per
// player now instead of once for the whole room.
const FLUSH_INTERVAL_MS = 120;

const HATTER_VOICE = `You are the Coach in a board game called Unopoly (Uno + Monopoly) — but you play him as a Mad Hatter: whimsical, riddling, a little unhinged, prone to tea-party metaphors and Wonderland flourishes ("curiouser and curiouser," "off with their debts," "a very merry un-birthday to your bank balance"). You are coaching ONE specific player this payday. Use the OPPONENTS list below by name — call out who's beating them and by roughly how much, or who they're crushing, and give them one piece of actual competitive advice on how to win against those specific rivals (buy up a color set before someone else does, stop hoarding idle cash, start dumping shares before the market turns, etc). This is a real comparison, not just their own numbers in isolation. Be short, funny, a little savage, warmly chaotic, and weave the strategic advice into the chaos rather than listing it flatly. Max 3-4 sentences total. No markdown, just plain text. Respond with ONLY the commentary text, nothing else.`;

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

    // Safety net in case the caller didn't already seed pending rows
    // synchronously in the payday mutation — harmless no-op write if it did.
    await ctx.runMutation(internal.coachData.startCommentary, {
      roomId,
      turnCount,
    });

    const priceById = new Map<string, number>(
      (game.stockPrices ?? []).map((s) => [s.id, s.price]),
    );

    // Rank by net worth so each player's prompt can mention their table
    // standing ("#2 of 4") without dumping everyone else's numbers into
    // their personal commentary.
    const withNetWorth = players.map((p) => {
      const propertyValue = p.properties.reduce((s, prop) => s + prop.value, 0);
      const savings = p.savings ?? 0;
      const holdings = p.shares ?? [];
      const sharesValue = holdings.reduce(
        (s, h) => s + (priceById.get(h.stockId) ?? h.avgCost) * h.quantity,
        0,
      );
      return {
        player: p,
        netWorth: p.money + propertyValue + savings + sharesValue,
      };
    });
    const ranked = [...withNetWorth].sort((a, b) => b.netWorth - a.netWorth);
    const rankByUserId = new Map(
      ranked.map((r, i) => [r.player.userId, i + 1]),
    );

    // Bots still count for ranking/context (so a human's "#2 of 4"
    // standing reflects the whole table) but never get their own
    // generation call — they don't open the modal to read it, and it'd
    // just be wasted API spend.
    const humanPlayers = players.filter((p) => !p.isBot);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error(
        "[coach] OPENROUTER_API_KEY is missing/undefined in this Convex deployment's env. " +
          "Run `npx convex env set OPENROUTER_API_KEY <key>` and redeploy.",
      );
      await Promise.all(
        humanPlayers.map((p) =>
          ctx.runMutation(internal.coachData.finishCommentary, {
            roomId,
            turnCount,
            userId: p.userId,
            text: FALLBACK_TEXT,
          }),
        ),
      );
      return;
    }

    // One independent streamed OpenRouter request PER HUMAN PLAYER, all
    // in parallel — nobody waits on the slowest player's line, and one
    // player's request failing doesn't take anyone else's commentary
    // down with it (allSettled, not all).
    await Promise.allSettled(
      humanPlayers.map(async (player) => {
        const propertyValue = player.properties.reduce(
          (s: number, prop: { value: number }) => s + prop.value,
          0,
        );
        const savings = player.savings ?? 0;
        const holdings = player.shares ?? [];
        const sharesValue = holdings.reduce(
          (
            s: number,
            h: { stockId: string; quantity: number; avgCost: number },
          ) => s + (priceById.get(h.stockId) ?? h.avgCost) * h.quantity,
          0,
        );
        const sharesGainLoss = holdings.reduce(
          (
            s: number,
            h: { stockId: string; quantity: number; avgCost: number },
          ) => {
            const price = priceById.get(h.stockId) ?? h.avgCost;
            return s + (price - h.avgCost) * h.quantity;
          },
          0,
        );
        const sharesCount = holdings.reduce(
          (s: number, h: { quantity: number }) => s + h.quantity,
          0,
        );
        const netWorth = player.money + propertyValue + savings + sharesValue;
        const sharesPart =
          sharesCount > 0
            ? `${sharesCount} shares worth ~$${Math.round(sharesValue)} (${
                sharesGainLoss >= 0 ? "+" : ""
              }$${Math.round(sharesGainLoss)} gain/loss)`
            : "no shares at all";
        const rank = rankByUserId.get(player.userId) ?? players.length;

        // Everyone ELSE at the table (bots included — a human should
        // still know if a bot is beating them), sorted by net worth so
        // the closest rivals are easy to spot, with each one's own rank
        // so the model can say things like "Sarah's one spot above you."
        const opponents = ranked
          .filter((r) => r.player.userId !== player.userId)
          .map((r) => {
            const oppRank = rankByUserId.get(r.player.userId) ?? 0;
            const label = r.player.isBot
              ? `${r.player.name} (bot)`
              : r.player.name;
            return `#${oppRank} ${label}: ~$${Math.round(r.netWorth)} net worth`;
          })
          .join("\n");

        const prompt = `${HATTER_VOICE}

Talk to ${player.name} about THEIR finances this payday:
- Cash: $${player.money}
- Savings: $${savings}
- Properties: ${player.properties.length} (worth ~$${Math.round(propertyValue)})
- Stocks: ${sharesPart}
- Estimated net worth: ~$${Math.round(netWorth)}
- Table standing: #${rank} out of ${players.length} players

OPPONENTS (compare ${player.name} against these by name):
${opponents}

Address ${player.name} by name at least once, and name-drop at least one opponent from the list above by comparing ${player.name}'s numbers to theirs.`;

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
            userId: player.userId,
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
              player.userId,
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
                    "[coach] OpenRouter stream error payload:",
                    player.userId,
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
              console.error(
                "[coach] OpenRouter stream ended with no content",
                player.userId,
              );
            }
          }
        } catch (e) {
          console.error(
            "[coach] OpenRouter fetch threw an exception:",
            player.userId,
            e,
          );
        }

        if (!fullText) {
          fullText = FALLBACK_TEXT;
        }

        // Final write is unconditional (bypasses the throttle) so this
        // player always ends on their true, complete text.
        await ctx.runMutation(internal.coachData.finishCommentary, {
          roomId,
          turnCount,
          userId: player.userId,
          text: fullText,
        });
      }),
    );
  },
});

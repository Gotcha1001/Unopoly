// // convex/coach.ts
// "use node";

// import { v } from "convex/values";
// import { internalAction } from "./_generated/server";
// import { internal } from "./_generated/api";

// export const generateWeeklyCommentary = internalAction({
//   args: { roomId: v.id("rooms") },
//   handler: async (ctx, { roomId }) => {
//     const players = await ctx.runQuery(internal.coachData.getPlayersForCoach, {
//       roomId,
//     });
//     const game = await ctx.runQuery(internal.coachData.getGameForCoach, {
//       roomId,
//     });
//     if (!players.length || !game) return;

//     const summary = players
//       .map((p) => {
//         const netWorth =
//           p.money + p.properties.reduce((s, prop) => s + prop.value, 0);
//         return `- ${p.name}${p.isBot ? " (bot)" : ""}: $${p.money} cash, $${
//           p.savings ?? 0
//         } savings, ${p.properties.length} properties (net worth ~$${netWorth})`;
//       })
//       .join("\n");

//     const prompt = `You are a snarky but lovable financial commentator for a board game called Unopoly (Uno + Monopoly). It's payday. Roast/hype the players based on their finances below. Be short, funny, a little savage, and give ONE quirky money tip mixed in. Max 3 sentences total. No markdown, just plain text.

// PLAYERS:
// ${summary}

// Respond with ONLY the commentary text, nothing else.`;

//     let text = "";
//     try {
//       const response = await fetch(
//         "https://openrouter.ai/api/v1/chat/completions",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           },
//           body: JSON.stringify({
//             model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
//             messages: [{ role: "user", content: prompt }],
//           }),
//         },
//       );
//       const data = await response.json();
//       text = data.choices?.[0]?.message?.content?.trim() || "";
//     } catch (e) {
//       console.error("[coach] OpenRouter call failed:", e);
//     }

//     if (!text) {
//       text =
//         "The Coach is speechless this week. Your wallets, however, are not.";
//     }

//     await ctx.runMutation(internal.coachData.writeCommentary, {
//       roomId,
//       text,
//       turnCount: game.turnCount ?? 0,
//     });
//   },
// });

// convex/coach.ts
// convex/coach.ts
"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ── Minimal typed shape for what we actually read off the response ──
interface OpenRouterErrorPayload {
  message?: string;
  code?: number;
}

interface OpenRouterResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: OpenRouterErrorPayload;
}

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
    } else {
      console.log(
        `[coach] Using OPENROUTER_API_KEY (len=${apiKey.length}, starts with "${apiKey.slice(0, 8)}...")`,
      );
    }

    let text = "";
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
          }),
        },
      );

      const rawBody = await response.text();
      console.log(
        `[coach] OpenRouter responded status=${response.status} ok=${response.ok}`,
      );

      let data: OpenRouterResponse | null;
      try {
        data = JSON.parse(rawBody) as OpenRouterResponse;
      } catch (parseErr) {
        console.error(
          "[coach] Failed to parse OpenRouter response as JSON. Raw body:",
          rawBody.slice(0, 500),
        );
        data = null;
      }

      if (!response.ok) {
        console.error(
          "[coach] OpenRouter returned non-OK status:",
          response.status,
          JSON.stringify(data ?? rawBody).slice(0, 500),
        );
      } else if (data?.error) {
        console.error(
          "[coach] OpenRouter returned an error payload:",
          JSON.stringify(data.error),
        );
      } else {
        text = data?.choices?.[0]?.message?.content?.trim() || "";
        if (!text) {
          console.error(
            "[coach] OpenRouter response had no usable content. Full payload:",
            JSON.stringify(data).slice(0, 1000),
          );
        } else {
          console.log("[coach] Got commentary text:", text.slice(0, 100));
        }
      }
    } catch (e) {
      console.error("[coach] OpenRouter fetch threw an exception:", e);
    }

    if (!text) {
      text =
        "The Coach is speechless this week. Your wallets, however, are not.";
    }

    await ctx.runMutation(internal.coachData.writeCommentary, {
      roomId,
      text,
      turnCount: game.turnCount ?? 0,
    });
  },
});

"use client";

import { useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SoundName =
  | "cardPlay"
  | "cardPlayRed"
  | "cardPlayBlue"
  | "cardPlayGreen"
  | "cardPlayYellow"
  | "cardPlayWild"
  | "cardDraw"
  | "cardDeal"
  | "yourTurn"
  | "unoAlert"
  | "win"
  | "lose"
  | "buttonClick"
  | "roomJoin"
  | "gameStart";

// ─── Audio file helper ────────────────────────────────────────────────────────

function playFile(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => {}); // silently ignore autoplay blocks
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSoundManager() {
  const mutedRef = useRef(false);

  const play = useCallback((sound: SoundName, color?: string) => {
    if (mutedRef.current) return;
    try {
      switch (sound) {
        case "cardPlay":
          // generic — uses color param if passed, falls back to red
          playFile(`/sounds/card-play-${color ?? "red"}.mp3`);
          break;
        case "cardPlayRed":
          playFile("/sounds/card-play-red.mp3");
          break;
        case "cardPlayBlue":
          playFile("/sounds/card-play-blue.mp3");
          break;
        case "cardPlayGreen":
          playFile("/sounds/card-play-green.mp3");
          break;
        case "cardPlayYellow":
          playFile("/sounds/card-play-yellow.mp3");
          break;
        case "cardPlayWild":
          playFile("/sounds/card-play-wild.mp3");
          break;
        case "cardDraw":
          playFile("/sounds/card-draw.mp3");
          break;
        case "cardDeal":
          playFile("/sounds/card-deal.mp3", 0.7);
          break;
        case "yourTurn":
          playFile("/sounds/your-turn.mp3");
          break;
        case "unoAlert":
          playFile("/sounds/uno-alert.mp3");
          break;
        case "win":
          playFile("/sounds/win.mp3");
          break;
        case "lose":
          playFile("/sounds/lose.mp3");
          break;
        case "buttonClick":
          playFile("/sounds/button-click.mp3", 0.5);
          break;
        case "roomJoin":
          playFile("/sounds/room-join.mp3");
          break;
        case "gameStart":
          playFile("/sounds/game-start.mp3");
          break;
      }
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    mutedRef.current = muted;
  }, []);

  const isMuted = useCallback(() => mutedRef.current, []);

  return { play, setMuted, isMuted };
}

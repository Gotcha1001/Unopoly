"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function CoachCommentaryToast({
  coachCommentary,
}: {
  coachCommentary?: { text: string; turnCount: number; at: number };
}) {
  const lastShown = useRef<number>(0);

  useEffect(() => {
    if (!coachCommentary || coachCommentary.at === lastShown.current) return;
    lastShown.current = coachCommentary.at;
    toast(coachCommentary.text, {
      icon: "🧢",
      duration: 8000,
      description: "Your weekly money coach",
    });
  }, [coachCommentary]);

  return null;
}

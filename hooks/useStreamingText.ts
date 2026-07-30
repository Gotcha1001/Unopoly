// hooks/useStreamingText.ts
//
// Convex delivers the coach's text in bursts (every ~120ms server-side
// flush, then however fast the client's subscription re-renders) — not
// one character at a time. Rendered raw, that still looks like text
// "jumping" in chunks rather than a smooth stream.
//
// This hook takes whatever the latest known full text is (`target`) and
// animates a local `displayed` string catching up to it a few
// characters at a time, so it reads as a continuous type-on stream
// regardless of how choppy the underlying updates are. It resets
// automatically whenever `resetKey` changes (pass the payday's
// turnCount) so a new payday always starts from empty.

import { useEffect, useRef, useState } from "react";

export function useStreamingText(target: string, resetKey: string | number) {
  const [displayed, setDisplayed] = useState("");
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const targetRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  // Ref writes must happen outside render (event handlers / effects), never
  // inline in the function body — that's what triggered "Cannot access
  // refs during render". A plain effect fires synchronously enough here
  // since the tick loop is on an 18ms timeout, well after commit.
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  // Reset when resetKey changes — done directly during render rather than
  // in an effect. This is React's own recommended pattern for "adjust
  // state when a prop changes" (see "You Might Not Need An Effect"):
  // calling setState mid-render here bails out and re-renders immediately
  // before paint, instead of committing stale output first and then
  // triggering a second, cascading render from inside an effect.
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setDisplayed("");
  }

  useEffect(() => {
    const CHARS_PER_TICK = 2; // higher = faster catch-up on big chunks
    const TICK_MS = 18;

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setDisplayed((prev) => {
        const full = targetRef.current;
        if (prev.length >= full.length) return prev;
        return full.slice(0, prev.length + CHARS_PER_TICK);
      });
      frameRef.current = window.setTimeout(tick, TICK_MS) as unknown as number;
    };

    frameRef.current = window.setTimeout(tick, TICK_MS) as unknown as number;

    return () => {
      cancelled = true;
      if (frameRef.current) window.clearTimeout(frameRef.current);
    };
  }, [target]);

  return displayed;
}

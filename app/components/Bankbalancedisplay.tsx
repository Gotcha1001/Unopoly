"use client";

import { useEffect, useRef, useState } from "react";

export interface BankBalanceDisplayProps {
  label: string;
  value: number;
  accent?: "gold" | "cream";
  size?: "lg" | "md";
}

/**
 * A small odometer-style counter. When `value` changes it animates from the
 * old number to the new one instead of snapping, so deposits/withdrawals/
 * interest all read as an event rather than a silent state update.
 */
export function BankBalanceDisplay({
  label,
  value,
  accent = "cream",
  size = "lg",
}: BankBalanceDisplayProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const duration = 500;
    const start = performance.now();

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const color = accent === "gold" ? "text-[#C9A227]" : "text-[#F2ECDD]";
  const textSize = size === "lg" ? "text-4xl sm:text-5xl" : "text-2xl";

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F2ECDD]/60">
        {label}
      </p>
      <p
        className={`font-mono font-semibold tabular-nums ${textSize} ${color}`}
      >
        {Math.round(displayValue).toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })}
      </p>
    </div>
  );
}

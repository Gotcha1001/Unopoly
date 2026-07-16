"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

interface AnimatedCashProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  startFromZero?: boolean;
  delay?: number;
  /**
   * Explicit starting value for a one-time count-up, e.g. the player's cash
   * *before* a payday event so the modal can animate cash-before → cash-after.
   * Takes priority over startFromZero when provided.
   */
  from?: number;
}

export function AnimatedCash({
  value,
  prefix = "$",
  suffix = "",
  className,
  startFromZero = false,
  delay = 0,
  from,
}: AnimatedCashProps) {
  const initialValue = from !== undefined ? from : startFromZero ? 0 : value;
  const motionValue = useMotionValue(initialValue);
  const spring = useSpring(motionValue, {
    stiffness: 40, // ↓ was 140 — lower = much slower
    damping: 25, // slight increase to reduce excessive bouncing
    mass: 1.5, // ↑ was 0.6 — higher mass = slower movement
  });
  const display = useTransform(
    spring,
    (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`,
  );

  const scale = useMotionValue(1);
  const mounted = useRef(false);
  const lastValue = useRef(initialValue);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if ((startFromZero || from !== undefined) && value !== initialValue) {
        const t = setTimeout(() => {
          motionValue.set(value);
          lastValue.current = value;
        }, delay);
        return () => clearTimeout(t);
      }
      return;
    }

    if (value !== lastValue.current) {
      motionValue.set(value);
      animate(scale, [1, 1.18, 1], {
        duration: 1.2, // ↑ was 0.5
        ease: "easeOut",
      });
      lastValue.current = value;
    }
  }, [value, motionValue, scale, startFromZero, delay, from, initialValue]);

  return (
    <motion.span
      className={className}
      style={{ scale, display: "inline-block" }}
    >
      {display}
    </motion.span>
  );
}

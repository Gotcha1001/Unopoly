"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UnoCardProps {
  cardId: string;
  size?: "sm" | "md" | "lg";
  isPlayable?: boolean;
  isSelected?: boolean;
  isFaceDown?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
}

export const PROPERTY_UPGRADES_META = [
  {
    id: "upgrade_paint",
    label: "Fresh Paint Job",
    emoji: "🎨",
    description: "A cheap cosmetic refresh that makes buyers take notice.",
    costMultiplier: 0.15,
    valueMultiplier: 0.12,
  },
  {
    id: "upgrade_kitchen",
    label: "Renovated Kitchen",
    emoji: "🍳",
    description: "New countertops and appliances bump resale value.",
    costMultiplier: 0.28,
    valueMultiplier: 0.22,
  },
  {
    id: "upgrade_pool",
    label: "Swimming Pool",
    emoji: "🏊",
    description: "A backyard pool — pricey, but a serious value boost.",
    costMultiplier: 0.45,
    valueMultiplier: 0.35,
  },
  {
    id: "upgrade_extension",
    label: "Extra Floor",
    emoji: "🏗️",
    description: "A full extension — the biggest upgrade available.",
    costMultiplier: 0.6,
    valueMultiplier: 0.5,
  },
] as const;

// ─── Monopoly-Uno additions ──────────────────────────────────────────────────
// Metadata for the "life event" and "property" cards — used purely for
// display here (amounts/labels). The source of truth for game logic lives in
// convex/game.ts; this is duplicated on purpose to match this codebase's
// existing pattern of not importing convex functions into client components.
const LIFE_META: Record<string, { label: string; amount: number }> = {
  life_lottery: { label: "Lottery", amount: 10000 },
  life_bonus: { label: "Bonus", amount: 1500 },
  life_gift: { label: "Gift", amount: 500 },
  life_carrepair: { label: "Car Repair", amount: -400 },
  life_medical: { label: "Medical", amount: -800 },
  life_tax: { label: "Tax Bill", amount: -1200 },
  life_fine: { label: "Fine", amount: -150 },
  life_rent: { label: "Rent", amount: -1000 },
};

const PROPERTY_META: Record<string, { label: string; price: number }> = {
  property_apartment: { label: "Apartment", price: 3000 },
  property_house: { label: "House", price: 6000 },
  property_condo: { label: "Condo", price: 9000 },
  property_hotel: { label: "Hotel", price: 15000 },
  property_mansion: { label: "Mansion", price: 25000 },
};

function formatMoney(n: number) {
  const abs = Math.abs(n);
  const short = abs >= 1000 ? `${Math.round(abs / 100) / 10}k` : `${abs}`;
  return `${n < 0 ? "-" : "+"}$${short}`;
}

export function parseCard(cardId: string): { color: string; value: string } {
  if (cardId === "wild" || cardId === "wild_draw4") {
    return { color: "wild", value: cardId };
  }
  if (LIFE_META[cardId]) return { color: "life", value: cardId };
  if (PROPERTY_META[cardId]) return { color: "property", value: cardId };
  const idx = cardId.indexOf("_");
  if (idx === -1) return { color: "wild", value: cardId };
  return { color: cardId.slice(0, idx), value: cardId.slice(idx + 1) };
}

const VALUE_DISPLAY: Record<string, string> = {
  skip: "⊘",
  reverse: "⇄",
  draw2: "+2",
  wild: "★",
  wild_draw4: "+4",
};

const SIZE_CLASSES = {
  sm: {
    outer: "w-10 h-[3.5rem]",
    corner: "text-[0.5rem]",
    center: "0.55rem",
    radius: "rounded-xl",
  },
  md: {
    outer: "w-[4.2rem] h-[6rem]",
    corner: "text-[0.65rem]",
    center: "1.05rem",
    radius: "rounded-2xl",
  },
  lg: {
    outer: "w-[5.2rem] h-[7.4rem]",
    corner: "text-[0.8rem]",
    center: "1.4rem",
    radius: "rounded-2xl",
  },
};

// Each color: bright saturated center → deep rich edge (radial flow)
const COLOR_STYLES: Record<
  string,
  {
    bg: string;
    glow: string;
    glowColor: string;
    outerRing: string;
    innerBorder: string;
  }
> = {
  red: {
    bg: "radial-gradient(ellipse at 38% 32%, #fca5a5 0%, #ef4444 28%, #dc2626 55%, #991b1b 80%, #450a0a 100%)",
    glow: "rgba(239,68,68,0.75)",
    glowColor: "#ef4444",
    outerRing: "rgba(252,165,165,0.4)",
    innerBorder: "rgba(254,202,202,0.35)",
  },
  blue: {
    bg: "radial-gradient(ellipse at 38% 32%, #bfdbfe 0%, #3b82f6 28%, #2563eb 55%, #1e40af 80%, #172554 100%)",
    glow: "rgba(59,130,246,0.75)",
    glowColor: "#3b82f6",
    outerRing: "rgba(147,197,253,0.4)",
    innerBorder: "rgba(191,219,254,0.35)",
  },
  green: {
    bg: "radial-gradient(ellipse at 38% 32%, #bbf7d0 0%, #22c55e 28%, #16a34a 55%, #166534 80%, #052e16 100%)",
    glow: "rgba(34,197,94,0.75)",
    glowColor: "#22c55e",
    outerRing: "rgba(134,239,172,0.4)",
    innerBorder: "rgba(187,247,208,0.35)",
  },
  yellow: {
    bg: "radial-gradient(ellipse at 38% 32%, #fef9c3 0%, #facc15 28%, #eab308 55%, #a16207 80%, #422006 100%)",
    glow: "rgba(234,179,8,0.75)",
    glowColor: "#eab308",
    outerRing: "rgba(253,224,71,0.4)",
    innerBorder: "rgba(254,249,195,0.4)",
  },
  wild: {
    bg: "radial-gradient(ellipse at 38% 32%, #f0abfc 0%, #a855f7 28%, #7c3aed 55%, #4338ca 78%, #1e1b4b 100%)",
    glow: "rgba(168,85,247,0.8)",
    glowColor: "#a855f7",
    outerRing: "rgba(240,171,252,0.4)",
    innerBorder: "rgba(245,208,254,0.35)",
  },
  // Life-event cards: gold/green cash theme.
  life: {
    bg: "radial-gradient(ellipse at 38% 32%, #fef08a 0%, #facc15 26%, #ca8a04 55%, #713f12 82%, #1c0f02 100%)",
    glow: "rgba(250,204,21,0.75)",
    glowColor: "#facc15",
    outerRing: "rgba(254,240,138,0.4)",
    innerBorder: "rgba(254,249,195,0.35)",
  },
  // Property cards: brown/teal real-estate theme.
  property: {
    bg: "radial-gradient(ellipse at 38% 32%, #99f6e4 0%, #2dd4bf 26%, #0f766e 55%, #134e4a 82%, #042f2c 100%)",
    glow: "rgba(45,212,191,0.75)",
    glowColor: "#2dd4bf",
    outerRing: "rgba(153,246,228,0.4)",
    innerBorder: "rgba(204,251,241,0.35)",
  },
};

export function UnoCard({
  cardId,
  size = "md",
  isPlayable = false,
  isSelected = false,
  isFaceDown = false,
  onClick,
  className,
  style,
  index = 0,
}: UnoCardProps) {
  const { color, value } = parseCard(cardId);
  const lifeMeta = LIFE_META[cardId];
  const propertyMeta = PROPERTY_META[cardId];
  const displayValue = lifeMeta
    ? formatMoney(lifeMeta.amount)
    : propertyMeta
      ? `$${Math.round(propertyMeta.price / 1000)}k`
      : (VALUE_DISPLAY[value] ?? value.toUpperCase());
  const subLabel = lifeMeta?.label ?? propertyMeta?.label;
  const s = SIZE_CLASSES[size];
  const cs = COLOR_STYLES[color] ?? COLOR_STYLES.wild;
  const isWild = color === "wild";
  const isSpecial = color === "life" || color === "property";

  return (
    <motion.div
      className={cn(
        "relative select-none flex-shrink-0",
        s.outer,
        s.radius,
        onClick && isPlayable ? "cursor-pointer" : "cursor-default",
        className,
      )}
      style={{
        ...style,
        boxShadow: isSelected
          ? `0 0 0 3px white, 0 0 0 5px ${cs.glowColor}, 0 0 36px ${cs.glow}, 0 14px 32px rgba(0,0,0,0.55)`
          : isPlayable
            ? `0 0 0 2px ${cs.outerRing}, 0 0 22px ${cs.glow}, 0 6px 18px rgba(0,0,0,0.5)`
            : "0 4px 14px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.3)",
      }}
      initial={{ opacity: 0, y: -16, rotateY: -20 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{
        delay: index * 0.04,
        type: "spring",
        stiffness: 300,
        damping: 22,
      }}
      whileHover={isPlayable ? { y: -16, scale: 1.12, rotateZ: -2 } : undefined}
      whileTap={isPlayable ? { scale: 0.92, rotateZ: 1 } : undefined}
      onClick={isPlayable ? onClick : undefined}
    >
      {/* Card body */}
      <div
        className={cn("absolute inset-0 overflow-hidden", s.radius)}
        style={{
          background: isFaceDown
            ? "radial-gradient(ellipse at 38% 32%, #7c3aed 0%, #4c1d95 35%, #2e1065 65%, #0f0520 100%)"
            : cs.bg,
        }}
      >
        {/* Top-left specular highlight — simulates light source */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 22% 18%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 35%, transparent 60%)",
          }}
        />

        {/* Bottom-right subtle bounce light */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 82% 85%, rgba(255,255,255,0.1) 0%, transparent 50%)",
          }}
        />

        {/* Inset border ring */}
        <div
          className={cn(
            "absolute inset-[3px] pointer-events-none border",
            s.radius,
          )}
          style={{ borderColor: cs.innerBorder, borderWidth: "1.5px" }}
        />

        {!isFaceDown ? (
          <>
            {/* Corner labels */}
            <span
              className={cn(
                "absolute top-1.5 left-2 font-black text-white leading-none",
                s.corner,
              )}
              style={{
                textShadow:
                  "0 1px 4px rgba(0,0,0,0.65), 0 0 10px rgba(255,255,255,0.2)",
              }}
            >
              {displayValue}
            </span>
            <span
              className={cn(
                "absolute bottom-1.5 right-2 font-black text-white leading-none rotate-180",
                s.corner,
              )}
              style={{
                textShadow:
                  "0 1px 4px rgba(0,0,0,0.65), 0 0 10px rgba(255,255,255,0.2)",
              }}
            >
              {displayValue}
            </span>

            {/* Center oval — tilted like real UNO cards */}
            <div
              className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center"
              style={{
                width: "68%",
                height: "72%",
                transform: isSpecial
                  ? "translate(-50%, -50%)"
                  : "translate(-50%, -50%) rotate(-22deg)",
                borderRadius: "50%",
                // Oval itself is a darker radial to create depth against the card bg
                background:
                  "radial-gradient(ellipse at 40% 35%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
                border: `1.5px solid ${cs.innerBorder}`,
                boxShadow: `inset 0 2px 8px rgba(0,0,0,0.3), inset 0 -1px 4px rgba(255,255,255,0.1)`,
              }}
            >
              {/* Oval inner highlight */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: "50%",
                  background:
                    "radial-gradient(ellipse at 35% 28%, rgba(255,255,255,0.22) 0%, transparent 60%)",
                }}
              />
              {isSpecial && (
                <span
                  className="relative z-10"
                  style={{ fontSize: `calc(${s.center} * 0.9)` }}
                >
                  {color === "life" ? "💰" : "🏠"}
                </span>
              )}
              <span
                className="font-black text-white relative z-10"
                style={{
                  fontSize: isSpecial ? `calc(${s.center} * 0.85)` : s.center,
                  transform: isSpecial ? undefined : "rotate(22deg)",
                  textShadow:
                    "0 2px 8px rgba(0,0,0,0.7), 0 0 18px rgba(255,255,255,0.3)",
                  letterSpacing: "-0.02em",
                }}
              >
                {displayValue}
              </span>
              {isSpecial && subLabel && (
                <span
                  className="relative z-10 text-white/85 font-bold leading-none text-center px-1"
                  style={{ fontSize: `calc(${s.corner} * 0.95)` }}
                >
                  {subLabel}
                </span>
              )}
            </div>

            {/* Wild only: slow-spinning conic shimmer overlay */}
            {isWild && (
              <motion.div
                className={cn("absolute inset-0 pointer-events-none", s.radius)}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(248,113,113,0.25), rgba(251,191,36,0.25), rgba(74,222,128,0.25), rgba(96,165,250,0.25), rgba(232,121,249,0.25), rgba(248,113,113,0.25))",
                  mixBlendMode: "screen",
                }}
              />
            )}

            {/* Playable state: pulsing radial glow from center */}
            {isPlayable && (
              <motion.div
                className={cn("absolute inset-0 pointer-events-none", s.radius)}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: `radial-gradient(ellipse at 50% 50%, ${cs.glow} 0%, transparent 72%)`,
                }}
              />
            )}
          </>
        ) : (
          /* Face-down */
          <>
            <div
              className="absolute inset-[5px] pointer-events-none"
              style={{
                borderRadius: "9px",
                border: "1px solid rgba(167,139,250,0.2)",
                background:
                  "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(139,92,246,0.07) 5px, rgba(139,92,246,0.07) 10px)",
              }}
            />
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-white/25 tracking-[0.2em]"
              style={{
                fontSize:
                  size === "lg"
                    ? "0.7rem"
                    : size === "md"
                      ? "0.55rem"
                      : "0.4rem",
              }}
            >
              UNO
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function CardBack({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return <UnoCard cardId="wild" size={size} isFaceDown className={className} />;
}

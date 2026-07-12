"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const FEATURES = [
  {
    title: "Real-Time Multiplayer",
    description:
      "Play live Unopoly matches with friends or players around the world with instant updates powered by Convex.",
    icon: "🌍",
  },
  {
    title: "Cash, Bills & Property",
    description:
      "Lottery wins, car repairs, tax bills, and house deals are shuffled right into the deck. Every card you draw could change your net worth.",
    icon: "💰",
  },
  {
    title: "Going Out Isn't Enough",
    description:
      "Play your last card without being the richest at the table and you're forced to draw 2 and stay in the game. Only the wealthiest player who goes out actually wins.",
    icon: "👑",
  },
];

// Mini demo card for the hero — a mix of classic Uno cards and the new
// life-event / property cards so the hero visual sells the twist immediately.
const DEMO_CARDS = [
  { color: "bg-red-500", value: "7", rotate: -20, x: -140, y: 12 },
  { color: "bg-blue-500", value: "⊘", rotate: -9, x: -75, y: -10 },
  {
    color: "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700",
    value: "+$10k",
    rotate: 0,
    x: -5,
    y: 6,
    sub: "Lottery",
  },
  {
    color: "bg-gradient-to-br from-teal-300 via-teal-500 to-teal-800",
    value: "$6k",
    rotate: 10,
    x: 65,
    y: -8,
    sub: "House",
  },
  {
    color: "bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500",
    value: "+4",
    rotate: 20,
    x: 140,
    y: 12,
  },
];

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.prefetch("/lobby");
  }, [isSignedIn, router]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-white dark:bg-indigo-950">
      {/* Animated dark background blobs */}
      <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-250px] left-[-250px] w-[700px] h-[700px] rounded-full bg-purple-900 opacity-40"
          animate={{ scale: [1, 1.3, 1], x: [0, 120, 0], y: [0, -80, 0] }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "mirror" }}
        />
        <motion.div
          className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-purple-950 opacity-30"
          animate={{ scale: [1, 1.25, 1], x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 30, repeat: Infinity, repeatType: "mirror" }}
        />
        <motion.div
          className="absolute top-[20%] right-[-200px] w-[500px] h-[500px] rounded-full bg-amber-900 opacity-20"
          animate={{ scale: [1, 1.2, 1], x: [0, -60, 0], y: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, repeatType: "mirror" }}
        />
      </div>

      {/* Floating demo cards */}
      <div className="relative h-56 w-full max-w-lg mb-10">
        {DEMO_CARDS.map((card, i) => (
          <motion.div
            key={i}
            className={`absolute w-16 h-24 rounded-2xl ${card.color} shadow-xl border-2 border-white/30 flex flex-col items-center justify-center gap-0.5`}
            style={{
              left: "50%",
              top: "50%",
              marginLeft: card.x - 32,
              marginTop: card.y - 48,
              rotate: card.rotate,
              zIndex: i,
            }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 3,
              delay: i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="bg-white/20 rounded-full w-11 h-14 flex flex-col items-center justify-center border border-white/30 px-1">
              <span className="font-bold text-white text-sm drop-shadow leading-none text-center">
                {card.value}
              </span>
              {card.sub && (
                <span className="text-white/80 text-[8px] font-semibold leading-none mt-1">
                  {card.sub}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero text */}
      <motion.h1
        className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl text-black dark:text-white drop-shadow-lg relative z-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        Welcome to
        <span className="block text-purple-600 dark:text-purple-400 mt-2">
          Unopoly
        </span>
      </motion.h1>

      <motion.p
        className="mt-5 text-gray-600 dark:text-purple-200 text-lg max-w-xl relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        Classic Uno, except every hand is also a bank account. Win the lottery,
        get hit with a car repair bill, buy a house — and remember: going out
        with your last card only wins if you&apos;re the richest player at the
        table.
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="mt-8 flex flex-wrap gap-4 justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        {isSignedIn ? (
          <Button
            size="lg"
            className="text-lg px-10 py-6 bg-purple-600 hover:bg-purple-500 dark:bg-purple-700 dark:hover:bg-purple-600 text-white shadow-lg"
            onClick={() => router.push("/lobby")}
          >
            Enter Lobby →
          </Button>
        ) : (
          <>
            <SignInButton mode="modal" forceRedirectUrl="/lobby">
              <Button
                size="lg"
                className="text-lg px-10 py-6 bg-purple-600 hover:bg-purple-500 text-white shadow-lg"
              >
                Sign In to Play
              </Button>
            </SignInButton>
            <Link href="/sign-up">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-10 py-6 border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                Create Account
              </Button>
            </Link>
          </>
        )}
      </motion.div>

      {/* Feature cards */}
      <motion.div
        className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        {FEATURES.map((feature, index) => (
          <motion.div
            key={index}
            className="p-6 rounded-2xl border border-purple-200 dark:border-purple-800 bg-white/70 dark:bg-purple-950/50 shadow-lg backdrop-blur-sm text-left"
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="text-lg font-semibold mb-2 text-purple-700 dark:text-purple-300">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-purple-200">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Rules strip — quick, scannable summary of the twist */}
      <motion.div
        className="mt-14 max-w-3xl w-full relative z-10 rounded-2xl border border-amber-300/40 dark:border-amber-700/40 bg-amber-50/70 dark:bg-amber-950/20 p-6 text-left backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <h3 className="text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-3">
          How Unopoly is different
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-amber-100/80">
          <li>
            💵 <strong>Life cards</strong> pay out or charge you instantly —
            lottery wins, bonuses, medical bills, car repairs.
          </li>
          <li>
            🏠 <strong>Property cards</strong> offer you a house, condo, or
            hotel to buy — accept if you can afford it, decline if you
            can&apos;t.
          </li>
          <li>
            👑 <strong>Only the richest wins.</strong> Play your last card
            without the highest total wealth (cash + property) and you draw 2
            and keep playing instead of winning.
          </li>
        </ul>
      </motion.div>

      {/* Footer CTA */}
      <motion.div
        className="mt-16 mb-12 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">
          Ready to Get Rich?
        </h2>
        <Link href={isSignedIn ? "/lobby" : "/sign-up"}>
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-500 text-white px-12 py-6 text-lg shadow-xl"
          >
            Start a Game →
          </Button>
        </Link>
      </motion.div>
    </main>
  );
}

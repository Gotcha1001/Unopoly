"use client";

import { motion } from "framer-motion";

const SECTIONS = [
  {
    icon: "🃏",
    title: "The basics",
    body: "Unopoly plays exactly like classic Uno — match color or number, use skips, reverses, and +2s, and try to empty your hand. The twist is what's mixed into the deck and what it takes to actually win.",
  },
  {
    icon: "💵",
    title: "Life cards",
    body: "Gold cards represent everyday money events — a lottery win, a work bonus, a car repair, a tax bill. Play one and it resolves instantly: cash is added or taken from you on the spot. They're wild — playable on any color, any time.",
  },
  {
    icon: "🏠",
    title: "Property cards",
    body: "Teal cards offer you a property — an apartment, house, condo, hotel, or mansion. Play one and you get an Accept/Decline choice. Accept if you can afford the price and want it toward your wealth; Decline and nothing happens. Also wild — playable any time.",
  },
  {
    icon: "📅",
    title: "Rent & payday",
    body: 'Own more than one property at the same time and you start earning rent. Every time a full lap of turns goes by (one "payday"), you collect rent on every property you own, added straight to your cash — completely passive. One property alone earns nothing; two or more turns you into a landlord.',
  },
  {
    icon: "👑",
    title: "Winning",
    body: "Going out (playing your last card) only wins if your total wealth — cash plus everything your properties are worth — is the highest at the table. If someone else has more, you don't win: you draw 2 cards instead and stay in the game. The lucky player who goes out AND has the most wealth takes it all.",
  },
  {
    icon: "⚠️",
    title: "Before you play your last card",
    body: "Once you're down to one card, the game tells you up front whether playing it would actually win or just trigger the draw-2 penalty — so you can decide whether to hold and build up wealth first, or go for it.",
  },
];

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          How to Play Unopoly
        </h1>
        <p className="text-gray-500 dark:text-purple-300">
          Classic Uno, plus a full economy — every hand is also a bank account.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="p-5 rounded-2xl border border-gray-200 dark:border-purple-800 bg-white dark:bg-purple-950/40 shadow-sm flex gap-4"
          >
            <div className="text-3xl leading-none">{section.icon}</div>
            <div>
              <h2 className="text-base font-semibold text-black dark:text-white mb-1">
                {section.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-purple-300 leading-relaxed">
                {section.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-2xl border border-amber-300/50 dark:border-amber-700/40 bg-amber-50/70 dark:bg-amber-950/20">
        <h2 className="text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-3">
          Quick reference
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-amber-100/80">
          <div className="flex justify-between border-b border-amber-200/50 dark:border-amber-800/30 py-1">
            <span>Starting cash</span>
            <span className="font-semibold">$3,000</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/50 dark:border-amber-800/30 py-1">
            <span>Blocked-win penalty</span>
            <span className="font-semibold">Draw 2 cards</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/50 dark:border-amber-800/30 py-1">
            <span>Lottery win</span>
            <span className="font-semibold">+$10,000</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/50 dark:border-amber-800/30 py-1">
            <span>Biggest bill</span>
            <span className="font-semibold">-$1,200 (tax)</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/50 dark:border-amber-800/30 py-1">
            <span>Cheapest property</span>
            <span className="font-semibold">Apartment — $3,000</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/50 dark:border-amber-800/30 py-1">
            <span>Priciest property</span>
            <span className="font-semibold">Mansion — $25,000</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/50 dark:border-amber-800/30 py-1">
            <span>Rent threshold</span>
            <span className="font-semibold">2+ properties owned</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/50 dark:border-amber-800/30 py-1">
            <span>Payday frequency</span>
            <span className="font-semibold">Every full round of turns</span>
          </div>
        </div>
      </div>
    </div>
  );
}

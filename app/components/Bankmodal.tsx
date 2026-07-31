"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useBank } from "@/hooks/useBank";
import { BankVideoHeader } from "./Bankvideoheader";
import { BankAccountPanel } from "./Bankaccountpanel";

export interface BankModalProps {
  open: boolean;
  onClose: () => void;
  videoSrc?: string;
  posterSrc?: string;
  roomId: Id<"rooms">;
  userId: string;
  /** Live cash on hand, straight from the Convex `players` query. */
  cash: number;
  /** Live savings balance, straight from the Convex `players` query
   *  (e.g. `mySavings`). This is the single source of truth — no local
   *  copy is kept anywhere in the bank flow anymore. */
  savings: number;
  interestRate?: number;
}

/**
 * Drop this once near the root of your gameboard, alongside <BankButton />.
 * Deposit/withdraw go straight through the real `bank.deposit` /
 * `bank.withdraw` Convex mutations, so `players.money` and `players.savings`
 * are patched server-side immediately. The live `players` query then pushes
 * the updated `cash`/`savings` back down automatically — same pattern as
 * every other action on the board (draw, play, upgrade, trade...).
 */
export function BankModal({
  open,
  onClose,
  videoSrc,
  posterSrc,
  roomId,
  userId,
  cash,
  savings,
  interestRate,
}: BankModalProps) {
  const depositMutation = useMutation(api.bank.deposit);
  const withdrawMutation = useMutation(api.bank.withdraw);

  const bank = useBank({
    savings,
    interestRate,
    onDeposit: async (amount) => {
      await depositMutation({ roomId, userId, amount });
    },
    onWithdraw: async (amount) => {
      await withdrawMutation({ roomId, userId, amount });
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Bank"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#C9A227]/30 bg-[#0B3D2E] shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <BankVideoHeader
              onClose={onClose}
              videoSrc={videoSrc}
              posterSrc={posterSrc}
            />
            <div className="overflow-y-auto">
              <BankAccountPanel
                cash={cash}
                savings={savings}
                interestRate={bank.interestRate}
                projectedWeeklyInterest={bank.projectedWeeklyInterest}
                transactions={bank.transactions}
                onDeposit={bank.deposit}
                onWithdraw={bank.withdraw}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

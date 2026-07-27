"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useBank, type UseBankOptions } from "@/hooks/useBank";
import { BankVideoHeader } from "./Bankvideoheader";
import { BankAccountPanel } from "./Bankaccountpanel";

export interface BankModalProps extends UseBankOptions {
  open: boolean;
  onClose: () => void;
  videoSrc?: string;
  posterSrc?: string;
}

/**
 * Drop this once near the root of your gameboard, alongside <BankButton />.
 * It owns nothing about game state itself — cash in/out flows through the
 * onCashChange you pass in, same as everywhere else in the game.
 */
export function BankModal({
  open,
  onClose,
  videoSrc,
  posterSrc,
  cash,
  onCashChange,
  initialSavings,
  initialInterestRate,
}: BankModalProps) {
  const bank = useBank({
    cash,
    onCashChange,
    initialSavings,
    initialInterestRate,
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
                savings={bank.savings}
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

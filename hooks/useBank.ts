"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export interface BankActionResult {
  success: boolean;
  message?: string;
}

export interface BankTransaction {
  id: string;
  type: "deposit" | "withdraw" | "interest";
  amount: number;
  balance: number;
  timestamp: number;
}

export interface UseBankOptions {
  /** Current cash on the gameboard. Owned by the caller (game state), not this hook. */
  cash: number;
  /** Called whenever a bank action changes the gameboard cash total. */
  onCashChange: (nextCash: number) => void;
  /** Starting savings balance, e.g. restored from a save file. Defaults to 0. */
  initialSavings?: number;
  /** Weekly interest rate as a decimal, e.g. 0.02 = 2%. Defaults to 2%. */
  initialInterestRate?: number;
}

export interface UseBankReturn {
  savings: number;
  interestRate: number;
  /** What the player would earn on their current balance at the next payday. */
  projectedWeeklyInterest: number;
  transactions: BankTransaction[];
  isProcessing: boolean;
  deposit: (amount: number) => BankActionResult;
  withdraw: (amount: number) => BankActionResult;
  /** Call this from your payday/weekly-tick logic to credit interest on savings. */
  applyWeeklyInterest: () => void;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const MAX_HISTORY = 50;

/**
 * Simple, local-state bank. No backend calls yet — savings live in this
 * hook's state, cash lives on the gameboard and flows back out through
 * `onCashChange`. Deposits can only pull from the cash you pass in, so a
 * card that drains your gameboard cash can never touch savings. Withdrawals
 * always add straight back to gameboard cash, even if that pushes it
 * negative — same rule the rest of the game uses for cash.
 */
export function useBank({
  cash,
  onCashChange,
  initialSavings = 0,
  initialInterestRate = 0.02,
}: UseBankOptions): UseBankReturn {
  const [savings, setSavings] = useState(initialSavings);
  const [interestRate] = useState(initialInterestRate);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Deposit/withdraw read the latest cash without needing it in their
  // dependency array (which would otherwise recreate them every render).
  const cashRef = useRef(cash);
  cashRef.current = cash;

  const pushTransaction = useCallback(
    (type: BankTransaction["type"], amount: number, balance: number) => {
      setTransactions((prev) =>
        [
          { id: makeId(), type, amount, balance, timestamp: Date.now() },
          ...prev,
        ].slice(0, MAX_HISTORY),
      );
    },
    [],
  );

  const deposit = useCallback(
    (amount: number): BankActionResult => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return { success: false, message: "Enter an amount greater than $0." };
      }
      if (amount > cashRef.current) {
        return {
          success: false,
          message: "You don't have that much cash on hand.",
        };
      }
      setIsProcessing(true);
      try {
        const nextCash = cashRef.current - amount;
        let nextSavings = 0;
        setSavings((prev) => {
          nextSavings = prev + amount;
          return nextSavings;
        });
        onCashChange(nextCash);
        pushTransaction("deposit", amount, nextSavings);
        return { success: true };
      } finally {
        setIsProcessing(false);
      }
    },
    [onCashChange, pushTransaction],
  );

  const withdraw = useCallback(
    (amount: number): BankActionResult => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return { success: false, message: "Enter an amount greater than $0." };
      }
      if (amount > savings) {
        return {
          success: false,
          message: "You don't have that much in savings.",
        };
      }
      setIsProcessing(true);
      try {
        const nextSavings = savings - amount;
        const nextCash = cashRef.current + amount; // ok even if this goes negative
        setSavings(nextSavings);
        onCashChange(nextCash);
        pushTransaction("withdraw", amount, nextSavings);
        return { success: true };
      } finally {
        setIsProcessing(false);
      }
    },
    [savings, onCashChange, pushTransaction],
  );

  const projectedWeeklyInterest = useMemo(
    () => Math.round(savings * interestRate),
    [savings, interestRate],
  );

  const applyWeeklyInterest = useCallback(() => {
    setSavings((prev) => {
      const interest = Math.round(prev * interestRate);
      if (interest <= 0) return prev;
      const next = prev + interest;
      pushTransaction("interest", interest, next);
      return next;
    });
  }, [interestRate, pushTransaction]);

  return {
    savings,
    interestRate,
    projectedWeeklyInterest,
    transactions,
    isProcessing,
    deposit,
    withdraw,
    applyWeeklyInterest,
  };
}

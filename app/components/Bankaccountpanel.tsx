// "use client";

// import { useState } from "react";
// import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { BankBalanceDisplay } from "./Bankbalancedisplay";
// import type { BankActionResult, BankTransaction } from "@/hooks/useBank";

// export interface BankAccountPanelProps {
//   cash: number;
//   savings: number;
//   interestRate: number;
//   projectedWeeklyInterest: number;
//   transactions: BankTransaction[];
//   onDeposit: (amount: number) => BankActionResult;
//   onWithdraw: (amount: number) => BankActionResult;
// }

// const QUICK_AMOUNTS = [50, 100, 500];

// export function BankAccountPanel({
//   cash,
//   savings,
//   interestRate,
//   projectedWeeklyInterest,
//   transactions,
//   onDeposit,
//   onWithdraw,
// }: BankAccountPanelProps) {
//   const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
//   const [amountInput, setAmountInput] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [flash, setFlash] = useState<"success" | null>(null);

//   const parsedAmount = Number(amountInput);
//   const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

//   async function runAction() {
//     if (!hasValidAmount) {
//       setError("Enter an amount greater than $0.");
//       return;
//     }
//     const result =
//       mode === "deposit"
//         ? await onDeposit(parsedAmount)
//         : await onWithdraw(parsedAmount);
//     if (!result.success) {
//       setError(result.message ?? "That didn't work.");
//       return;
//     }
//     setError(null);
//     setAmountInput("");
//     setFlash("success");
//     window.setTimeout(() => setFlash(null), 900);
//   }

//   function handleQuickAmount(n: number) {
//     setError(null);
//     setAmountInput(String(n));
//   }

//   const maxForMode = mode === "deposit" ? cash : savings;

//   return (
//     <div className="grid gap-6 p-6 sm:grid-cols-[1.1fr_1fr] sm:p-8">
//       {/* Left: balances + transact */}
//       <div className="space-y-6">
//         <div className="flex items-center justify-between gap-4 rounded-xl border border-[#C9A227]/20 bg-[#06170F] p-4">
//           <BankBalanceDisplay
//             label="Cash on hand"
//             value={cash}
//             accent="cream"
//             size="md"
//           />
//           <BankBalanceDisplay
//             label="Savings"
//             value={savings}
//             accent="gold"
//             size="md"
//           />
//         </div>

//         <div className="flex items-center gap-2 rounded-lg bg-[#0F4A38]/40 px-3 py-2 text-xs text-[#F2ECDD]/80">
//           <TrendingUp className="h-4 w-4 shrink-0 text-[#C9A227]" />
//           <span>
//             Earning{" "}
//             <span className="font-semibold text-[#C9A227]">
//               {(interestRate * 100).toFixed(1)}%
//             </span>{" "}
//             interest per week — about{" "}
//             <span className="font-semibold text-[#C9A227]">
//               ${projectedWeeklyInterest.toLocaleString()}
//             </span>{" "}
//             on payday at this balance.
//           </span>
//         </div>

//         {/* Mode toggle */}
//         <div className="flex rounded-full bg-[#06170F] p-1">
//           <ModeButton
//             active={mode === "deposit"}
//             onClick={() => {
//               setMode("deposit");
//               setError(null);
//             }}
//             icon={<ArrowDownCircle className="h-4 w-4" />}
//             label="Deposit"
//           />
//           <ModeButton
//             active={mode === "withdraw"}
//             onClick={() => {
//               setMode("withdraw");
//               setError(null);
//             }}
//             icon={<ArrowUpCircle className="h-4 w-4" />}
//             label="Withdraw"
//           />
//         </div>

//         {/* Amount entry */}
//         <div className="space-y-3">
//           <div className="flex items-center gap-2 rounded-lg border border-[#C9A227]/30 bg-[#06170F] px-3 py-2 focus-within:border-[#C9A227]">
//             <span className="font-mono text-lg text-[#C9A227]">$</span>
//             <input
//               inputMode="numeric"
//               value={amountInput}
//               onChange={(e) => {
//                 setAmountInput(e.target.value.replace(/[^0-9.]/g, ""));
//                 setError(null);
//               }}
//               placeholder="0"
//               className="w-full bg-transparent font-mono text-lg text-[#F2ECDD] outline-none placeholder:text-[#F2ECDD]/30"
//             />
//             <button
//               type="button"
//               onClick={() =>
//                 handleQuickAmount(Math.max(0, Math.floor(maxForMode)))
//               }
//               className="shrink-0 rounded-md bg-[#C9A227]/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#C9A227] hover:bg-[#C9A227]/25"
//             >
//               Max
//             </button>
//           </div>

//           <div className="flex gap-2">
//             {QUICK_AMOUNTS.map((n) => (
//               <button
//                 key={n}
//                 type="button"
//                 onClick={() => handleQuickAmount(n)}
//                 className="flex-1 rounded-md border border-[#C9A227]/20 py-1.5 font-mono text-xs text-[#F2ECDD]/80 transition hover:border-[#C9A227]/50 hover:text-[#F2ECDD]"
//               >
//                 ${n}
//               </button>
//             ))}
//           </div>

//           {error && <p className="text-xs text-[#E0665A]">{error}</p>}

//           <button
//             type="button"
//             onClick={runAction}
//             className={cn(
//               "w-full rounded-lg py-2.5 font-serif text-sm font-semibold tracking-wide transition",
//               mode === "deposit"
//                 ? "bg-[#C9A227] text-[#06170F] hover:brightness-110"
//                 : "bg-[#F2ECDD] text-[#06170F] hover:brightness-95",
//               flash === "success" && "ring-2 ring-[#C9A227]",
//             )}
//           >
//             {mode === "deposit" ? "Deposit to savings" : "Withdraw to cash"}
//           </button>

//           <p className="text-center text-[11px] text-[#F2ECDD]/40">
//             {mode === "deposit"
//               ? "Only cash sitting on your gameboard can be deposited."
//               : "Withdrawing adds straight to your gameboard cash, even if you're in the red."}
//           </p>
//         </div>
//       </div>

//       {/* Right: activity */}
//       <div className="rounded-xl border border-[#C9A227]/20 bg-[#06170F] p-4">
//         <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F2ECDD]/60">
//           Recent activity
//         </p>
//         {transactions.length === 0 ? (
//           <p className="mt-4 text-sm text-[#F2ECDD]/40">
//             Nothing here yet — make your first deposit.
//           </p>
//         ) : (
//           <ul className="mt-3 space-y-2">
//             {transactions.slice(0, 8).map((t) => (
//               <li
//                 key={t.id}
//                 className="flex items-center justify-between text-xs text-[#F2ECDD]/80"
//               >
//                 <span className="flex items-center gap-2">
//                   {t.type === "deposit" && (
//                     <ArrowDownCircle className="h-3.5 w-3.5 text-[#C9A227]" />
//                   )}
//                   {t.type === "withdraw" && (
//                     <ArrowUpCircle className="h-3.5 w-3.5 text-[#F2ECDD]" />
//                   )}
//                   {t.type === "interest" && (
//                     <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
//                   )}
//                   {t.type === "interest"
//                     ? "Interest"
//                     : t.type === "deposit"
//                       ? "Deposit"
//                       : "Withdrawal"}
//                 </span>
//                 <span className="font-mono">
//                   {t.type === "withdraw" ? "-" : "+"}$
//                   {t.amount.toLocaleString()}
//                 </span>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }

// function ModeButton({
//   active,
//   onClick,
//   icon,
//   label,
// }: {
//   active: boolean;
//   onClick: () => void;
//   icon: React.ReactNode;
//   label: string;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={cn(
//         "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition",
//         active
//           ? "bg-[#C9A227] text-[#06170F]"
//           : "text-[#F2ECDD]/60 hover:text-[#F2ECDD]",
//       )}
//     >
//       {icon}
//       {label}
//     </button>
//   );
// }

"use client";

import { useState, type ReactNode } from "react";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { BankBalanceDisplay } from "./Bankbalancedisplay";
import type { BankActionResult, BankTransaction } from "@/hooks/useBank";

export interface BankAccountPanelProps {
  cash: number;
  savings: number;
  interestRate: number;
  projectedWeeklyInterest: number;
  transactions: BankTransaction[];
  onDeposit: (amount: number) => BankActionResult;
  onWithdraw: (amount: number) => BankActionResult;
}

const QUICK_AMOUNTS = [50, 100, 500];

export function BankAccountPanel({
  cash,
  savings,
  interestRate,
  projectedWeeklyInterest,
  transactions,
  onDeposit,
  onWithdraw,
}: BankAccountPanelProps) {
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<"success" | null>(null);

  const parsedAmount = Number(amountInput);
  const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

  function runAction() {
    if (!hasValidAmount) {
      setError("Enter an amount greater than $0.");
      return;
    }
    const result =
      mode === "deposit" ? onDeposit(parsedAmount) : onWithdraw(parsedAmount);
    if (!result.success) {
      setError(result.message ?? "That didn't work.");
      return;
    }
    setError(null);
    setAmountInput("");
    setFlash("success");
    window.setTimeout(() => setFlash(null), 900);
  }

  function handleQuickAmount(n: number) {
    setError(null);
    setAmountInput(String(n));
  }

  const maxForMode = mode === "deposit" ? cash : savings;

  return (
    <div className="grid gap-6 p-6 sm:grid-cols-[1.1fr_1fr] sm:p-8">
      {/* Left: balances + transact */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#C9A227]/20 bg-[#06170F] p-4">
          <BankBalanceDisplay
            label="Cash on hand"
            value={cash}
            accent="cream"
            size="md"
          />
          <BankBalanceDisplay
            label="Savings"
            value={savings}
            accent="gold"
            size="md"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[#0F4A38]/40 px-3 py-2 text-xs text-[#F2ECDD]/80">
          <TrendingUp className="h-4 w-4 shrink-0 text-[#C9A227]" />
          <span>
            Earning{" "}
            <span className="font-semibold text-[#C9A227]">
              {(interestRate * 100).toFixed(1)}%
            </span>{" "}
            interest per week — about{" "}
            <span className="font-semibold text-[#C9A227]">
              ${projectedWeeklyInterest.toLocaleString()}
            </span>{" "}
            on payday at this balance.
          </span>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-full bg-[#06170F] p-1">
          <ModeButton
            active={mode === "deposit"}
            onClick={() => {
              setMode("deposit");
              setError(null);
            }}
            icon={<ArrowDownCircle className="h-4 w-4" />}
            label="Deposit"
          />
          <ModeButton
            active={mode === "withdraw"}
            onClick={() => {
              setMode("withdraw");
              setError(null);
            }}
            icon={<ArrowUpCircle className="h-4 w-4" />}
            label="Withdraw"
          />
        </div>

        {/* Amount entry */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#C9A227]/30 bg-[#06170F] px-3 py-2 focus-within:border-[#C9A227]">
            <span className="font-mono text-lg text-[#C9A227]">$</span>
            <input
              inputMode="numeric"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value.replace(/[^0-9.]/g, ""));
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") runAction();
              }}
              placeholder="0"
              className="w-full bg-transparent font-mono text-lg text-[#F2ECDD] outline-none placeholder:text-[#F2ECDD]/30"
            />
            <button
              type="button"
              onClick={() =>
                handleQuickAmount(Math.max(0, Math.floor(maxForMode)))
              }
              className="shrink-0 rounded-md bg-[#C9A227]/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#C9A227] hover:bg-[#C9A227]/25"
            >
              Max
            </button>
          </div>

          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleQuickAmount(n)}
                className="flex-1 rounded-md border border-[#C9A227]/20 py-1.5 font-mono text-xs text-[#F2ECDD]/80 transition hover:border-[#C9A227]/50 hover:text-[#F2ECDD]"
              >
                ${n}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-[#E0665A]">{error}</p>}

          <button
            type="button"
            onClick={runAction}
            className={cn(
              "w-full rounded-lg py-2.5 font-serif text-sm font-semibold tracking-wide transition",
              mode === "deposit"
                ? "bg-[#C9A227] text-[#06170F] hover:brightness-110"
                : "bg-[#F2ECDD] text-[#06170F] hover:brightness-95",
              flash === "success" && "ring-2 ring-[#C9A227]",
            )}
          >
            {mode === "deposit" ? "Deposit to savings" : "Withdraw to cash"}
          </button>

          <p className="text-center text-[11px] text-[#F2ECDD]/40">
            {mode === "deposit"
              ? "Only cash sitting on your gameboard can be deposited."
              : "Withdrawing adds straight to your gameboard cash, even if you're in the red."}
          </p>
        </div>
      </div>

      {/* Right: activity */}
      <div className="rounded-xl border border-[#C9A227]/20 bg-[#06170F] p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F2ECDD]/60">
          Recent activity
        </p>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-[#F2ECDD]/40">
            Nothing here yet — make your first deposit.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {transactions.slice(0, 8).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-xs text-[#F2ECDD]/80"
              >
                <span className="flex items-center gap-2">
                  {t.type === "deposit" && (
                    <ArrowDownCircle className="h-3.5 w-3.5 text-[#C9A227]" />
                  )}
                  {t.type === "withdraw" && (
                    <ArrowUpCircle className="h-3.5 w-3.5 text-[#F2ECDD]" />
                  )}
                  {t.type === "interest" && (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {t.type === "interest"
                    ? "Interest"
                    : t.type === "deposit"
                      ? "Deposit"
                      : "Withdrawal"}
                </span>
                <span className="font-mono">
                  {t.type === "withdraw" ? "-" : "+"}$
                  {t.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition",
        active
          ? "bg-[#C9A227] text-[#06170F]"
          : "text-[#F2ECDD]/60 hover:text-[#F2ECDD]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

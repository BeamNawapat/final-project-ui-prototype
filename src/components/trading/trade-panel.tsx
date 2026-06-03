"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSim } from "@/lib/sim/store";
import { connectWallet, mergePosition, placeOrder, splitPosition } from "@/lib/sim/service";
import type { Market, OrderType } from "@/lib/types";

interface TradePanelProps {
  market: Market;
  side: "YES" | "NO";
  onSideChange: (s: "YES" | "NO") => void;
  initialDirection?: "BUY" | "SELL";
  // For MULTI_BRACKET markets — index into `market.outcomes` for the
  // bracket being traded. Binary markets ignore this (always idx 0/1).
  selectedOutcomeIdx?: number;
}

const BUY_CHIPS = [1, 5, 10, 100];
const LIMIT_SHARE_CHIPS = [-100, -10, 10, 100, 200];
const SELL_PERCENT_CHIPS = [25, 50, 75, 100];

export function TradePanel({
  market,
  side,
  onSideChange,
  initialDirection = "BUY",
  selectedOutcomeIdx = 0,
}: TradePanelProps) {
  const wallet = useSim((s) => s.wallet);
  const positions = useSim((s) => s.positions);

  const isMulti = market.type === "MULTI_BRACKET";

  const [direction, setDirection] = useState<"BUY" | "SELL">(initialDirection);
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [amount, setAmount] = useState<number>(0); // USDC for BUY
  const [shares, setShares] = useState<number>(0); // shares for SELL
  const [limitCents, setLimitCents] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);

  // Derive prices from the selected outcome. Binary uses outcomes[0]=YES
  // (selectedOutcomeIdx defaults to 0). Multi-bracket uses the selected
  // bracket's probability as "YES" (this bracket settles) and 1-p as "NO".
  const yesProb = market.outcomes[selectedOutcomeIdx]?.probability ?? 0.5;
  const noProb = 1 - yesProb;
  const yesCents = Math.round(yesProb * 100);
  const noCents = Math.round(noProb * 100);
  const sideProb = side === "YES" ? yesProb : noProb;
  const priceCents = side === "YES" ? yesCents : noCents;

  // Position the user holds on this side, for SELL caps + 25/50/75/Max chips.
  const heldShares = useMemo(() => {
    return positions
      .filter((p) => p.marketId === market.id && p.side === side)
      .reduce((s, p) => s + p.size / Math.max(0.0001, p.avgPrice), 0);
  }, [positions, market.id, side]);

  // Reset inputs when direction or side flips.
  useEffect(() => {
    setAmount(0);
    setShares(0);
  }, [direction, side]);

  // Calculations
  const isSplit = orderType === "SPLIT";
  const isLimit = orderType === "LIMIT";
  // Input mode: BUY MARKET = USDC amount. BUY LIMIT = shares + limit price. SELL = shares.
  const inputIsAmount = !isSplit && direction === "BUY" && !isLimit;
  const effectivePrice = isLimit ? limitCents / 100 : sideProb;
  const sharesOut = inputIsAmount && effectivePrice > 0 ? amount / effectivePrice : 0;
  const buyCost = direction === "BUY" && !inputIsAmount ? shares * effectivePrice : amount;
  const proceeds = direction === "SELL" ? shares * effectivePrice : 0;
  const toWin = direction === "BUY" ? (inputIsAmount ? sharesOut : shares) : 0;

  // Pair holdings — for SPLIT/SELL (merge) we need equal YES + NO on the
  // selected outcome. Binary scopes across the whole market (YES = outcome
  // 0, NO = outcome 1). Multi scopes to the selected bracket only.
  const pairHoldings = useMemo(() => {
    let yes = 0;
    let no = 0;
    for (const p of positions) {
      if (p.marketId !== market.id) continue;
      if (isMulti && p.outcomeIdx !== selectedOutcomeIdx) continue;
      if (p.side === "YES") yes += p.size;
      else if (p.side === "NO") no += p.size;
    }
    return Math.min(yes, no);
  }, [positions, market.id, isMulti, selectedOutcomeIdx]);

  const canSubmit = (() => {
    if (isSplit) {
      if (amount <= 0) return false;
      if (direction === "BUY") return !wallet.connected || amount <= wallet.balance;
      return amount <= pairHoldings;
    }
    if (isLimit && (limitCents < 1 || limitCents > 99)) return false;
    if (direction === "BUY") {
      if (inputIsAmount) return amount > 0 && (!wallet.connected || amount <= wallet.balance);
      return shares > 0 && (!wallet.connected || buyCost <= wallet.balance);
    }
    return shares > 0 && shares <= heldShares;
  })();

  async function handleSubmit() {
    if (!wallet.connected) {
      await connectWallet();
      return;
    }
    setSubmitting(true);
    try {
      if (isSplit) {
        if (direction === "BUY")
          await splitPosition({ marketId: market.id, amount, outcomeIdx: selectedOutcomeIdx });
        else await mergePosition({ marketId: market.id, amount, outcomeIdx: selectedOutcomeIdx });
      } else {
        // Binary maps side → outcome token idx (0 = YES, 1 = NO). Multi
        // uses the selected bracket idx; `side` chooses YES-bracket-N vs
        // NO-bracket-N token at the contract layer.
        const outcomeIdx = isMulti ? selectedOutcomeIdx : side === "YES" ? 0 : 1;
        // BUY MARKET → size = amount USDC. BUY LIMIT → size = shares × limit (USDC).
        // SELL → size = shares.
        const size = direction === "BUY" ? (inputIsAmount ? amount : buyCost) : shares;
        await placeOrder({
          marketId: market.id,
          outcomeIdx,
          side,
          direction,
          orderType,
          size,
          price: effectivePrice,
          limitPrice: isLimit ? limitCents / 100 : undefined,
        });
      }
      setAmount(0);
      setShares(0);
    } catch {
      // toast raised in service
    } finally {
      setSubmitting(false);
    }
  }

  const splitUnits = Math.floor(amount);
  const submitLabel = !wallet.connected
    ? "Connect & Trade"
    : submitting
      ? "Placing…"
      : isSplit
        ? direction === "BUY"
          ? `Mint ${splitUnits} pairs · pay $${amount.toFixed(2)}`
          : `Burn ${splitUnits} pairs · receive $${amount.toFixed(2)}`
        : orderType === "LIMIT"
          ? `Place ${direction === "BUY" ? "Buy" : "Sell"} ${side} Limit`
          : "Trade";

  return (
    <Card className="px-4 py-5 gap-4 sticky top-20 min-h-[345px]">
      {/* Mini market header */}
      <div className="min-w-0">
        <div className="text-sm font-medium line-clamp-1">{market.question}</div>
        {isMulti && !isSplit && (
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <span className="text-sm font-medium text-foreground line-clamp-1">
              {market.outcomes[selectedOutcomeIdx]?.label}
            </span>
            <span
              className={cn(
                "text-sm font-semibold shrink-0",
                side === "YES"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {side === "YES" ? "Yes" : "No"}
            </span>
          </div>
        )}
        {!isMulti && !isSplit && (
          <div
            className={cn(
              "text-sm font-semibold",
              side === "YES"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {side}
          </div>
        )}
        {isSplit && isMulti && (
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <span className="text-sm font-medium text-foreground line-clamp-1">
              {market.outcomes[selectedOutcomeIdx]?.label}
            </span>
            <span className="text-sm font-semibold text-primary shrink-0">
              {direction === "BUY" ? "Mint pair (Yes + No)" : "Burn pair → $1 each"}
            </span>
          </div>
        )}
        {isSplit && !isMulti && (
          <div className="text-sm font-semibold text-primary">
            {direction === "BUY" ? "Mint pair (YES + NO)" : "Burn pair → $1 each"}
          </div>
        )}
      </div>

      {/* Buy / Sell tabs + order type */}
      <div className="flex items-center justify-between border-b">
        <div className="flex gap-4">
          <TabButton active={direction === "BUY"} onClick={() => setDirection("BUY")}>
            Buy
          </TabButton>
          <TabButton active={direction === "SELL"} onClick={() => setDirection("SELL")}>
            Sell
          </TabButton>
        </div>
        <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
          <SelectTrigger className="w-[110px] h-7 text-xs gap-1 border-0 shadow-none hover:bg-muted/40 -mr-2 py-0 justify-between">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MARKET">Market</SelectItem>
            <SelectItem value="LIMIT">Limit</SelectItem>
            <SelectItem value="SPLIT">Split</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Outcome pill buttons — hidden on SPLIT */}
      {!isSplit && (
        <div className="grid grid-cols-2 gap-2">
          <OutcomeButton
            label={`Yes ${yesCents}¢`}
            tone="yes"
            selected={side === "YES"}
            onClick={() => onSideChange("YES")}
          />
          <OutcomeButton
            label={`No ${noCents}¢`}
            tone="no"
            selected={side === "NO"}
            onClick={() => onSideChange("NO")}
          />
        </div>
      )}

      {/* Body */}
      {isSplit ? (
        <SplitBody
          amount={amount}
          setAmount={setAmount}
          balance={wallet.balance}
          direction={direction}
          pairHoldings={pairHoldings}
          isMulti={isMulti}
          bracketLabel={market.outcomes[selectedOutcomeIdx]?.label ?? ""}
        />
      ) : direction === "BUY" ? (
        <BuyBody
          amount={amount}
          setAmount={setAmount}
          shares={shares}
          setShares={setShares}
          balance={wallet.balance}
          orderType={orderType}
          limitCents={limitCents}
          setLimitCents={setLimitCents}
        />
      ) : (
        <SellBody
          shares={shares}
          setShares={setShares}
          heldShares={heldShares}
          orderType={orderType}
          limitCents={limitCents}
          setLimitCents={setLimitCents}
        />
      )}

      {/* Payout readout — only when user has entered an amount/shares */}
      {isSplit && amount > 0 && (
        <SplitReadout amount={amount} direction={direction} />
      )}
      {!isSplit && direction === "BUY" && isLimit && (
        <LimitBuyReadout total={buyCost} toWin={toWin} limitCents={limitCents} />
      )}
      {!isSplit && direction === "BUY" && !isLimit && amount > 0 && (
        <PayoutRow
          label="To win"
          amount={toWin}
          subLabel={`Avg. Price ${Math.round(effectivePrice * 100)}¢`}
        />
      )}
      {!isSplit && direction === "SELL" && shares > 0 && (
        <PayoutRow
          label="You'll receive"
          amount={proceeds}
          subLabel={`Avg. Price ${Math.round(effectivePrice * 100)}¢`}
        />
      )}

      <Button
        className={cn(
          "w-full h-11 text-sm font-semibold mt-auto",
          isSplit
            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
            : side === "YES"
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-rose-500 hover:bg-rose-600 text-white",
          !canSubmit && wallet.connected && "opacity-60",
        )}
        disabled={submitting || (wallet.connected && !canSubmit)}
        onClick={handleSubmit}
      >
        {submitLabel}
      </Button>

    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "py-2 text-sm font-medium relative transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-foreground rounded-full" />}
    </button>
  );
}

function OutcomeButton({
  label,
  tone,
  selected,
  onClick,
}: {
  label: string;
  tone: "yes" | "no";
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-md font-semibold text-sm transition-all",
        selected
          ? tone === "yes"
            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            : "bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
          : "bg-muted/60 text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function BigAmountInput({
  amount,
  setAmount,
  label = "Amount",
  prefix = "$",
}: {
  amount: number;
  setAmount: (n: number) => void;
  label?: string;
  prefix?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <label className="text-sm font-medium pb-1">{label}</label>
      <div className="flex items-baseline gap-0.5">
        {prefix && (
          <span className="text-xl font-semibold text-muted-foreground">{prefix}</span>
        )}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={amount || ""}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          placeholder="0.00"
          className="w-32 text-right text-2xl font-semibold tabular-nums bg-transparent outline-none placeholder:text-muted-foreground/40 focus:placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  );
}

function BuyBody({
  amount,
  setAmount,
  shares,
  setShares,
  balance,
  orderType,
  limitCents,
  setLimitCents,
}: {
  amount: number;
  setAmount: (n: number) => void;
  shares: number;
  setShares: (n: number) => void;
  balance: number;
  orderType: OrderType;
  limitCents: number;
  setLimitCents: (n: number) => void;
}) {
  // LIMIT → Limit price + Shares. MARKET → Amount (USDC).
  if (orderType === "LIMIT") {
    return (
      <div className="space-y-2">
        <LimitPriceInput value={limitCents} onChange={setLimitCents} />
        <BigAmountInput amount={shares} setAmount={setShares} label="Shares" prefix="" />
        <div className="flex gap-1.5">
          {LIMIT_SHARE_CHIPS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setShares(Math.max(0, shares + v))}
              className="flex-1 rounded-full border text-xs font-medium py-1.5 hover:bg-muted/60"
            >
              {v > 0 ? `+${v}` : v}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground text-right">
          Balance: ${balance.toFixed(2)}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <BigAmountInput amount={amount} setAmount={setAmount} />
      <div className="flex gap-1.5">
        {BUY_CHIPS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(Math.max(0, amount + v))}
            disabled={balance > 0 && amount + v > balance}
            className="flex-1 rounded-full border text-xs font-medium py-1.5 hover:bg-muted/60 disabled:opacity-40"
          >
            +${v}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground text-right">
        Balance: ${balance.toFixed(2)}
      </div>
    </div>
  );
}

function SellBody({
  shares,
  setShares,
  heldShares,
  orderType,
  limitCents,
  setLimitCents,
}: {
  shares: number;
  setShares: (n: number) => void;
  heldShares: number;
  orderType: OrderType;
  limitCents: number;
  setLimitCents: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      {orderType === "LIMIT" && (
        <LimitPriceInput value={limitCents} onChange={setLimitCents} />
      )}
      <BigAmountInput amount={shares} setAmount={setShares} label="Shares" prefix="" />
      <div className="flex gap-1.5">
        {SELL_PERCENT_CHIPS.map((pct) => (
          <button
            key={pct}
            type="button"
            disabled={heldShares <= 0}
            onClick={() => setShares(Number(((heldShares * pct) / 100).toFixed(4)))}
            className="flex-1 rounded-full border text-xs font-medium py-1.5 hover:bg-muted/60 disabled:opacity-40"
          >
            {pct === 100 ? "Max" : `${pct}%`}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground text-right">
        Holdings: {heldShares.toFixed(2)} shares
      </div>
    </div>
  );
}

function LimitPriceInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const clamp = (n: number) => Math.max(1, Math.min(99, Math.round(n)));
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium">Limit price</label>
      <div className="inline-flex items-center rounded-md border bg-background h-9 overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          className="grid place-items-center w-9 h-9 hover:bg-muted/60 text-muted-foreground"
          aria-label="Decrease limit price"
        >
          −
        </button>
        <div className="px-2 min-w-[3.5rem] text-center">
          <input
            type="number"
            min={1}
            max={99}
            step={1}
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
            className="w-12 text-right text-sm font-mono tabular-nums bg-transparent outline-none"
          />
          <span className="text-sm font-mono text-muted-foreground">¢</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          className="grid place-items-center w-9 h-9 hover:bg-muted/60 text-muted-foreground"
          aria-label="Increase limit price"
        >
          +
        </button>
      </div>
    </div>
  );
}

function SplitBody({
  amount,
  setAmount,
  balance,
  direction,
  pairHoldings,
  isMulti,
  bracketLabel,
}: {
  amount: number;
  setAmount: (n: number) => void;
  balance: number;
  direction: "BUY" | "SELL";
  pairHoldings: number;
  isMulti: boolean;
  bracketLabel: string;
}) {
  const isBuy = direction === "BUY";
  return (
    <div className="space-y-2">
      <BigAmountInput
        amount={amount}
        setAmount={setAmount}
        label={isBuy ? "Amount" : "Pairs"}
        prefix={isBuy ? "$" : ""}
      />
      <div className="flex gap-1.5">
        {isBuy
          ? BUY_CHIPS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(Math.max(0, amount + v))}
                disabled={balance > 0 && amount + v > balance}
                className="flex-1 rounded-full border text-xs font-medium py-1.5 hover:bg-muted/60 disabled:opacity-40"
              >
                +${v}
              </button>
            ))
          : SELL_PERCENT_CHIPS.map((pct) => (
              <button
                key={pct}
                type="button"
                disabled={pairHoldings <= 0}
                onClick={() => setAmount(Number(((pairHoldings * pct) / 100).toFixed(4)))}
                className="flex-1 rounded-full border text-xs font-medium py-1.5 hover:bg-muted/60 disabled:opacity-40"
              >
                {pct === 100 ? "Max" : `${pct}%`}
              </button>
            ))}
      </div>
      <div className="text-[11px] text-muted-foreground text-right">
        {isBuy
          ? `Balance: $${balance.toFixed(2)}`
          : isMulti
            ? `Pair holdings on ${bracketLabel}: ${pairHoldings.toFixed(2)} (min YES & NO)`
            : `Pair holdings: ${pairHoldings.toFixed(2)} (min YES & NO)`}
      </div>
    </div>
  );
}

function SplitReadout({
  amount,
  direction,
}: {
  amount: number;
  direction: "BUY" | "SELL";
}) {
  const pairs = Math.floor(amount);
  const isBuy = direction === "BUY";
  const label = isBuy ? "received" : "burned";
  return (
    <div className="border-t pt-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-semibold">
            YES {label}
          </div>
          <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {pairs}
          </div>
        </div>
        <div className="rounded-md bg-rose-500/10 border border-rose-500/30 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300 font-semibold">
            NO {label}
          </div>
          <div className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">
            {pairs}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        {isBuy ? "Pay" : "Receive"}: <span className="font-mono">${amount.toFixed(2)}</span>.{" "}
        {isBuy
          ? "Mint = deposit collateral, receive YES + NO pair. Price-neutral."
          : "Merge = burn equal YES + NO, redeem $1 per pair."}
      </p>
    </div>
  );
}

function LimitBuyReadout({
  total,
  toWin,
  limitCents,
}: {
  total: number;
  toWin: number;
  limitCents: number;
}) {
  return (
    <div className="border-t pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Total</div>
          <div className="text-[11px] text-muted-foreground">
            {limitCents}¢/share · cost at fill
          </div>
        </div>
        <div className="text-xl font-bold tabular-nums">${total.toFixed(2)}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium flex items-center gap-1">
          To win <span aria-hidden>💵</span>
        </div>
        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          ${toWin.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function PayoutRow({
  label,
  amount,
  subLabel,
}: {
  label: string;
  amount: number;
  subLabel: string;
}) {
  return (
    <div className="flex items-center justify-between border-t pt-3">
      <div>
        <div className="text-sm font-medium flex items-center gap-1">
          {label} <span aria-hidden>💵</span>
        </div>
        <div className="text-[11px] text-muted-foreground">{subLabel}</div>
      </div>
      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
        ${amount.toFixed(2)}
      </div>
    </div>
  );
}

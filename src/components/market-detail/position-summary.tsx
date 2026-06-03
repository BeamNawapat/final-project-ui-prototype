"use client";

import { useMemo } from "react";
import { useSim } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

interface PositionSummaryProps {
  marketId: string;
  /** Current best-bid in cents (0..100) to mark-to-market YES. NO uses 100 - bid. */
  bestBidCents?: number;
  /** When market is RESOLVED, pass winning outcomeIdx to show PnL. */
  winningOutcomeIdx?: number;
  /** Hide entirely if user has no position. */
  hideEmpty?: boolean;
  /** Compact heading text. */
  title?: string;
}

interface SideAgg {
  shares: number;
  cost: number;
  avgPrice: number;
}

export function PositionSummary({
  marketId,
  bestBidCents,
  winningOutcomeIdx,
  hideEmpty = false,
  title = "Your position",
}: PositionSummaryProps) {
  const positions = useSim((s) => s.positions);

  const agg = useMemo(() => {
    const init = (): SideAgg => ({ shares: 0, cost: 0, avgPrice: 0 });
    const yes = init();
    const no = init();
    for (const p of positions) {
      if (p.marketId !== marketId) continue;
      const target = p.side === "YES" ? yes : no;
      target.shares += p.size;
      target.cost += p.size * p.avgPrice;
    }
    if (yes.shares > 0) yes.avgPrice = yes.cost / yes.shares;
    if (no.shares > 0) no.avgPrice = no.cost / no.shares;
    return { yes, no };
  }, [positions, marketId]);

  const hasYes = agg.yes.shares > 0;
  const hasNo = agg.no.shares > 0;
  const hasAny = hasYes || hasNo;

  if (!hasAny && hideEmpty) return null;

  // Mark-to-market
  const yesMark =
    typeof winningOutcomeIdx === "number"
      ? winningOutcomeIdx === 0
        ? 1
        : 0
      : typeof bestBidCents === "number"
        ? bestBidCents / 100
        : agg.yes.avgPrice;
  const noMark =
    typeof winningOutcomeIdx === "number"
      ? winningOutcomeIdx === 1
        ? 1
        : 0
      : typeof bestBidCents === "number"
        ? (100 - bestBidCents) / 100
        : agg.no.avgPrice;

  const yesPnl = agg.yes.shares * yesMark - agg.yes.cost;
  const noPnl = agg.no.shares * noMark - agg.no.cost;
  const totalPnl = yesPnl + noPnl;
  const totalValue = agg.yes.shares * yesMark + agg.no.shares * noMark;

  return (
    <div className="rounded-lg border bg-background/40 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        {hasAny && (
          <div className="text-xs font-semibold tabular-nums">
            <span className="text-muted-foreground">Value </span>
            <span className="text-foreground">${totalValue.toFixed(2)}</span>
          </div>
        )}
      </div>

      {!hasAny && (
        <p className="text-xs text-muted-foreground italic">No position on this market.</p>
      )}

      {hasYes && (
        <SideRow
          side="YES"
          shares={agg.yes.shares}
          avgPrice={agg.yes.avgPrice}
          mark={yesMark}
          pnl={yesPnl}
          settled={typeof winningOutcomeIdx === "number"}
          isWinner={winningOutcomeIdx === 0}
        />
      )}
      {hasNo && (
        <SideRow
          side="NO"
          shares={agg.no.shares}
          avgPrice={agg.no.avgPrice}
          mark={noMark}
          pnl={noPnl}
          settled={typeof winningOutcomeIdx === "number"}
          isWinner={winningOutcomeIdx === 1}
        />
      )}

      {hasAny && (
        <div className="flex items-center justify-between border-t pt-2 text-xs">
          <span className="text-muted-foreground">Net PnL</span>
          <span
            className={cn(
              "font-mono font-semibold tabular-nums",
              totalPnl > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : totalPnl < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground",
            )}
          >
            {totalPnl > 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

function SideRow({
  side,
  shares,
  avgPrice,
  mark,
  pnl,
  settled,
  isWinner,
}: {
  side: "YES" | "NO";
  shares: number;
  avgPrice: number;
  mark: number;
  pnl: number;
  settled: boolean;
  isWinner: boolean;
}) {
  const sideTone =
    side === "YES"
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30";
  const pnlTone =
    pnl > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : pnl < 0
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";

  return (
    <div className="grid grid-cols-[48px_1fr_auto] items-center gap-2 text-xs">
      <span
        className={cn(
          "px-1.5 py-0.5 rounded-full text-center font-semibold border",
          sideTone,
        )}
      >
        {side}
      </span>
      <span className="text-muted-foreground tabular-nums">
        {shares.toFixed(2)} sh · avg{" "}
        <span className="font-mono">{Math.round(avgPrice * 100)}¢</span>
        {settled && (
          <span className="ml-1">
            · {isWinner ? "won $1.00" : "lost $0.00"}
          </span>
        )}
        {!settled && (
          <span className="ml-1">
            · mark <span className="font-mono">{Math.round(mark * 100)}¢</span>
          </span>
        )}
      </span>
      <span className={cn("font-mono font-semibold tabular-nums", pnlTone)}>
        {pnl > 0 ? "+" : ""}${pnl.toFixed(2)}
      </span>
    </div>
  );
}

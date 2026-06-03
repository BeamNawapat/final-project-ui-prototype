"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PositionSummary } from "../position-summary";
import { useSim } from "@/lib/sim/store";
import { connectWallet, redeemPosition } from "@/lib/sim/service";
import { cn } from "@/lib/utils";
import type { Market } from "@/lib/types";

interface ResolvedPanelProps {
  market: Market;
}

export function ResolvedPanel({ market }: ResolvedPanelProps) {
  const wallet = useSim((s) => s.wallet);
  const positions = useSim((s) => s.positions);
  const [submitting, setSubmitting] = useState(false);

  const winning = market.resolvedOutcome;
  const winningIdx = winning?.outcomeIdx;

  const claimable = useMemo(() => {
    if (typeof winningIdx !== "number") return 0;
    return positions
      .filter((p) => p.marketId === market.id && p.outcomeIdx === winningIdx)
      .reduce((s, p) => s + p.size, 0);
  }, [positions, market.id, winningIdx]);

  const userHasAnyPosition = positions.some((p) => p.marketId === market.id);

  // Color the panel by outcome side (binary only here).
  const isBinaryYes = market.type === "BINARY" && winningIdx === 0;
  const isBinaryNo = market.type === "BINARY" && winningIdx === 1;
  const headTone = isBinaryYes
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : isBinaryNo
      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
      : "bg-violet-500/15 text-violet-600 dark:text-violet-400";

  async function handleRedeem() {
    if (!wallet.connected) {
      await connectWallet();
      return;
    }
    setSubmitting(true);
    try {
      await redeemPosition(market.id);
    } catch {
      // toast raised in service
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="px-4 py-7 gap-4 sticky top-20 min-h-[345px]">
      <div className="flex items-center gap-2">
        <span className={cn("grid place-items-center size-9 rounded-full", headTone)}>
          <Trophy className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Market resolved</h2>
          <p className="text-[11px] text-muted-foreground">Final outcome on-chain</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Settlement is final. Winning shares pay $1.00 each from the escrow; losing shares pay
        $0. Redeem your position any time — no expiry.
        {market.type === "MULTI_BRACKET" && (
          <>
            {" "}
            Holders on other brackets&apos; NO side also redeem at $1.00 per share.
          </>
        )}
      </p>

      {winning && (
        <div className="flex-1 flex items-center">
          <div
            className={cn(
              "w-full rounded-lg border-2 px-4 py-3",
              isBinaryYes
                ? "border-emerald-500/40 bg-emerald-500/10"
                : isBinaryNo
                  ? "border-rose-500/40 bg-rose-500/10"
                  : "border-violet-500/40 bg-violet-500/10",
            )}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Winning outcome
            </div>
            <div className="text-2xl font-bold text-foreground">{winning.label}</div>
            <div className="text-xs text-muted-foreground font-mono">
              Settled @ {winning.settlementPriceLabel}
            </div>
          </div>
        </div>
      )}

      <PositionSummary
        marketId={market.id}
        winningOutcomeIdx={winningIdx}
        hideEmpty
      />

      {claimable > 0 && (
        <Button
          className="w-full h-11 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          disabled={submitting}
          onClick={handleRedeem}
        >
          <Coins className="size-4" />
          {submitting ? "Claiming…" : `Redeem $${claimable.toFixed(2)}`}
        </Button>
      )}

      {!userHasAnyPosition && (
        <p className="text-xs text-muted-foreground text-center">
          No position on this market.
        </p>
      )}

      {userHasAnyPosition && claimable === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Your position lost — no payout. See history in{" "}
          <Link href="/portfolio" className="underline">
            portfolio
          </Link>
          .
        </p>
      )}
    </Card>
  );
}

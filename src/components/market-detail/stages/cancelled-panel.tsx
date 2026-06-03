"use client";

import { useMemo, useState } from "react";
import { Ban, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PositionSummary } from "../position-summary";
import { useSim } from "@/lib/sim/store";
import { connectWallet, refundCancelled } from "@/lib/sim/service";
import type { Market } from "@/lib/types";

interface CancelledPanelProps {
  market: Market;
}

export function CancelledPanel({ market }: CancelledPanelProps) {
  const wallet = useSim((s) => s.wallet);
  const positions = useSim((s) => s.positions);
  const [submitting, setSubmitting] = useState(false);

  const refundable = useMemo(
    () =>
      positions
        .filter((p) => p.marketId === market.id)
        .reduce((s, p) => s + p.size * p.avgPrice, 0),
    [positions, market.id],
  );

  async function handleRefund() {
    if (!wallet.connected) {
      await connectWallet();
      return;
    }
    setSubmitting(true);
    try {
      await refundCancelled(market.id);
    } catch {
      // toast raised in service
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="px-4 py-5 gap-4 sticky top-20 min-h-[345px]">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center size-9 rounded-full bg-muted text-muted-foreground">
          <Ban className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Market cancelled</h2>
          <p className="text-[11px] text-muted-foreground">Refunds at face value</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        This market was cancelled before settlement. All positions are refundable at avg-cost
        basis (no winner, no loser).
      </p>

      {market.reason && (
        <div className="rounded-lg border bg-background/40 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
            Reason
          </div>
          <p className="text-xs leading-snug text-foreground/80">{market.reason}</p>
        </div>
      )}

      <PositionSummary marketId={market.id} hideEmpty />

      <div className="mt-auto" />

      {refundable > 0 && (
        <Button
          className="w-full h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={submitting}
          onClick={handleRefund}
        >
          <Undo2 className="size-4" />
          {submitting ? "Refunding…" : `Refund $${refundable.toFixed(2)}`}
        </Button>
      )}

      {refundable === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          No position to refund on this market.
        </p>
      )}
    </Card>
  );
}

"use client";

import { AlertOctagon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PositionSummary } from "../position-summary";
import { ReporterListPanel } from "../reporter-list-panel";
import { copyAddress } from "@/lib/sim/service";
import type { Market } from "@/lib/types";

interface DisputedPanelProps {
  market: Market;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function DisputedPanel({ market }: DisputedPanelProps) {
  const bestBid = market.orderbook?.bids[0]?.price;
  return (
    <Card className="px-4 py-5 gap-4 sticky top-20 min-h-[345px]">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center size-9 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
          <AlertOctagon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Challenge filed</h2>
          <p className="text-[11px] text-muted-foreground">Under admin review</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        An admin will resolve this dispute by upholding the reporter&apos;s proposal or flipping
        it via <code className="font-mono">AgriOracleV2.resolveDispute</code>.
      </p>

      {market.proposedOutcome && (
        <div className="rounded-lg border bg-background/40 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
            Proposed by oracle (now contested)
          </div>
          <div className="text-sm font-semibold text-foreground/70 line-through decoration-rose-500/60 decoration-1">
            {market.proposedOutcome.label}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {market.proposedOutcome.settlementPriceLabel}
          </div>
        </div>
      )}

      {market.challenge && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300 font-semibold">
            Challenger
          </div>
          <button
            type="button"
            onClick={() => copyAddress(market.challenge!.challenger)}
            className="font-mono text-xs text-foreground hover:underline"
            title="Copy challenger address"
          >
            {market.challenge.challenger}
          </button>
          <p className="text-xs text-foreground/80 leading-snug">
            “{market.challenge.reason}”
          </p>
          <p className="text-[10px] text-muted-foreground">
            Filed {relTime(market.challenge.filedAt)}
          </p>
        </div>
      )}

      <ReporterListPanel reporters={market.reporters ?? []} defaultCollapsed />

      <div className="mt-auto" />

      <PositionSummary marketId={market.id} bestBidCents={bestBid} hideEmpty />
    </Card>
  );
}

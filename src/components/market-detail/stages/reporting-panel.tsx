"use client";

import { Satellite } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountdownRow } from "../countdown-row";
import { PositionSummary } from "../position-summary";
import { ReporterListPanel } from "../reporter-list-panel";
import type { Market } from "@/lib/types";

interface ReportingPanelProps {
  market: Market;
}

export function ReportingPanel({ market }: ReportingPanelProps) {
  const bestBid = market.orderbook?.bids[0]?.price;
  const reportingEnd = market.reportingEndsAt;

  return (
    <Card className="px-4 py-5 gap-4 sticky top-20 min-h-[345px]">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center size-9 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
          <Satellite className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Oracle reporters submitting</h2>
          <p className="text-[11px] text-muted-foreground">Median price decides</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Decentralized reporters are signing the settlement price. When the window closes the
        median wins.
      </p>

      {reportingEnd && (
        <CountdownRow
          label="Dispute opens in"
          target={reportingEnd}
          start={market.resolutionTime}
          size="lg"
          tone="blue"
        />
      )}

      {market.proposedOutcome && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs">
          <div className="text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-300 font-semibold mb-0.5">
            Running median
          </div>
          <div className="text-sm font-semibold text-foreground">
            {market.proposedOutcome.label}{" "}
            <span className="text-muted-foreground font-mono ml-1">
              @ {market.proposedOutcome.settlementPriceLabel}
            </span>
          </div>
        </div>
      )}

      <ReporterListPanel reporters={market.reporters ?? []} />

      <div className="mt-auto" />

      <PositionSummary marketId={market.id} bestBidCents={bestBid} hideEmpty />
    </Card>
  );
}

"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountdownRow } from "../countdown-row";
import { PositionSummary } from "../position-summary";
import type { Market } from "@/lib/types";

interface ClosedPanelProps {
  market: Market;
}

export function ClosedPanel({ market }: ClosedPanelProps) {
  const bestBid = market.orderbook?.bids[0]?.price;
  return (
    <Card className="px-4 py-5 gap-4 sticky top-20 min-h-[345px]">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center size-9 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Lock className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Trading ended</h2>
          <p className="text-[11px] text-muted-foreground">Awaiting oracle reporters</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Orders are no longer accepted. Oracle reporters will submit prices once the resolution
        time is reached.
      </p>

      <CountdownRow
        label="Reporting opens in"
        target={market.resolutionTime}
        start={market.tradingCutoffTime}
        size="lg"
        tone="amber"
      />

      <PositionSummary marketId={market.id} bestBidCents={bestBid} hideEmpty />

      <Button asChild variant="outline" className="w-full mt-auto">
        <Link href={`/portfolio?market=${market.id}`}>View my positions</Link>
      </Button>
    </Card>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";
import type { Market } from "@/lib/types";
import { OutcomeChip } from "./outcome-chip";

export function MarketCardBodyDisputed({ market }: { market: Market }) {
  const proposed = market.proposedOutcome;
  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold leading-snug line-clamp-2">{market.question}</p>
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm dark:bg-rose-500/15">
        <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-300">
          <AlertTriangle className="size-3.5" />
          Challenge filed
        </div>
        <div className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
          Awaiting admin resolution
        </div>
      </div>
      {proposed && (
        <OutcomeChip
          label={`Proposed: ${proposed.label}`}
          settlementPriceLabel={proposed.settlementPriceLabel}
          tone="neutral"
        />
      )}
    </div>
  );
}

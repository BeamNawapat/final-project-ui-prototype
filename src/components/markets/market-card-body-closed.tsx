"use client";

import { Clock } from "lucide-react";
import type { Market } from "@/lib/types";
import { InactiveOutcomeList } from "./inactive-outcome-list";

export function MarketCardBodyClosed({ market }: { market: Market }) {
  const hasProposed = !!market.proposedOutcome;
  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold leading-snug line-clamp-2">{market.question}</p>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm dark:bg-amber-500/15">
        <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
          <Clock className="size-3.5" />
          Trading ended
        </div>
        <div className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
          {hasProposed
            ? `Proposed: ${market.proposedOutcome?.label}`
            : "Awaiting oracle reporters…"}
        </div>
      </div>
      <InactiveOutcomeList market={market} />
    </div>
  );
}

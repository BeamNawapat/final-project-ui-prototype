"use client";

import { OutcomeChip } from "./outcome-chip";
import type { Market } from "@/lib/types";

export function MarketCardBodyResolved({ market }: { market: Market }) {
  const out = market.resolvedOutcome;
  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold leading-snug line-clamp-2">{market.question}</p>
      {out && (
        <OutcomeChip
          label={out.label}
          settlementPriceLabel={out.settlementPriceLabel}
          tone={market.type === "BINARY" ? undefined : "neutral"}
        />
      )}
    </div>
  );
}

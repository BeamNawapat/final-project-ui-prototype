"use client";

import { Button } from "@/components/ui/button";
import { ChanceGauge } from "./chance-gauge";
import type { Market } from "@/lib/types";

interface Props {
  market: Market;
  onTrade: (outcomeIdx: number, side: "YES" | "NO") => void;
}

export function MarketCardBodyBinaryActive({ market, onTrade }: Props) {
  const yesProb = market.outcomes[0]?.probability ?? 0;

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex items-start gap-3">
        <p className="flex-1 text-[15px] font-semibold leading-snug line-clamp-2">
          {market.question}
        </p>
        <ChanceGauge value={yesProb} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <Button
          variant="outline"
          className="h-9 bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/25 hover:text-emerald-700 dark:text-emerald-300 font-semibold"
          onClick={(e) => {
            e.stopPropagation();
            onTrade(0, "YES");
          }}
        >
          Yes
        </Button>
        <Button
          variant="outline"
          className="h-9 bg-rose-500/15 text-rose-700 border-rose-500/30 hover:bg-rose-500/25 hover:text-rose-700 dark:text-rose-300 font-semibold"
          onClick={(e) => {
            e.stopPropagation();
            onTrade(1, "NO");
          }}
        >
          No
        </Button>
      </div>
    </div>
  );
}

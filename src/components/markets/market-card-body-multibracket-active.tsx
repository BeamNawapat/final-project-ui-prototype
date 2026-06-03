"use client";

import { BracketRow } from "./bracket-row";
import type { Market } from "@/lib/types";

interface Props {
  market: Market;
  onTrade: (outcomeIdx: number, side: "YES" | "NO") => void;
}

export function MarketCardBodyMultiBracketActive({ market, onTrade }: Props) {
  const top = [...market.outcomes]
    .map((o, i) => ({ ...o, idx: i }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-[15px] font-semibold leading-snug line-clamp-2">{market.question}</p>
      <div className="divide-y divide-border/60 mt-auto">
        {top.map((o) => (
          <BracketRow
            key={o.idx}
            label={o.label}
            probability={o.probability}
            onYes={() => onTrade(o.idx, "YES")}
            onNo={() => onTrade(o.idx, "NO")}
          />
        ))}
      </div>
    </div>
  );
}

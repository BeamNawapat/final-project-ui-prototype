"use client";

import { useSim } from "@/lib/sim/store";
import { deriveMarketStage } from "@/lib/market-stage";

import { MarketCard } from "./market-card";

export function MarketsGrid() {
  const markets = useSim((s) => s.markets);
  const filters = useSim((s) => s.filters);

  const visible = markets.filter((m) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (!m.question.toLowerCase().includes(q) && !m.productName.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters.type !== "ALL" && m.type !== filters.type) return false;
    const stage = deriveMarketStage(m);
    // Hide CANCELLED from public list unless explicitly filtered — it's a
    // terminal post-mortem state with no trader action. PENDING stays
    // visible so users can browse upcoming markets and subscribe to open.
    if (filters.stage === "ALL" && stage === "CANCELLED") {
      return false;
    }
    if (filters.stage !== "ALL" && stage !== filters.stage) return false;
    return true;
  });

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        No markets match the current filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {visible.map((m) => (
        <MarketCard key={m.id} market={m} />
      ))}
    </div>
  );
}

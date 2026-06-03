import { Pause } from "lucide-react";
import type { Market } from "@/lib/types";
import { InactiveOutcomeList } from "./inactive-outcome-list";

export function MarketCardBodyPaused({ market }: { market: Market }) {
  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold leading-snug line-clamp-2">{market.question}</p>
      <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm dark:bg-orange-500/15">
        <div className="flex items-center gap-1.5 font-semibold text-orange-700 dark:text-orange-300">
          <Pause className="size-3.5" />
          Paused by admin
        </div>
        <div className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-0.5">
          Trading suspended — last prices below
        </div>
      </div>
      <InactiveOutcomeList market={market} />
    </div>
  );
}

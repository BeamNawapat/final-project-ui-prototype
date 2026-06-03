import { Hourglass } from "lucide-react";
import type { Market } from "@/lib/types";
import { InactiveOutcomeList } from "./inactive-outcome-list";

export function MarketCardBodyPending({ market }: { market: Market }) {
  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold leading-snug line-clamp-2">{market.question}</p>
      <div className="rounded-lg border border-slate-500/30 bg-slate-500/10 px-3 py-2 text-sm dark:bg-slate-500/15">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <Hourglass className="size-3.5" />
          Awaiting oracle activation
        </div>
        <div className="text-xs text-slate-700/80 dark:text-slate-300/80 mt-0.5">
          Trading will open shortly
        </div>
      </div>
      <InactiveOutcomeList market={market} />
    </div>
  );
}

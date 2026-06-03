import { Ban } from "lucide-react";
import type { Market } from "@/lib/types";

export function MarketCardBodyCancelled({ market }: { market: Market }) {
  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold leading-snug line-clamp-2">{market.question}</p>
      <div className="rounded-lg border border-zinc-500/30 bg-zinc-500/10 px-3 py-2 text-sm dark:bg-zinc-500/15">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
          <Ban className="size-3.5" />
          Cancelled
        </div>
        <div className="text-xs text-zinc-700/80 dark:text-zinc-300/80 mt-0.5">
          No payouts — positions refunded
        </div>
      </div>
    </div>
  );
}

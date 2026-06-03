"use client";

import type { Orderbook } from "@/lib/types";

interface LastQuoteSnapshotProps {
  book: Orderbook;
  label?: string;
}

export function LastQuoteSnapshot({ book, label = "Last quote" }: LastQuoteSnapshotProps) {
  const bestBid = book.bids[0]?.price ?? 0;
  const bestAsk = book.asks[0]?.price ?? 100;
  const spread = bestAsk - bestBid;
  return (
    <div className="rounded-xl border bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </span>
      <div className="flex items-center gap-4 font-mono tabular-nums">
        <span className="inline-flex items-baseline gap-1">
          <span className="text-emerald-600 dark:text-emerald-400 text-base font-semibold">
            {bestBid}¢
          </span>
          <span className="text-muted-foreground">bid</span>
        </span>
        <span className="inline-flex items-baseline gap-1">
          <span className="text-rose-600 dark:text-rose-400 text-base font-semibold">
            {bestAsk}¢
          </span>
          <span className="text-muted-foreground">ask</span>
        </span>
        <span className="text-muted-foreground">
          spread <span className="text-foreground font-semibold">{spread}¢</span>
        </span>
      </div>
    </div>
  );
}

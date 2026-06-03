"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Orderbook, OrderRow } from "@/lib/types";

interface OrderbookPanelProps {
  book: Orderbook;
}

function fmtShares(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/**
 * Flip a YES ladder into the equivalent NO ladder.
 * NO_price = 100 − YES_price. NO bids are the mirror of YES asks (and vice versa)
 * because selling YES at p¢ = buying NO at (100-p)¢.
 */
function flipToNo(book: Orderbook): Orderbook {
  const flipRow = (r: OrderRow): OrderRow => ({
    price: 100 - r.price,
    shares: r.shares,
    total: r.total,
  });
  return {
    bids: book.asks.map(flipRow), // YES asks → NO bids
    asks: book.bids.map(flipRow), // YES bids → NO asks
  };
}

export function OrderbookPanel({ book }: OrderbookPanelProps) {
  const [tradeSide, setTradeSide] = useState<"YES" | "NO">("YES");
  const [spinning, setSpinning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);

  // Center the Last/Spread strip in the scroll viewport on mount + reopen + side flip.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const center = () => {
      const container = scrollRef.current;
      const midEl = midRef.current;
      if (!container || !midEl) return;
      const cRect = container.getBoundingClientRect();
      const mRect = midEl.getBoundingClientRect();
      const midTopWithinScroll = mRect.top - cRect.top + container.scrollTop;
      const target = midTopWithinScroll - container.clientHeight / 2 + midEl.clientHeight / 2;
      container.scrollTop = Math.max(0, target);
    };
    raf = requestAnimationFrame(() => {
      center();
      requestAnimationFrame(center);
    });
    return () => cancelAnimationFrame(raf);
  }, [open, tradeSide]);

  function handleRefresh(e: React.MouseEvent) {
    e.stopPropagation();
    setSpinning(true);
    toast.success("Order book refreshed");
    setTimeout(() => setSpinning(false), 600);
  }

  const view = tradeSide === "YES" ? book : flipToNo(book);
  const bestBid = view.bids[0]?.price ?? 0;
  const bestAsk = view.asks[0]?.price ?? 100;
  const spread = bestAsk - bestBid;
  const mid = ((bestBid + bestAsk) / 2).toFixed(0);

  // Max shares for depth-bar scaling
  const maxShares = Math.max(
    ...view.bids.map((r) => r.shares),
    ...view.asks.map((r) => r.shares),
    1,
  );

  return (
    <div className="rounded-xl border bg-card">
      <div>
          {/* Tabs + utility actions */}
          <div className="flex items-center border-b px-2">
            <div className="flex flex-1">
              <SideTab active={tradeSide === "YES"} tone="yes" onClick={() => setTradeSide("YES")}>
                Trade Yes
              </SideTab>
              <SideTab active={tradeSide === "NO"} tone="no" onClick={() => setTradeSide("NO")}>
                Trade No
              </SideTab>
            </div>
            <button
              type="button"
              aria-label="Refresh order book"
              title="Refresh"
              onClick={handleRefresh}
              className="grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground mr-1"
            >
              <RefreshCw className={cn("size-3.5", spinning && "animate-spin")} />
            </button>
          </div>

          <div className="px-3 py-3">
            {/* Column header */}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold py-2 border-b pl-1">
              <span className="inline-flex items-center gap-1.5 text-foreground">
                Trade {tradeSide === "YES" ? "Yes" : "No"}
                <ArrowLeftRight className="size-3 opacity-60" />
              </span>
              <span className="text-center">Price</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Total</span>
            </div>

            {/* Single global scroll container around asks + Last/Spread + bids */}
            <div
              ref={scrollRef}
              className="max-h-[360px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Asks (highest at top, best/lowest at bottom — closest to mid divider) */}
              <div>
                {[...view.asks].reverse().map((row, idx, arr) => (
                  <BookRow
                    key={`a-${row.price}`}
                    row={row}
                    tone="ask"
                    maxShares={maxShares}
                    pill={idx === arr.length - 1 ? "Asks" : undefined}
                  />
                ))}
              </div>

              {/* Last / Spread strip — anchor row, asks above + bids below */}
              <div
                ref={midRef}
                className="grid grid-cols-2 items-center gap-2 py-2 my-1 text-xs border-y font-mono tabular-nums bg-card"
              >
                <span className="text-muted-foreground pl-1">
                  Last: <span className="text-foreground">{mid}¢</span>
                </span>
                <span className="text-muted-foreground text-right pr-1">
                  Spread: <span className="text-foreground">{spread}¢</span>
                </span>
              </div>

              {/* Bids (best at top, closest to mid divider above) */}
              <div>
                {view.bids.map((row, idx) => (
                  <BookRow
                    key={`b-${row.price}`}
                    row={row}
                    tone="bid"
                    maxShares={maxShares}
                    pill={idx === 0 ? "Bids" : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

function BookRow({
  row,
  tone,
  maxShares,
  pill,
}: {
  row: OrderRow;
  tone: "ask" | "bid";
  maxShares: number;
  pill?: string;
}) {
  const depthPct = Math.min(100, (row.shares / maxShares) * 100);
  const barBg = tone === "ask" ? "bg-rose-500/25" : "bg-emerald-500/25";
  const priceClass =
    tone === "ask"
      ? "text-rose-600 dark:text-rose-400"
      : "text-emerald-600 dark:text-emerald-400";
  const pillBg = tone === "ask" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white";

  return (
    <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-2 py-1.5 text-xs font-mono tabular-nums">
      {/* Depth bar + overlaid pill in leftmost column */}
      <div className="relative h-5 flex items-center pl-1">
        <div
          aria-hidden
          className={cn("absolute inset-y-0 left-0 rounded-sm", barBg)}
          style={{ width: `${depthPct}%` }}
        />
        {pill && (
          <span
            className={cn(
              "relative z-10 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold normal-case",
              pillBg,
            )}
          >
            {pill}
          </span>
        )}
      </div>
      <span className={cn("text-center font-semibold", priceClass)}>{row.price}¢</span>
      <span className="text-right text-foreground">{fmtShares(row.shares)}</span>
      <span className="text-right text-foreground">${(row.total / 100).toFixed(2)}</span>
    </div>
  );
}

function SideTab({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "yes" | "no";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 text-sm font-semibold relative transition-colors",
        active
          ? tone === "yes"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active && (
        <span
          className={cn(
            "absolute left-0 right-0 -bottom-px h-0.5 rounded-full",
            tone === "yes" ? "bg-emerald-500" : "bg-rose-500",
          )}
        />
      )}
    </button>
  );
}


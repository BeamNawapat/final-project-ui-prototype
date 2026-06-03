"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PortfolioEmpty } from "./portfolio-empty";
import type { OrderRecord, TradeRecord, Market } from "@/lib/types";

interface ActivityTabProps {
  orders: OrderRecord[];
  trades: TradeRecord[];
  markets: Market[];
}

interface ActivityItem {
  id: string;
  ts: number;
  marketId: string;
  marketLabel: string;
  action: string; // "BUY YES", "SELL NO", "SPLIT YES+NO", etc.
  side: "YES" | "NO" | null;
  priceCents: number;
  amount: string; // "12.00 sh" or "$10.00"
  txHash?: string;
  direction: "BUY" | "SELL" | null;
  orderType?: string;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export function ActivityTab({ orders, trades, markets }: ActivityTabProps) {
  const marketMap = useMemo(() => new Map(markets.map((m) => [m.id, m])), [markets]);

  const items: ActivityItem[] = useMemo(() => {
    const result: ActivityItem[] = [];

    // FILLED orders
    for (const o of orders) {
      if (o.status !== "FILLED") continue;
      const market = marketMap.get(o.marketId);
      const outcomeLabel = market?.outcomes[o.outcomeIdx]?.label ?? `Outcome ${o.outcomeIdx + 1}`;
      let action: string;
      if (o.orderType === "SPLIT") {
        action = o.direction === "BUY" ? "MINT" : "MERGE";
      } else {
        action = `${o.direction} ${o.side}`;
      }
      result.push({
        id: o.id,
        ts: new Date(o.createdAt).getTime(),
        marketId: o.marketId,
        marketLabel: market?.productName ?? o.marketId,
        action,
        side: o.side,
        priceCents: Math.round(o.price * 100),
        amount:
          o.direction === "SELL"
            ? `${o.size.toFixed(1)} sh`
            : `$${o.size.toFixed(2)}`,
        txHash: o.txHash,
        direction: o.direction,
        orderType: o.orderType,
      });
    }

    // TradeRecord feed (seeded mock history)
    for (const t of trades) {
      result.push({
        id: t.id,
        ts: new Date(t.timestamp).getTime(),
        marketId: t.marketId,
        marketLabel: t.marketTitle,
        action: `BUY ${t.side}`,
        side: t.side,
        priceCents: Math.round(t.pricePerShare * 100),
        amount: `${t.shares} sh`,
        direction: "BUY",
      });
    }

    // Newest first
    result.sort((a, b) => b.ts - a.ts);
    return result;
  }, [orders, trades, marketMap]);

  if (items.length === 0) {
    return (
      <PortfolioEmpty
        title="No activity yet"
        description="Your filled orders and trade history will appear here."
      />
    );
  }

  return (
    <Card className="px-4 py-4 gap-0">
      {/* Header */}
      <div className="grid grid-cols-[100px_1fr_64px_72px_80px] gap-2 pb-2 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        <span>Time</span>
        <span>Market</span>
        <span className="text-center">Action</span>
        <span className="text-right">Price</span>
        <span className="text-right">Amount</span>
      </div>

      <ul className="divide-y divide-border/60">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[100px_1fr_64px_72px_80px] items-center gap-2 py-2 text-xs"
          >
            {/* Time */}
            <span className="text-[11px] text-muted-foreground tabular-nums font-mono">
              {fmtTime(new Date(item.ts).toISOString())}
            </span>

            {/* Market */}
            <div className="min-w-0">
              <div className="font-medium truncate text-foreground/80">{item.marketLabel}</div>
              {item.txHash && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  tx {item.txHash.slice(0, 10)}…
                </span>
              )}
            </div>

            {/* Action pill */}
            <span
              className={cn(
                "text-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border",
                item.action.startsWith("BUY") || item.action === "MINT"
                  ? item.side === "YES"
                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                    : item.side === "NO"
                      ? "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30"
                      : "text-violet-700 dark:text-violet-300 bg-violet-500/10 border-violet-500/30"
                  : "text-muted-foreground bg-muted/40 border-border",
              )}
            >
              {item.action}
            </span>

            {/* Price */}
            <span className="text-right tabular-nums font-mono text-muted-foreground">
              {item.priceCents}¢
            </span>

            {/* Amount */}
            <span className="text-right tabular-nums font-mono text-foreground/80">
              {item.amount}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

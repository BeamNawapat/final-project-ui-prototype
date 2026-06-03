"use client";

import { useState } from "react";
import { Clock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cancelOrder } from "@/lib/sim/service";
import { PortfolioEmpty } from "./portfolio-empty";
import type { OrderRecord, Market } from "@/lib/types";

interface OpenOrdersTabProps {
  orders: OrderRecord[];
  markets: Market[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function OpenOrdersTab({ orders, markets }: OpenOrdersTabProps) {
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());
  const marketMap = new Map(markets.map((m) => [m.id, m]));

  const openOrders = orders.filter(
    (o) => o.orderType === "LIMIT" && o.status === "OPEN",
  );

  if (openOrders.length === 0) {
    return (
      <PortfolioEmpty
        title="No open orders"
        description="Limit orders you place will appear here until they fill or you cancel them."
      />
    );
  }

  async function handleCancel(orderId: string) {
    setCancelling((prev) => new Set(prev).add(orderId));
    try {
      await cancelOrder(orderId);
    } finally {
      setCancelling((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  return (
    <Card className="px-4 py-4 gap-0">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_48px_56px_56px_72px_40px] gap-2 pb-2 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        <span>Market</span>
        <span className="text-center">Side</span>
        <span className="text-right">Limit</span>
        <span className="text-right">Size</span>
        <span className="text-right">Placed</span>
        <span />
      </div>

      <ul className="divide-y divide-border/60">
        {openOrders.map((order) => {
          const market = marketMap.get(order.marketId);
          const outcomeLabel =
            market?.outcomes[order.outcomeIdx]?.label ?? `Outcome ${order.outcomeIdx + 1}`;
          const isCancelling = cancelling.has(order.id);

          return (
            <li
              key={order.id}
              className="grid grid-cols-[1fr_48px_56px_56px_72px_40px] items-center gap-2 py-2.5 text-xs"
            >
              {/* Market + outcome */}
              <div className="min-w-0">
                <div className="font-medium truncate text-foreground/80">
                  {market?.productName ?? order.marketId}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {outcomeLabel}
                </div>
              </div>

              {/* Side pill */}
              <span
                className={cn(
                  "text-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase",
                  order.side === "YES"
                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                    : "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30",
                )}
              >
                {order.side}
              </span>

              {/* Limit price */}
              <span className="text-right tabular-nums font-mono text-foreground/80">
                {Math.round((order.limitPrice ?? order.price) * 100)}¢
              </span>

              {/* Size */}
              <span className="text-right tabular-nums font-mono text-muted-foreground">
                ${order.size.toFixed(0)}
              </span>

              {/* Age */}
              <span className="text-right tabular-nums text-muted-foreground inline-flex items-center justify-end gap-1">
                <Clock className="size-3 shrink-0" />
                {timeAgo(order.createdAt)}
              </span>

              {/* Cancel */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-rose-500"
                  disabled={isCancelling}
                  onClick={() => handleCancel(order.id)}
                  title="Cancel order"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

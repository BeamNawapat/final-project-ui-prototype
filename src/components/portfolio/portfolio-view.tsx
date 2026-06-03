"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSim } from "@/lib/sim/store";
import { deriveMarketStage } from "@/lib/market-stage";
import { aggregatePortfolio } from "@/lib/portfolio";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PortfolioSummary } from "./portfolio-summary";
import { PositionsTab } from "./positions-tab";
import { OpenOrdersTab } from "./open-orders-tab";
import { ActivityTab } from "./activity-tab";

type TabKey = "positions" | "orders" | "activity";

function PortfolioViewInner() {
  const positions = useSim((s) => s.positions);
  const orders = useSim((s) => s.orders);
  const trades = useSim((s) => s.trades);
  const markets = useSim((s) => s.markets);
  const wallet = useSim((s) => s.wallet);

  const searchParams = useSearchParams();
  const highlightMarket = searchParams.get("market");

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("positions");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll to highlighted market card when it's present.
  useEffect(() => {
    if (!mounted || !highlightMarket) return;
    const el = document.getElementById(`mkt-${highlightMarket}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [mounted, highlightMarket]);

  const now = useMemo(() => new Date(), [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  const agg = useMemo(() => {
    if (!mounted) return null;
    return aggregatePortfolio(positions, markets, (m) => deriveMarketStage(m, now));
  }, [positions, markets, mounted, now]);

  const openOrders = useMemo(
    () => orders.filter((o) => o.orderType === "LIMIT" && o.status === "OPEN"),
    [orders],
  );

  const filledCount = useMemo(
    () => orders.filter((o) => o.status === "FILLED").length + trades.length,
    [orders, trades],
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gradient">Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Positions, orders and trade activity
        </p>
      </div>

      {/* Summary stat cards */}
      <PortfolioSummary
        totalValue={agg?.totalValue ?? 0}
        cash={wallet.balance}
        totalPnl={agg?.totalPnl ?? 0}
        positionCount={agg?.openPositionCount ?? 0}
        mounted={mounted}
      />

      {/* Tabbed sections */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="space-y-4"
      >
        <TabsList className="h-9">
          <TabsTrigger value="positions" className="gap-1.5">
            Positions
            {mounted && positions.length > 0 && (
              <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-px">
                {positions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            Open Orders
            {mounted && openOrders.length > 0 && (
              <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-px">
                {openOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            Activity
            {mounted && filledCount > 0 && (
              <span className="rounded-full bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-px">
                {filledCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <PositionsTab
            positions={positions}
            markets={markets}
            mounted={mounted}
            highlightMarket={highlightMarket}
          />
        </TabsContent>

        <TabsContent value="orders">
          <OpenOrdersTab orders={orders} markets={markets} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab orders={orders} trades={trades} markets={markets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function PortfolioView() {
  return (
    <Suspense>
      <PortfolioViewInner />
    </Suspense>
  );
}

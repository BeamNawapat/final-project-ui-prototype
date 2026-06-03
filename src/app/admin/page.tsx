"use client";

import Link from "next/link";
import { Activity, AlertTriangle, CheckCheck, Clock, ExternalLink, ListChecks } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSim } from "@/lib/sim/store";
import { deriveMarketStage } from "@/lib/market-stage";
import { adminResolveMarket, adminTriggerResolutionCycle } from "@/lib/sim/service";
import { toast } from "sonner";

function fmtAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AdminDashboardPage() {
  const markets = useSim((s) => s.markets);
  const trades = useSim((s) => s.trades);
  const oracleParams = useSim((s) => s.oracleParams);

  const counts: Record<string, number> = {};
  for (const m of markets) {
    const s = deriveMarketStage(m);
    counts[s] = (counts[s] ?? 0) + 1;
  }

  const pending = markets.filter(
    (m) => m.status === "ACTIVE" && new Date(m.resolutionTime).getTime() < Date.now(),
  );

  return (
    <>
      <AdminPageHeader
        title="Admin Dashboard"
        description="Operational overview of the AgriCast protocol — markets, oracle health, recent activity."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => adminTriggerResolutionCycle()}>
              <Activity className="size-4" />
              Resolution cycle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Scrape triggered (GET /admin/scrape-products)")}
            >
              Scrape products
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active", value: counts.ACTIVE ?? 0, icon: Activity, tone: "emerald" },
          { label: "Reporting", value: counts.REPORTING ?? 0, icon: Clock, tone: "blue" },
          { label: "Disputed", value: counts.DISPUTED ?? 0, icon: AlertTriangle, tone: "rose" },
          { label: "Resolved", value: counts.RESOLVED ?? 0, icon: CheckCheck, tone: "violet" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="px-4 py-3 gap-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{s.label}</span>
                <Icon className="size-3.5" />
              </div>
              <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending resolutions */}
        <Card className="px-4 py-4 gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Pending resolutions</h2>
            <ListChecks className="size-4 text-muted-foreground" />
          </div>
          {pending.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nothing due — queue empty.</p>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {pending.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <Link
                    href={`/admin/markets/${m.id}`}
                    className="flex-1 min-w-0 truncate hover:underline"
                  >
                    {m.productName} · {m.question}
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => adminResolveMarket(m.id)}>
                    Resolve
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent trades */}
        <Card className="px-4 py-4 gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Recent trades</h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              latest {Math.min(trades.length, 5)}
            </span>
          </div>
          <ul className="divide-y divide-border/60 text-sm">
            {trades.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.marketTitle}</div>
                  <div className="text-muted-foreground">
                    {t.side} · {t.outcomeLabel}
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div>{t.shares} sh</div>
                  <div className="text-muted-foreground">@{(t.pricePerShare * 100).toFixed(0)}¢</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Oracle lifecycle */}
      <Card className="px-4 py-4 gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Oracle lifecycle health</h2>
          <Button asChild size="sm" variant="ghost" className="text-xs gap-1">
            <Link href="/admin/queues">
              Open Queues <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Stat label="match-orders" value={Math.floor(Math.random() * 5)} />
          <Stat label="resolve-markets" value={Math.floor(Math.random() * 2)} />
          <Stat label="oracle-lifecycle" value={Math.floor(Math.random() * 3)} />
          <Stat label="market-maker" value={Math.floor(Math.random() * 8)} />
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Reporting window: <span className="font-mono">{oracleParams.reportingWindow}s</span>{" "}
          · Default dispute: <span className="font-mono">{oracleParams.defaultDispute}s</span>
        </div>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono tabular-nums">{value} jobs</div>
    </div>
  );
}

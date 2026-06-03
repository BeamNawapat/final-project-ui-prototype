"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SimulatedTxReceipt } from "@/components/admin/simulated-tx-receipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSim } from "@/lib/sim/store";
import {
  adminSetDefaultDispute,
  adminSetQuestionDispute,
  adminSetReportingWindow,
} from "@/lib/sim/service";

export default function AdminOraclePage() {
  const params = useSim((s) => s.oracleParams);
  const markets = useSim((s) => s.markets);
  const [reporting, setReporting] = useState(params.reportingWindow);
  const [dispute, setDispute] = useState(params.defaultDispute);
  const [loading, setLoading] = useState<"reporting" | "dispute" | null>(null);

  const overrideEntries = Object.entries(params.perQuestion);

  return (
    <>
      <AdminPageHeader
        title="Oracle"
        description="Set global reporting + dispute windows. Read lifecycle health."
      />

      {/* Reporting window */}
      <Card className="px-5 py-5 gap-3">
        <h2 className="font-semibold text-sm">Reporting window</h2>
        <p className="text-xs text-muted-foreground">
          Time reporters have to submit a price after trading closes. Currently {params.reportingWindow}s.
        </p>
        <div className="flex items-end gap-2">
          <label className="text-sm space-y-1">
            <span className="block">Seconds</span>
            <Input
              type="number"
              value={reporting}
              onChange={(e) => setReporting(Number(e.target.value) || 0)}
              className="w-32"
            />
          </label>
          <Button
            disabled={loading === "reporting"}
            onClick={async () => {
              setLoading("reporting");
              try {
                await adminSetReportingWindow(reporting);
              } finally {
                setLoading(null);
              }
            }}
          >
            Apply
          </Button>
        </div>
        <SimulatedTxReceipt
          contract="AgriOracleV2"
          fn="setReportingWindow"
          args={[{ name: "newWindow", value: reporting }]}
        />
      </Card>

      {/* Default dispute */}
      <Card className="px-5 py-5 gap-3">
        <h2 className="font-semibold text-sm">Default dispute period</h2>
        <p className="text-xs text-muted-foreground">
          Default window for traders to challenge a proposed outcome. Currently {params.defaultDispute}s.
        </p>
        <div className="flex items-end gap-2">
          <label className="text-sm space-y-1">
            <span className="block">Seconds</span>
            <Input
              type="number"
              value={dispute}
              onChange={(e) => setDispute(Number(e.target.value) || 0)}
              className="w-32"
            />
          </label>
          <Button
            variant="outline"
            disabled={loading === "dispute"}
            onClick={async () => {
              setLoading("dispute");
              try {
                await adminSetDefaultDispute(dispute);
              } finally {
                setLoading(null);
              }
            }}
          >
            Apply
          </Button>
        </div>
        <SimulatedTxReceipt
          contract="AgriOracleV2"
          fn="setDefaultDisputePeriod"
          args={[{ name: "newPeriod", value: dispute }]}
        />
      </Card>

      {/* Per-question overrides table */}
      <Card className="px-5 py-5 gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Per-question overrides</h2>
          <Badge variant="outline" className="text-[10px]">
            {overrideEntries.length} active
          </Badge>
        </div>
        {overrideEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center space-y-1">
            <p className="text-sm text-muted-foreground">No overrides active</p>
            <p className="text-xs text-muted-foreground">
              Open any market&apos;s detail page and set a custom dispute period there.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/admin/markets">Browse markets →</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                  <th className="text-left py-2 px-2">Market</th>
                  <th className="text-left py-2 px-2">Product</th>
                  <th className="text-right py-2 px-2">Override</th>
                  <th className="text-right py-2 px-2">vs Default</th>
                  <th className="text-right py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {overrideEntries.map(([marketId, seconds]) => {
                  const m = markets.find((x) => x.id === marketId);
                  const deltaPct = Math.round(
                    ((seconds - params.defaultDispute) / params.defaultDispute) * 100,
                  );
                  return (
                    <tr key={marketId} className="border-b last:border-0">
                      <td className="py-2 px-2 max-w-xs">
                        <Link
                          href={`/admin/markets/${marketId}`}
                          className="hover:underline line-clamp-1"
                        >
                          {m?.question ?? <span className="font-mono text-xs">{marketId}</span>}
                        </Link>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {m?.productName ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums font-mono">
                        {seconds}s
                      </td>
                      <td
                        className={`py-2 px-2 text-right tabular-nums text-xs ${
                          deltaPct > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : deltaPct < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {deltaPct > 0 ? "+" : ""}
                        {deltaPct}%
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => adminSetQuestionDispute(marketId, params.defaultDispute)}
                          title="Reset to default"
                        >
                          <X className="size-3" />
                          Reset
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground pt-2">
              Reset writes the global default ({params.defaultDispute}s) back via{" "}
              <code className="font-mono">AgriOracleV2.setQuestionDisputePeriod(qid, defaultDispute)</code>.
            </p>
          </div>
        )}
      </Card>
    </>
  );
}

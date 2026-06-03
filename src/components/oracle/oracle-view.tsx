"use client";

import { Antenna, ShieldCheck, Clock, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSim } from "@/lib/sim/store";
import { copyAddress } from "@/lib/sim/service";
import { cn } from "@/lib/utils";
import type { ReporterRecord } from "@/lib/types";

function fmtWindow(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m && s) return `${m}m ${s}s`;
  if (m) return `${m}m`;
  return `${s}s`;
}

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const STATUS_TONE: Record<ReporterRecord["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  slashed: "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400",
};

export function OracleView() {
  const reporters = useSim((s) => s.reporters);
  const oracleParams = useSim((s) => s.oracleParams);

  const activeCount = reporters.filter((r) => r.status === "active").length;
  const avgAccuracy =
    reporters.length > 0
      ? reporters.reduce((sum, r) => sum + r.accuracy, 0) / reporters.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gradient">Oracle</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Decentralized reporters sign settlement prices once a market closes. The
          median submission wins; inaccurate reporters are slashed.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active reporters" value={String(activeCount)} icon={<Antenna className="size-3.5" />} />
        <StatCard
          label="Avg accuracy"
          value={`${(avgAccuracy * 100).toFixed(1)}%`}
          icon={<ShieldCheck className="size-3.5" />}
        />
        <StatCard
          label="Reporting window"
          value={fmtWindow(oracleParams.reportingWindow)}
          icon={<Clock className="size-3.5" />}
        />
        <StatCard
          label="Dispute period"
          value={fmtWindow(oracleParams.defaultDispute)}
          icon={<Clock className="size-3.5" />}
        />
      </div>

      {/* Reporter table */}
      <Card className="px-4 py-4 gap-3">
        <h2 className="font-semibold text-sm">Reporter registry</h2>

        {/* Header row */}
        <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_72px_80px] gap-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          <span>Reporter</span>
          <span className="text-right">Stake</span>
          <span className="text-right">Reports</span>
          <span className="text-right">Accuracy</span>
          <span className="text-right">Slashes</span>
          <span className="text-right">Status</span>
        </div>

        <ul className="divide-y divide-border/60">
          {reporters.map((r) => (
            <li
              key={r.address}
              className="grid grid-cols-[1fr_80px_80px_80px_72px_80px] items-center gap-2 py-2.5 text-xs"
            >
              <button
                type="button"
                onClick={() => copyAddress(r.address)}
                className="font-mono text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 min-w-0"
                title={r.address}
              >
                <span className="truncate">{shorten(r.address)}</span>
                <Copy className="size-3 shrink-0 text-muted-foreground" />
              </button>
              <span className="text-right tabular-nums font-mono">{r.stake} ETH</span>
              <span className="text-right tabular-nums font-mono text-muted-foreground">
                {r.accurateReports}/{r.totalReports}
              </span>
              <span className="text-right tabular-nums font-mono">
                {(r.accuracy * 100).toFixed(1)}%
              </span>
              <span
                className={cn(
                  "text-right tabular-nums font-mono",
                  r.slashes > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
                )}
              >
                {r.slashes}
              </span>
              <div className="flex justify-end">
                <Badge variant="outline" className={cn("text-[10px] uppercase", STATUS_TONE[r.status])}>
                  {r.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="px-4 py-3 gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}

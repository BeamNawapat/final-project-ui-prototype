"use client";

import { Clock, Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountdownRow } from "../countdown-row";
import { useSim } from "@/lib/sim/store";
import { subscribeNotify } from "@/lib/sim/service";
import type { Market } from "@/lib/types";

interface PendingPanelProps {
  market: Market;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Turn a numeric bracket-boundary array into the outcome labels the
// market will settle into. e.g. [70, 80, 90] → ["<70", "70–80", "80–90", "≥90"].
function bracketLabels(brackets: number[], unit?: string): string[] {
  const u = unit ? ` ${unit}` : "";
  const fmt = (n: number) => n.toLocaleString();
  const out: string[] = [];
  out.push(`<${fmt(brackets[0])}${u}`);
  for (let i = 0; i < brackets.length - 1; i++) {
    out.push(`${fmt(brackets[i])}–${fmt(brackets[i + 1])}${u}`);
  }
  out.push(`≥${fmt(brackets[brackets.length - 1])}${u}`);
  return out;
}

export function PendingPanel({ market }: PendingPanelProps) {
  const wallet = useSim((s) => s.wallet);
  const subscribed = useSim((s) =>
    wallet.address
      ? s.notifications.some(
          (n) => n.wallet === wallet.address && n.marketId === market.id,
        )
      : false,
  );

  const expectedOpen = market.expectedOpenTime;

  return (
    <Card className="px-4 py-5 gap-4 sticky top-20 min-h-[345px]">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center size-9 rounded-full bg-muted">
          <Clock className="size-4 text-muted-foreground" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Activating soon</h2>
          <p className="text-[11px] text-muted-foreground">Pending oracle activation</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Oracle will open this market for trading shortly. Once active, you&apos;ll see live
        prices and order book here.
      </p>

      {expectedOpen && (
        <CountdownRow label="Opens in" target={expectedOpen} size="lg" tone="indigo" />
      )}

      <div className="space-y-2 text-xs">
        <Row label="Trading closes" value={fmtDate(market.tradingCutoffTime)} />
        <Row label="Resolves" value={fmtDate(market.resolutionTime)} />
        {market.type === "BINARY" && market.threshold !== undefined && (
          <Row
            label="Threshold"
            value={`${market.threshold.toLocaleString()} ${market.thresholdUnit ?? ""}`.trim()}
          />
        )}
        {market.type === "MULTI_BRACKET" && market.brackets && market.brackets.length > 0 && (
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground shrink-0">Brackets</span>
            <div className="flex flex-wrap justify-end gap-1 text-right">
              {bracketLabels(market.brackets, market.thresholdUnit).map((b) => (
                <span
                  key={b}
                  className="rounded-md border bg-background/40 px-1.5 py-0.5 text-foreground font-medium tabular-nums text-[11px]"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {market.marketContext && (
        <div className="rounded-lg border bg-background/40 px-3 py-2 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Why this market matters
          </div>
          <p className="text-xs leading-relaxed text-foreground/80 line-clamp-5">
            {market.marketContext}
          </p>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full gap-2 mt-auto"
        onClick={() => subscribeNotify(market.id)}
      >
        {subscribed ? <BellOff className="size-4" /> : <Bell className="size-4" />}
        {subscribed ? "Unsubscribe from open-alert" : "Notify me when open"}
      </Button>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium tabular-nums">{value}</span>
    </div>
  );
}

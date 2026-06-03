"use client";

import { useState } from "react";
import { Pause, Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PositionSummary } from "../position-summary";
import { useSim } from "@/lib/sim/store";
import { subscribeNotify } from "@/lib/sim/service";
import type { Market } from "@/lib/types";

interface PausedPanelProps {
  market: Market;
}

export function PausedPanel({ market }: PausedPanelProps) {
  const wallet = useSim((s) => s.wallet);
  const subscribed = useSim((s) =>
    wallet.address
      ? s.notifications.some(
          (n) => n.wallet === wallet.address && n.marketId === market.id,
        )
      : false,
  );
  const [busy, setBusy] = useState(false);

  return (
    <Card className="px-4 py-5 gap-4 sticky top-20 min-h-[345px]">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center size-9 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
          <Pause className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Paused by admin</h2>
          <p className="text-[11px] text-muted-foreground">Trading temporarily halted</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Trading is temporarily halted. Existing positions are unaffected and remain in escrow
        until trading resumes or the market is cancelled.
      </p>

      {market.reason && (
        <div className="flex-1 flex items-center">
          <div className="w-full rounded-lg border bg-background/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
              Admin note
            </div>
            <p className="text-xs leading-snug text-foreground/80">{market.reason}</p>
          </div>
        </div>
      )}

      <PositionSummary marketId={market.id} hideEmpty />

      <Button
        variant="outline"
        className="w-full gap-2"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          subscribeNotify(market.id);
          setTimeout(() => setBusy(false), 300);
        }}
      >
        {subscribed ? <BellOff className="size-4" /> : <Bell className="size-4" />}
        {subscribed ? "Unsubscribe from resume-alert" : "Notify me when trading resumes"}
      </Button>
    </Card>
  );
}

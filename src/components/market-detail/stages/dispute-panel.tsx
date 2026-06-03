"use client";

import { useState } from "react";
import { Gavel, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CountdownRow } from "../countdown-row";
import { PositionSummary } from "../position-summary";
import { ReporterListPanel } from "../reporter-list-panel";
import { useSim } from "@/lib/sim/store";
import { connectWallet, fileChallenge } from "@/lib/sim/service";
import type { Market } from "@/lib/types";

interface DisputePanelProps {
  market: Market;
}

export function DisputePanel({ market }: DisputePanelProps) {
  const wallet = useSim((s) => s.wallet);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stake, setStake] = useState(50);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const disputeEnd = market.disputeEndsAt;
  const bestBid = market.orderbook?.bids[0]?.price;

  async function handleSubmit() {
    if (!wallet.connected) {
      await connectWallet();
      return;
    }
    setSubmitting(true);
    try {
      await fileChallenge({ marketId: market.id, stakeUsdc: stake, reason });
      setDialogOpen(false);
      setReason("");
    } catch {
      // toast raised in service
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Card className="px-4 py-5 gap-4 sticky top-20 min-h-[345px]">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center size-9 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Gavel className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Dispute window open</h2>
            <p className="text-[11px] text-muted-foreground">Challenge or wait for auto-resolve</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          If the proposed outcome looks wrong, file a challenge. Otherwise this resolves
          automatically when the timer ends.
        </p>

        {disputeEnd && (
          <CountdownRow
            label="Auto-resolves in"
            target={disputeEnd}
            start={market.reportingEndsAt}
            size="lg"
            tone="indigo"
          />
        )}

        {market.proposedOutcome && (
          <div className="rounded-lg border-2 border-indigo-500/40 bg-indigo-500/10 px-3 py-3">
            <div className="text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-semibold mb-1">
              Proposed outcome
            </div>
            <div className="text-lg font-bold text-foreground">
              {market.proposedOutcome.label}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {market.proposedOutcome.settlementPriceLabel}
            </div>
          </div>
        )}

        <ReporterListPanel reporters={market.reporters ?? []} defaultCollapsed />

        <PositionSummary marketId={market.id} bestBidCents={bestBid} hideEmpty />

        <Button
          variant="outline"
          className="w-full gap-2 bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 mt-auto"
          onClick={() => setDialogOpen(true)}
        >
          <AlertTriangle className="size-4" />
          File challenge
        </Button>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File challenge</DialogTitle>
            <DialogDescription>
              Stake USDC to challenge the proposed outcome. If your challenge succeeds,
              you&apos;ll be refunded with a reward. If it fails, your stake is forfeited.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="block text-sm space-y-1">
              <span className="text-muted-foreground">Stake (USDC)</span>
              <Input
                type="number"
                min={1}
                step="1"
                value={stake}
                onChange={(e) => setStake(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              />
            </label>
            <label className="block text-sm space-y-1">
              <span className="text-muted-foreground">Reason</span>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Reporter prices disagree with MOC daily index"
              />
            </label>
            <div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
              {">_ WILL EXECUTE"}
              <div className="mt-1 text-foreground">
                AgriOracleV2.challenge(
                <div className="pl-3">
                  questionId: keccak256(&quot;{market.id}&quot;),
                  <br />
                  stake: {stake} * 10**6,
                  <br />
                  reasonHash: keccak256(reason),
                </div>
                )
              </div>
              <div className="mt-1 text-amber-600 dark:text-amber-400 text-[10px]">
                Sim only — no on-chain call, no backend route exists yet for challenges.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={submitting || stake <= 0}
              onClick={handleSubmit}
            >
              {submitting ? "Filing…" : `Stake $${stake.toFixed(2)} & file`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

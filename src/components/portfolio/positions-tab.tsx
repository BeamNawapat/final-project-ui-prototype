"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductTag } from "@/components/markets/product-tag";
import { StageBadge } from "@/components/markets/stage-badge";
import { deriveMarketStage } from "@/lib/market-stage";
import { positionMTM } from "@/lib/portfolio";
import { redeemPosition, refundCancelled } from "@/lib/sim/service";
import { cn } from "@/lib/utils";
import { PositionRow } from "./position-row";
import { PortfolioEmpty } from "./portfolio-empty";
import type { Position, Market } from "@/lib/types";

interface PositionsTabProps {
  positions: Position[];
  markets: Market[];
  mounted: boolean;
  highlightMarket?: string | null;
}

export function PositionsTab({
  positions,
  markets,
  mounted,
  highlightMarket,
}: PositionsTabProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  const marketMap = useMemo(
    () => new Map(markets.map((m) => [m.id, m])),
    [markets],
  );

  // Group positions by marketId, sorted with ACTIVE first then by marketId.
  const grouped = useMemo(() => {
    const now = new Date();
    const groups = new Map<
      string,
      { market: Market; positions: Position[] }
    >();
    for (const p of positions) {
      const market = marketMap.get(p.marketId);
      if (!market) continue;
      if (!groups.has(p.marketId)) {
        groups.set(p.marketId, { market, positions: [] });
      }
      groups.get(p.marketId)!.positions.push(p);
    }
    // Sort: ACTIVE/PAUSED first; RESOLVED/CANCELLED last.
    return [...groups.values()].sort((a, b) => {
      const sa = deriveMarketStage(a.market, now);
      const sb = deriveMarketStage(b.market, now);
      const rank = (s: string) =>
        ["ACTIVE", "CLOSED", "REPORTING", "DISPUTE", "DISPUTED", "PAUSED"].includes(s)
          ? 0
          : s === "RESOLVED"
            ? 1
            : s === "CANCELLED"
              ? 2
              : 3;
      return rank(sa) - rank(sb);
    });
  }, [positions, marketMap]);

  if (!mounted || grouped.length === 0) {
    return (
      <PortfolioEmpty
        title="No open positions"
        description="Buy YES or NO on any market to see your holdings here."
      />
    );
  }

  const now = new Date();

  async function handleRedeem(marketId: string) {
    setSubmitting(marketId);
    try {
      await redeemPosition(marketId);
    } catch {
      // toast raised in service
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRefund(marketId: string) {
    setSubmitting(marketId);
    try {
      await refundCancelled(marketId);
    } catch {
      // toast raised in service
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Column header */}
      <div className="hidden md:grid grid-cols-[64px_1fr_56px_56px_72px_64px] gap-2 px-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        <span>Side</span>
        <span>Outcome</span>
        <span className="text-right">Shares</span>
        <span className="text-right">Avg</span>
        <span className="text-right">Mark</span>
        <span className="text-right">PnL</span>
      </div>

      {grouped.map(({ market, positions: mPositions }) => {
        const stage = deriveMarketStage(market, now);
        const isHighlighted = highlightMarket === market.id;

        // Compute MTM for each position
        const rows = mPositions.map((p) => ({
          p,
          mtm: positionMTM(p, market, stage),
        }));

        // Redeemable amount (what redeemPosition will actually pay —
        // uses winning outcomeIdx only, matching the service logic).
        const winningIdx = market.resolvedOutcome?.outcomeIdx;
        const redeemable =
          stage === "RESOLVED" && typeof winningIdx === "number"
            ? rows
                .filter((r) => r.p.outcomeIdx === winningIdx)
                .reduce((s, r) => s + r.p.size, 0)
            : 0;

        // Refundable amount.
        const refundable =
          stage === "CANCELLED"
            ? rows.reduce((s, r) => s + r.p.size * r.p.avgPrice, 0)
            : 0;

        const isSubmitting = submitting === market.id;

        return (
          <Card
            key={market.id}
            id={`mkt-${market.id}`}
            className={cn(
              "px-4 py-4 gap-3 transition-shadow",
              isHighlighted && "ring-2 ring-primary shadow-md",
            )}
          >
            {/* Market header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <ProductTag name={market.productName} color={market.productColor} />
                <Link
                  href={`/markets/${market.id}`}
                  className="text-sm font-semibold leading-snug hover:underline inline-flex items-center gap-1 text-foreground/90"
                >
                  <span className="line-clamp-2">{market.question}</span>
                  <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                </Link>
              </div>
              <StageBadge stage={stage} className="shrink-0 mt-0.5" />
            </div>

            {/* Position rows */}
            <div className="divide-y divide-border/60">
              {rows.map(({ p, mtm }) => (
                <PositionRow
                  key={p.id}
                  outcomeLabel={p.outcomeLabel}
                  side={p.side}
                  mtm={mtm}
                />
              ))}
            </div>

            {/* Action footer */}
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {rows.length} position{rows.length !== 1 ? "s" : ""}
                {stage === "RESOLVED" && redeemable > 0 && (
                  <> · claimable ${redeemable.toFixed(2)}</>
                )}
                {stage === "CANCELLED" && refundable > 0 && (
                  <> · refundable ${refundable.toFixed(2)}</>
                )}
              </span>

              {/* ACTIVE / PAUSED / CLOSED / REPORTING / DISPUTE / DISPUTED */}
              {["ACTIVE", "PAUSED", "CLOSED", "REPORTING", "DISPUTE", "DISPUTED"].includes(
                stage,
              ) && (
                <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                  <Link href={`/markets/${market.id}`}>Trade →</Link>
                </Button>
              )}

              {/* RESOLVED with redeemable */}
              {stage === "RESOLVED" && redeemable > 0 && (
                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5"
                  disabled={isSubmitting}
                  onClick={() => handleRedeem(market.id)}
                >
                  <Coins className="size-3" />
                  {isSubmitting ? "Claiming…" : `Redeem $${redeemable.toFixed(2)}`}
                </Button>
              )}

              {/* RESOLVED fully settled — nothing to redeem */}
              {stage === "RESOLVED" && redeemable === 0 && (
                <span className="text-[11px] text-muted-foreground italic">
                  Settled · no payout
                </span>
              )}

              {/* CANCELLED */}
              {stage === "CANCELLED" && refundable > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={isSubmitting}
                  onClick={() => handleRefund(market.id)}
                >
                  {isSubmitting ? "Refunding…" : `Refund $${refundable.toFixed(2)}`}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { deriveMarketStage } from "@/lib/market-stage";
import { countdownLabel } from "@/lib/countdown";
import type { Market } from "@/lib/types";

import { ProductTag } from "./product-tag";
import { StageBadge } from "./stage-badge";
import { MarketCardFooter } from "./market-card-footer";
import { MarketCardBodyBinaryActive } from "./market-card-body-binary-active";
import { MarketCardBodyMultiBracketActive } from "./market-card-body-multibracket-active";
import { MarketCardBodyClosed } from "./market-card-body-closed";
import { MarketCardBodyReporting } from "./market-card-body-reporting";
import { MarketCardBodyDisputed } from "./market-card-body-disputed";
import { MarketCardBodyResolved } from "./market-card-body-resolved";
import { MarketCardBodyPending } from "./market-card-body-pending";
import { MarketCardBodyCancelled } from "./market-card-body-cancelled";
import { MarketCardBodyPaused } from "./market-card-body-paused";

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Time-derived stage (CLOSED/REPORTING/DISPUTE) drifts between SSR and
  // CSR because `new Date()` ticks. Hold off on stage-dependent rendering
  // until after mount to avoid hydration mismatch on cards that sit near
  // a stage boundary.
  const stage = mounted ? deriveMarketStage(market) : null;

  const goDetail = (params?: { outcomeIdx?: number; side?: "YES" | "NO" }) => {
    const q = new URLSearchParams();
    if (params?.outcomeIdx !== undefined) q.set("outcome", String(params.outcomeIdx));
    if (params?.side) q.set("side", params.side);
    const qs = q.toString();
    router.push(`/markets/${market.id}${qs ? `?${qs}` : ""}`);
  };

  const rightLabel = (() => {
    if (!mounted) return "—";
    switch (stage) {
      case "ACTIVE":
        return `ends in ${countdownLabel(market.tradingCutoffTime ?? market.resolutionTime)}`;
      case "CLOSED":
        return `Reporting in ${countdownLabel(market.resolutionTime)}`;
      case "REPORTING":
        return `Dispute in ${countdownLabel(market.reportingEndsAt)}`;
      case "DISPUTE":
        return `Resolves in ${countdownLabel(market.disputeEndsAt)}`;
      case "DISPUTED":
        return "Under review";
      case "RESOLVED":
        return "Settled";
      case "CANCELLED":
        return "Cancelled";
      case "PAUSED":
        return "Paused";
      case "PENDING":
        return "Awaiting open";
      default:
        return "";
    }
  })();

  const body = (() => {
    switch (stage) {
      case "PENDING":
        return <MarketCardBodyPending market={market} />;
      case "ACTIVE":
        return market.type === "MULTI_BRACKET" ? (
          <MarketCardBodyMultiBracketActive
            market={market}
            onTrade={(idx, side) => goDetail({ outcomeIdx: idx, side })}
          />
        ) : (
          <MarketCardBodyBinaryActive
            market={market}
            onTrade={(idx, side) => goDetail({ outcomeIdx: idx, side })}
          />
        );
      case "CLOSED":
        return <MarketCardBodyClosed market={market} />;
      case "REPORTING":
        return <MarketCardBodyReporting market={market} variant="REPORTING" />;
      case "DISPUTE":
        return <MarketCardBodyReporting market={market} variant="DISPUTE" />;
      case "DISPUTED":
        return <MarketCardBodyDisputed market={market} />;
      case "RESOLVED":
        return <MarketCardBodyResolved market={market} />;
      case "CANCELLED":
        return <MarketCardBodyCancelled market={market} />;
      case "PAUSED":
        return <MarketCardBodyPaused market={market} />;
      default:
        return null;
    }
  })();

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border bg-card text-card-foreground px-4 py-4",
        "glass card-interactive cursor-pointer min-h-[220px]",
      )}
    >
      {/* Full-card link overlay — sits beneath all interactive children so
          right-click shows "Open Link in New Tab"; clicks on Yes/No /
          bookmark / gift buttons still hit their own handlers because the
          buttons paint above the link in the same stacking context. */}
      <Link
        href={`/markets/${market.id}`}
        aria-label={market.question}
        className="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
      />
      <div className="flex items-start justify-between gap-2">
        <ProductTag name={market.productName} color={market.productColor} />
        {stage && <StageBadge stage={stage} />}
      </div>
      <div className="flex flex-col flex-1">{body}</div>
      <MarketCardFooter
        marketId={market.id}
        volume={market.volume}
        rightLabel={rightLabel}
      />
    </div>
  );
}

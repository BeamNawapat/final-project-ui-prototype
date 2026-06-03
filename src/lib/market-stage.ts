/**
 * Single source of truth for the visible market "stage" pill.
 *
 * The DB enum `MarketStatus` only persists sticky states (PENDING/ACTIVE/
 * PAUSED/RESOLVED/CANCELLED + new DISPUTED). The four intermediate stages
 * a trader cares about (CLOSED -> REPORTING -> DISPUTE -> RESOLVED) are
 * purely time-derived from the cutoffs already stored on the market row,
 * so we never write them — we compute them here and render the right
 * label + colour on every surface (market card, detail page, admin list,
 * admin detail).
 *
 * Reporting + dispute windows match the on-chain AgriOracleV2 defaults
 * surfaced on /oracle: reporting = 10m, dispute = 5m.
 */

export type MarketStage =
  | "ACTIVE"
  | "CLOSED"
  | "REPORTING"
  | "DISPUTE"
  | "RESOLVED"
  | "DISPUTED"
  | "CANCELLED"
  | "PAUSED"
  | "PENDING";

export interface MarketStageStyle {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  className: string;
}

const REPORTING_WINDOW_MS = 10 * 60 * 1000;
const DISPUTE_WINDOW_MS = 5 * 60 * 1000;

interface MarketLike {
  status: string;
  tradingCutoffTime?: string | Date | null;
  resolutionTime?: string | Date | null;
  expectedOpenTime?: string | Date | null;
}

export function deriveMarketStage(market: MarketLike, now: Date = new Date()): MarketStage {
  if (market.status === "RESOLVED") return "RESOLVED";
  if (market.status === "DISPUTED") return "DISPUTED";
  if (market.status === "CANCELLED") return "CANCELLED";
  if (market.status === "PAUSED") return "PAUSED";
  if (market.status === "PENDING") {
    const openAt = market.expectedOpenTime ? new Date(market.expectedOpenTime) : null;
    if (!openAt || now < openAt) return "PENDING";
    // Past expectedOpenTime → treat as if status flipped to ACTIVE. The
    // time-derived flow below classifies ACTIVE/CLOSED/REPORTING/DISPUTE.
  }

  const cutoff = market.tradingCutoffTime ? new Date(market.tradingCutoffTime) : null;
  const resolution = market.resolutionTime ? new Date(market.resolutionTime) : null;

  if (!cutoff || now < cutoff) return "ACTIVE";
  if (!resolution || now < resolution) return "CLOSED";

  const reportingEnd = new Date(resolution.getTime() + REPORTING_WINDOW_MS);
  if (now < reportingEnd) return "REPORTING";

  const disputeEnd = new Date(reportingEnd.getTime() + DISPUTE_WINDOW_MS);
  if (now < disputeEnd) return "DISPUTE";

  // Past dispute window but DB still says ACTIVE → finalize tx not landed yet.
  // Keep showing DISPUTE so trader knows the on-chain step is the holdup, not
  // their wallet. oracle-lifecycle.ts will flip status to RESOLVED shortly.
  return "DISPUTE";
}

export function getStageStyle(stage: MarketStage): MarketStageStyle {
  switch (stage) {
    case "ACTIVE":
      return {
        label: "ACTIVE",
        variant: "default",
        className: "bg-green-500/10 text-green-600 border-green-500/30",
      };
    case "CLOSED":
      return {
        label: "CLOSED",
        variant: "default",
        className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      };
    case "REPORTING":
      return {
        label: "REPORTING",
        variant: "default",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      };
    case "DISPUTE":
      return {
        label: "DISPUTE WINDOW",
        variant: "default",
        className: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      };
    case "DISPUTED":
      return {
        label: "DISPUTED",
        variant: "destructive",
        className: "bg-red-500/10 text-red-600 border-red-500/30",
      };
    case "RESOLVED":
      return {
        label: "RESOLVED",
        variant: "secondary",
        className: "bg-gray-500/10 text-gray-600 border-gray-500/30",
      };
    case "CANCELLED":
      return {
        label: "CANCELLED",
        variant: "destructive",
        className: "bg-red-500/10 text-red-600 border-red-500/30",
      };
    case "PAUSED":
      return {
        label: "PAUSED",
        variant: "outline",
        className: "bg-orange-500/10 text-orange-600 border-orange-500/30",
      };
    case "PENDING":
      return {
        label: "PENDING",
        variant: "outline",
        className: "bg-gray-300/10 text-gray-500 border-gray-300/30",
      };
  }
}

export function deriveStageStyle(market: MarketLike, now?: Date): MarketStageStyle {
  return getStageStyle(deriveMarketStage(market, now));
}

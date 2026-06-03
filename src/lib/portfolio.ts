/**
 * Pure portfolio utilities — mark-to-market math.
 * No React, no side-effects. Unit-testable.
 */

import type { Position, Market } from "@/lib/types";
import type { MarketStage } from "@/lib/market-stage";

export interface PositionMTM {
  shares: number;
  cost: number; // shares × avgPrice
  mark: number; // 0..1 settlement price
  value: number; // shares × mark
  pnl: number; // value − cost
  status: "open" | "won" | "lost" | "refund";
}

/**
 * Compute mark-to-market for a single Position.
 *
 * Rules:
 * • RESOLVED binary — winning outcomeIdx pays $1/share.
 * • RESOLVED multi-bracket (Phase 4.g) — winning bracket YES=$1;
 *   every other bracket's NO token=$1 (complement wins).
 * • CANCELLED — refund at avg cost; PnL = 0.
 * • All other stages — MTM via current outcome probability.
 */
export function positionMTM(
  p: Position,
  market: Market,
  stage: MarketStage,
): PositionMTM {
  const shares = p.size;
  const cost = p.size * p.avgPrice;

  let mark: number;
  let status: PositionMTM["status"];

  if (stage === "RESOLVED" && market.resolvedOutcome) {
    const winningIdx = market.resolvedOutcome.outcomeIdx;
    if (market.type === "BINARY") {
      mark = p.outcomeIdx === winningIdx ? 1.0 : 0.0;
    } else {
      // Multi-bracket: winning bracket YES=$1; losing brackets' NO=$1.
      if (p.outcomeIdx === winningIdx) {
        mark = p.side === "YES" ? 1.0 : 0.0;
      } else {
        mark = p.side === "NO" ? 1.0 : 0.0;
      }
    }
    status = mark === 1.0 ? "won" : "lost";
  } else if (stage === "CANCELLED") {
    // Refund = cost basis; PnL = 0.
    mark = p.avgPrice;
    status = "refund";
  } else {
    // Open / frozen market — MTM via current probability.
    const prob = market.outcomes[p.outcomeIdx]?.probability ?? 0.5;
    mark = p.side === "YES" ? prob : 1 - prob;
    status = "open";
  }

  const value = shares * mark;
  const pnl = value - cost;
  return { shares, cost, mark, value, pnl, status };
}

export interface PortfolioAgg {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  openPositionCount: number; // unique markets held
}

export function aggregatePortfolio(
  positions: Position[],
  markets: Market[],
  getStage: (m: Market) => MarketStage,
): PortfolioAgg {
  const marketMap = new Map(markets.map((m) => [m.id, m]));
  let totalValue = 0;
  let totalCost = 0;
  const marketIds = new Set<string>();

  for (const p of positions) {
    const market = marketMap.get(p.marketId);
    if (!market) continue;
    const stage = getStage(market);
    const mtm = positionMTM(p, market, stage);
    totalValue += mtm.value;
    totalCost += mtm.cost;
    marketIds.add(p.marketId);
  }

  return {
    totalValue,
    totalCost,
    totalPnl: totalValue - totalCost,
    openPositionCount: marketIds.size,
  };
}

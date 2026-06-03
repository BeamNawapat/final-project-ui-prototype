/**
 * Seed positions and open limit orders for the Portfolio demo.
 * These are loaded into the sim store initial state so the Portfolio page
 * is populated without requiring the reviewer to trade first.
 *
 * Market IDs used:
 *   rice-hommali-march-2026  — ACTIVE BINARY (Trade action)
 *   palm-oil-march-2026      — ACTIVE MULTI_BRACKET (Trade action)
 *   corn-feed-feb-2026       — RESOLVED BINARY, NO wins (outcomeIdx 1)
 *                              → YES position loses, NO position wins → Redeem
 *   longan-multi-resolved    — RESOLVED MULTI_BRACKET, 55–65 wins (outcomeIdx 1)
 *                              → winning-bracket YES won; losing-bracket NO won (Phase 4.g)
 *   cane-cancelled           — CANCELLED BINARY → Refund
 */

import type { Position, OrderRecord } from "@/lib/types";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const MOCK_POSITIONS: Position[] = [
  // ── ACTIVE BINARY: Rice YES position (open) ──────────────────────────
  {
    id: "mp-rice-yes",
    marketId: "rice-hommali-march-2026",
    outcomeIdx: 0,
    outcomeLabel: "YES",
    side: "YES",
    size: 12,
    avgPrice: 0.55,
    createdAt: ago(3 * DAY),
  },

  // ── ACTIVE MULTI-BRACKET: Palm oil 32–36 THB YES ─────────────────────
  {
    id: "mp-palm-yes",
    marketId: "palm-oil-march-2026",
    outcomeIdx: 1, // 32–36 THB
    outcomeLabel: "32–36 THB",
    side: "YES",
    size: 20,
    avgPrice: 0.47,
    createdAt: ago(2 * DAY),
  },

  // ── RESOLVED BINARY: Corn — NO wins (outcomeIdx 1) ───────────────────
  // YES position loses
  {
    id: "mp-corn-yes",
    marketId: "corn-feed-feb-2026",
    outcomeIdx: 0,
    outcomeLabel: "YES",
    side: "YES",
    size: 30,
    avgPrice: 0.62,
    createdAt: ago(10 * DAY),
  },
  // NO position wins
  {
    id: "mp-corn-no",
    marketId: "corn-feed-feb-2026",
    outcomeIdx: 1,
    outcomeLabel: "NO",
    side: "NO",
    size: 25,
    avgPrice: 0.38,
    createdAt: ago(10 * DAY),
  },

  // ── RESOLVED MULTI-BRACKET: Longan — 55–65 wins (outcomeIdx 1) ───────
  // Winning bracket YES
  {
    id: "mp-longan-yes-win",
    marketId: "longan-multi-resolved",
    outcomeIdx: 1, // 55–65 THB
    outcomeLabel: "55–65",
    side: "YES",
    size: 15,
    avgPrice: 0.35,
    createdAt: ago(12 * DAY),
  },
  // Losing bracket NO — Phase 4.g: also wins $1
  {
    id: "mp-longan-no-lose",
    marketId: "longan-multi-resolved",
    outcomeIdx: 0, // < 55 THB (lost)
    outcomeLabel: "< 55",
    side: "NO",
    size: 10,
    avgPrice: 0.5,
    createdAt: ago(12 * DAY),
  },

  // ── CANCELLED BINARY: Sugarcane → Refund ─────────────────────────────
  {
    id: "mp-cane-yes",
    marketId: "cane-cancelled",
    outcomeIdx: 0,
    outcomeLabel: "YES",
    side: "YES",
    size: 20,
    avgPrice: 0.55,
    createdAt: ago(20 * DAY),
  },
];

export const MOCK_OPEN_ORDERS: OrderRecord[] = [
  // LIMIT YES on Rice at 58¢
  {
    id: "mo-rice-limit",
    marketId: "rice-hommali-march-2026",
    outcomeIdx: 0,
    side: "YES",
    direction: "BUY",
    orderType: "LIMIT",
    size: 10,
    price: 0.58,
    limitPrice: 0.58,
    status: "OPEN",
    createdAt: ago(45 * MIN),
  },
  // LIMIT NO on Palm oil bracket 36–40 THB (idx 2) at 55¢
  {
    id: "mo-palm-limit",
    marketId: "palm-oil-march-2026",
    outcomeIdx: 2, // 36–40 THB
    side: "NO",
    direction: "BUY",
    orderType: "LIMIT",
    size: 15,
    price: 0.55,
    limitPrice: 0.55,
    status: "OPEN",
    createdAt: ago(2 * HOUR),
  },
];

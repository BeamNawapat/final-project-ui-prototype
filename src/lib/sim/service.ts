"use client";

import { toast } from "sonner";
import { useSim } from "@/lib/sim/store";
import type { Market, MarketStatus } from "@/lib/types";

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function randomHash(): string {
  const chars = "0123456789abcdef";
  let h = "0x";
  for (let i = 0; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export async function connectWallet(): Promise<void> {
  toast.loading("Connecting wallet…", { id: "wallet" });
  await delay(null, 600);
  const address = "0xBEAM" + Math.random().toString(16).slice(2, 6).padEnd(4, "0") + "0001";
  useSim.getState().setWallet({ connected: true, address, balance: 1000 });
  toast.success(`Connected ${truncate(address)} — 1,000 USDC`, { id: "wallet" });
}

export function disconnectWallet(): void {
  useSim.getState().setWallet({ connected: false, address: null, balance: 0 });
  toast("Wallet disconnected");
}

export interface PlaceOrderInput {
  marketId: string;
  outcomeIdx: number;
  side: "YES" | "NO";
  direction?: "BUY" | "SELL"; // default BUY
  orderType?: "MARKET" | "LIMIT"; // default MARKET
  size: number; // USDC for BUY, shares for SELL
  price: number; // 0..1 (cents/100) — for MARKET = best book price; for LIMIT = user's limit
  limitPrice?: number; // 0..1 — only for LIMIT
}

export async function placeOrder(input: PlaceOrderInput): Promise<{ txHash: string }> {
  const direction = input.direction ?? "BUY";
  const orderType = input.orderType ?? "MARKET";
  const { wallet, markets, addOrder, addPosition, setBalance, setMarkets } = useSim.getState();
  const market = markets.find((m) => m.id === input.marketId);
  if (!market) throw new Error("market not found");

  if (!wallet.connected) {
    toast.error("Connect wallet first");
    throw new Error("not connected");
  }
  if (direction === "BUY" && input.size > wallet.balance) {
    toast.error(`Insufficient balance ($${wallet.balance.toFixed(2)} USDC)`);
    throw new Error("insufficient balance");
  }

  toast.loading(
    `Placing ${orderType.toLowerCase()} ${direction.toLowerCase()} ${input.side} order…`,
    { id: "order" },
  );
  await delay(null, 900 + Math.random() * 600);

  const txHash = randomHash();
  const isLimit = orderType === "LIMIT";
  const outcomeLabel = market.outcomes[input.outcomeIdx]?.label ?? `Outcome ${input.outcomeIdx + 1}`;

  // LIMIT orders rest on the book; MARKET orders fill immediately.
  addOrder({
    id: `o-${Date.now()}`,
    marketId: input.marketId,
    outcomeIdx: input.outcomeIdx,
    side: input.side,
    direction,
    orderType,
    size: input.size,
    price: input.price,
    limitPrice: input.limitPrice,
    status: isLimit ? "OPEN" : "FILLED",
    txHash,
    createdAt: new Date().toISOString(),
  });

  if (!isLimit) {
    if (direction === "BUY") {
      addPosition({
        id: `p-${Date.now()}`,
        marketId: input.marketId,
        outcomeIdx: input.outcomeIdx,
        outcomeLabel,
        side: input.side,
        size: input.size,
        avgPrice: input.price,
        createdAt: new Date().toISOString(),
      });
      setBalance(-input.size);
    } else {
      // SELL: shares × price → USDC credit, decrement position
      const proceeds = input.size * input.price;
      setBalance(proceeds);
      // Reduce or remove matching position
      const { positions } = useSim.getState();
      const matching = positions.find(
        (p) => p.marketId === input.marketId && p.outcomeIdx === input.outcomeIdx && p.side === input.side,
      );
      if (matching) {
        const remaining = matching.size - input.size;
        useSim.setState({
          positions: positions
            .map((p) => (p.id === matching.id ? { ...p, size: remaining } : p))
            .filter((p) => p.size > 0.0001),
        });
      }
    }

    // Nudge probabilities so gauges visibly react. BUY YES pushes YES%
    // up, SELL YES pushes it down. Multi-bracket: no re-normalisation
    // (handled at detail-page phase 4).
    setMarkets((prev) =>
      prev.map((m) => {
        if (m.id !== input.marketId) return m;
        const nudge = (input.size / 1000) * 0.05;
        const sign = direction === "BUY" ? 1 : -1;
        const outcomes = m.outcomes.map((o, i) => {
          if (i !== input.outcomeIdx) return o;
          const pushDir = input.side === "YES" ? 1 : -1;
          const p = Math.max(0.01, Math.min(0.99, o.probability + sign * pushDir * nudge));
          return { ...o, probability: p };
        });
        if (m.type === "BINARY" && outcomes.length === 2) {
          const yes = outcomes[0].probability;
          outcomes[1] = { ...outcomes[1], probability: 1 - yes };
        }
        // Append to priceHistory so the chart visibly reacts.
        const priceHistory = m.priceHistory
          ? [...m.priceHistory.slice(-119), { t: Date.now(), yesProb: outcomes[0].probability }]
          : m.priceHistory;
        return {
          ...m,
          outcomes,
          volume: m.volume + (direction === "BUY" ? input.size : input.size * input.price),
          priceHistory,
        };
      }),
    );
  }

  const verb = isLimit ? "Limit" : direction === "BUY" ? "Bought" : "Sold";
  const unit = direction === "BUY" ? `$${input.size.toFixed(2)}` : `${input.size.toFixed(2)} shares`;
  toast.success(`${verb} ${input.side} ${outcomeLabel} — ${unit} · tx ${txHash.slice(0, 10)}…`, {
    id: "order",
    duration: 4000,
  });
  return { txHash };
}

/**
 * SPLIT (mint pair) — deposit $X collateral, receive X YES + X NO of a
 * chosen outcome. Binary defaults `outcomeIdx=0` and mints outcome-0 YES
 * + outcome-1 NO. Multi-bracket mints YES + NO of the SELECTED bracket
 * via a CTF partial-partition split.
 *
 * On-chain analogue:
 *   ConditionalTokens.splitPosition(
 *     collateral, parentCollectionId, conditionId,
 *     partition = [bracketBit, fullMask & ~bracketBit],
 *     amount,
 *   )
 *
 * Net at-stake = `amount` USDC; one of YES / NO of the selected bracket
 * settles to $1, the other to $0 → break-even regardless of which other
 * bracket wins.
 */
export async function splitPosition(input: {
  marketId: string;
  amount: number;
  outcomeIdx?: number;
}): Promise<{ txHash: string }> {
  const { wallet, markets, addOrder, addPosition, setBalance, setMarkets } = useSim.getState();
  const market = markets.find((m) => m.id === input.marketId);
  if (!market) throw new Error("market not found");
  if (!wallet.connected) {
    toast.error("Connect wallet first");
    throw new Error("not connected");
  }
  if (input.amount <= 0) throw new Error("amount must be > 0");
  if (input.amount > wallet.balance) {
    toast.error(`Insufficient balance ($${wallet.balance.toFixed(2)} USDC)`);
    throw new Error("insufficient balance");
  }

  const isBinary = market.type === "BINARY";
  const outcomeIdx = isBinary ? 0 : (input.outcomeIdx ?? 0);
  const bracketLabel = market.outcomes[outcomeIdx]?.label ?? `Outcome ${outcomeIdx}`;

  toast.loading(`Minting pair…`, { id: "split" });
  await delay(null, 900 + Math.random() * 400);
  const txHash = randomHash();
  const now = new Date().toISOString();
  const perTokenPrice = 0.5;

  if (isBinary) {
    // Binary: outcome 0 = YES, outcome 1 = NO.
    addOrder({
      id: `o-${Date.now()}-y`,
      marketId: input.marketId,
      outcomeIdx: 0,
      side: "YES",
      direction: "BUY",
      orderType: "SPLIT",
      size: input.amount,
      price: perTokenPrice,
      status: "FILLED",
      txHash,
      createdAt: now,
    });
    addOrder({
      id: `o-${Date.now()}-n`,
      marketId: input.marketId,
      outcomeIdx: 1,
      side: "NO",
      direction: "BUY",
      orderType: "SPLIT",
      size: input.amount,
      price: perTokenPrice,
      status: "FILLED",
      txHash,
      createdAt: now,
    });
    addPosition({
      id: `p-${Date.now()}-y`,
      marketId: input.marketId,
      outcomeIdx: 0,
      outcomeLabel: market.outcomes[0]?.label ?? "YES",
      side: "YES",
      size: input.amount,
      avgPrice: perTokenPrice,
      createdAt: now,
    });
    addPosition({
      id: `p-${Date.now()}-n`,
      marketId: input.marketId,
      outcomeIdx: 1,
      outcomeLabel: market.outcomes[1]?.label ?? "NO",
      side: "NO",
      size: input.amount,
      avgPrice: perTokenPrice,
      createdAt: now,
    });
  } else {
    // Multi-bracket: YES + NO of the SELECTED bracket only (per-bracket
    // partial-partition split).
    addOrder({
      id: `o-${Date.now()}-y`,
      marketId: input.marketId,
      outcomeIdx,
      side: "YES",
      direction: "BUY",
      orderType: "SPLIT",
      size: input.amount,
      price: perTokenPrice,
      status: "FILLED",
      txHash,
      createdAt: now,
    });
    addOrder({
      id: `o-${Date.now()}-n`,
      marketId: input.marketId,
      outcomeIdx,
      side: "NO",
      direction: "BUY",
      orderType: "SPLIT",
      size: input.amount,
      price: perTokenPrice,
      status: "FILLED",
      txHash,
      createdAt: now,
    });
    addPosition({
      id: `p-${Date.now()}-y`,
      marketId: input.marketId,
      outcomeIdx,
      outcomeLabel: bracketLabel,
      side: "YES",
      size: input.amount,
      avgPrice: perTokenPrice,
      createdAt: now,
    });
    addPosition({
      id: `p-${Date.now()}-n`,
      marketId: input.marketId,
      outcomeIdx,
      outcomeLabel: bracketLabel,
      side: "NO",
      size: input.amount,
      avgPrice: perTokenPrice,
      createdAt: now,
    });
  }

  setBalance(-input.amount);

  // Volume bump but no probability change.
  setMarkets((prev) =>
    prev.map((m) => (m.id === input.marketId ? { ...m, volume: m.volume + input.amount } : m)),
  );

  const units = Math.floor(input.amount);
  const msg = isBinary
    ? `Minted ${units} YES + ${units} NO · tx ${txHash.slice(0, 10)}…`
    : `Minted ${units} YES + ${units} NO on ${bracketLabel} · tx ${txHash.slice(0, 10)}…`;
  toast.success(msg, { id: "split", duration: 4000 });
  return { txHash };
}

/**
 * MERGE — inverse of split. Burn equal YES + NO of a chosen outcome and
 * redeem USDC. Binary burns outcome-0 YES + outcome-1 NO. Multi-bracket
 * burns YES + NO of the SELECTED bracket.
 *
 * On-chain analogue: ConditionalTokens.mergePositions(collateral,
 * parentCollectionId, conditionId, partition=[bracketBit, ~bracketBit],
 * amount).
 */
export async function mergePosition(input: {
  marketId: string;
  amount: number;
  outcomeIdx?: number;
}): Promise<{ txHash: string }> {
  const { wallet, markets, positions, addOrder, setBalance, setMarkets } = useSim.getState();
  const market = markets.find((m) => m.id === input.marketId);
  if (!market) throw new Error("market not found");
  if (!wallet.connected) {
    toast.error("Connect wallet first");
    throw new Error("not connected");
  }
  if (input.amount <= 0) throw new Error("amount must be > 0");

  const isBinary = market.type === "BINARY";
  const outcomeIdx = isBinary ? 0 : (input.outcomeIdx ?? 0);
  const bracketLabel = market.outcomes[outcomeIdx]?.label ?? `Outcome ${outcomeIdx}`;

  // Pair holdings on the selected bracket (binary scopes to outcome 0/1
  // YES/NO; multi scopes to the picked bracket's YES + NO).
  let yesHeld = 0;
  let noHeld = 0;
  for (const p of positions) {
    if (p.marketId !== input.marketId) continue;
    if (isBinary) {
      if (p.side === "YES") yesHeld += p.size;
      else if (p.side === "NO") noHeld += p.size;
    } else if (p.outcomeIdx === outcomeIdx) {
      if (p.side === "YES") yesHeld += p.size;
      else if (p.side === "NO") noHeld += p.size;
    }
  }
  const maxBurn = Math.min(yesHeld, noHeld);
  if (input.amount > maxBurn) {
    const msg = isBinary
      ? `Need ${input.amount} YES AND ${input.amount} NO — held ${maxBurn} pairs`
      : `Need ${input.amount} YES AND ${input.amount} NO on ${bracketLabel} — held ${maxBurn} pairs`;
    toast.error(msg);
    throw new Error("insufficient pair holdings");
  }

  toast.loading(`Merging pair…`, { id: "merge" });
  await delay(null, 900 + Math.random() * 400);
  const txHash = randomHash();
  const now = new Date().toISOString();
  const perTokenPrice = 0.5;

  if (isBinary) {
    addOrder({
      id: `o-${Date.now()}-my`,
      marketId: input.marketId,
      outcomeIdx: 0,
      side: "YES",
      direction: "SELL",
      orderType: "SPLIT",
      size: input.amount,
      price: perTokenPrice,
      status: "FILLED",
      txHash,
      createdAt: now,
    });
    addOrder({
      id: `o-${Date.now()}-mn`,
      marketId: input.marketId,
      outcomeIdx: 1,
      side: "NO",
      direction: "SELL",
      orderType: "SPLIT",
      size: input.amount,
      price: perTokenPrice,
      status: "FILLED",
      txHash,
      createdAt: now,
    });
  } else {
    addOrder({
      id: `o-${Date.now()}-my`,
      marketId: input.marketId,
      outcomeIdx,
      side: "YES",
      direction: "SELL",
      orderType: "SPLIT",
      size: input.amount,
      price: perTokenPrice,
      status: "FILLED",
      txHash,
      createdAt: now,
    });
    addOrder({
      id: `o-${Date.now()}-mn`,
      marketId: input.marketId,
      outcomeIdx,
      side: "NO",
      direction: "SELL",
      orderType: "SPLIT",
      size: input.amount,
      price: perTokenPrice,
      status: "FILLED",
      txHash,
      createdAt: now,
    });
  }

  // Decrement YES + NO of the selected bracket (binary: outcome 0/1).
  let remainingY = input.amount;
  let remainingN = input.amount;
  const next = positions.map((p) => {
    if (p.marketId !== input.marketId) return p;
    const scopeOk = isBinary || p.outcomeIdx === outcomeIdx;
    if (!scopeOk) return p;
    if (p.side === "YES" && remainingY > 0) {
      const take = Math.min(p.size, remainingY);
      remainingY -= take;
      return { ...p, size: p.size - take };
    }
    if (p.side === "NO" && remainingN > 0) {
      const take = Math.min(p.size, remainingN);
      remainingN -= take;
      return { ...p, size: p.size - take };
    }
    return p;
  });
  useSim.setState({ positions: next.filter((p) => p.size > 0.0001) });

  setBalance(input.amount);

  setMarkets((prev) =>
    prev.map((m) => (m.id === input.marketId ? { ...m, volume: m.volume + input.amount } : m)),
  );

  const units = Math.floor(input.amount);
  const msg = isBinary
    ? `Burned ${units} pair → $${input.amount.toFixed(2)} · tx ${txHash.slice(0, 10)}…`
    : `Burned ${units} pair on ${bracketLabel} → $${input.amount.toFixed(2)} · tx ${txHash.slice(0, 10)}…`;
  toast.success(msg, { id: "merge", duration: 4000 });
  return { txHash };
}

/**
 * Cancel a resting LIMIT order. Flips status → CANCELLED.
 * No balance change (LIMIT orders don't debit in this sim until fill).
 */
export async function cancelOrder(orderId: string): Promise<void> {
  const { orders, updateOrder } = useSim.getState();
  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    toast.error("Order not found");
    return;
  }
  if (order.status !== "OPEN") {
    toast.error("Order is not open");
    return;
  }
  toast.loading("Cancelling order…", { id: "cancel" });
  await delay(null, 500);
  updateOrder(orderId, { status: "CANCELLED" });
  toast.success(
    `Order cancelled · ${order.side} ${order.orderType.toLowerCase()} @ ${Math.round(order.price * 100)}¢`,
    { id: "cancel" },
  );
}

export function toggleBookmark(marketId: string): void {
  const { bookmarks, toggleBookmark: t, markets } = useSim.getState();
  const will = !bookmarks.includes(marketId);
  t(marketId);
  const m = markets.find((x) => x.id === marketId);
  toast(will ? `Bookmarked ${m?.productName ?? "market"}` : "Removed bookmark");
}

export function claimAirdrop(marketId: string): void {
  const { wallet, setBalance, markets } = useSim.getState();
  if (!wallet.connected) {
    toast.error("Connect wallet to claim airdrop");
    return;
  }
  const m = markets.find((x) => x.id === marketId);
  setBalance(10);
  toast.success(`+10 USDC airdrop — ${m?.productName ?? "market"}`);
}

export async function copyAddress(addr: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(addr);
    toast.success(`Copied ${truncate(addr)}`);
  } catch {
    toast.error("Clipboard blocked");
  }
}

const STAGE_CYCLE: MarketStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "DISPUTED", "RESOLVED"];

/**
 * Cycle a market through reviewable lifecycle states. ACTIVE appears
 * three times because we also mutate the time fields to surface the
 * derived CLOSED / REPORTING / DISPUTE stages.
 */
export function simulateStageAdvance(marketId: string): void {
  const { markets, setMarkets } = useSim.getState();
  const m = markets.find((x) => x.id === marketId);
  if (!m) return;

  setMarkets((prev) =>
    prev.map((mm) => {
      if (mm.id !== marketId) return mm;
      const idx = STAGE_CYCLE.indexOf(mm.status);
      const nextIdx = (idx + 1) % STAGE_CYCLE.length;
      const next: Market = { ...mm, status: STAGE_CYCLE[nextIdx] };

      // Time-derived stage cycle for ACTIVE slot: ACTIVE → CLOSED → REPORTING.
      // We move timestamps relative to "now" so deriveMarketStage produces
      // the right pill.
      const now = Date.now();
      const MIN = 60_000;
      const HOUR = 60 * MIN;
      const DAY = 24 * HOUR;

      if (nextIdx === 0) {
        next.tradingCutoffTime = new Date(now + 2 * DAY).toISOString();
        next.resolutionTime = new Date(now + 2 * DAY).toISOString();
        next.reportingEndsAt = undefined;
        next.disputeEndsAt = undefined;
        next.reporters = undefined;
        next.proposedOutcome = undefined;
        next.resolvedOutcome = undefined;
      } else if (nextIdx === 1) {
        // CLOSED — trading ended, awaiting reporters
        next.tradingCutoffTime = new Date(now - 15 * MIN).toISOString();
        next.resolutionTime = new Date(now + 45 * MIN).toISOString();
      } else if (nextIdx === 2) {
        // REPORTING — reporters submitting
        next.tradingCutoffTime = new Date(now - 30 * MIN).toISOString();
        next.resolutionTime = new Date(now - 1 * MIN).toISOString();
        next.reportingEndsAt = new Date(now + 8 * MIN).toISOString();
        next.disputeEndsAt = new Date(now + 13 * MIN).toISOString();
        next.reporters = [
          { address: "0xa53d...9431", valueLabel: "value → outcome 1" },
          { address: "0x7c12...b88e", valueLabel: "value → outcome 1" },
        ];
      } else if (STAGE_CYCLE[nextIdx] === "RESOLVED") {
        next.resolvedOutcome = {
          label: mm.outcomes[0]?.label ?? "YES",
          settlementPriceLabel: "settled",
          outcomeIdx: 0,
        };
      }

      return next;
    }),
  );
  toast(`Advanced ${m.productName} → ${STAGE_CYCLE[(STAGE_CYCLE.indexOf(m.status) + 1) % STAGE_CYCLE.length]}`);
}

// ─── Stage-specific actions (Phase 3.c) ─────────────────────────────

/**
 * RESOLVED winner claim. EscrowVault.claimWinnings(questionId) on-chain.
 * Sim: drain user's winning-side positions on this market, credit balance
 * 1.0 USDC per share. Losing side positions just disappear (worth 0).
 */
export async function redeemPosition(marketId: string): Promise<{ txHash: string }> {
  const { wallet, markets, positions, setBalance } = useSim.getState();
  if (!wallet.connected) {
    toast.error("Connect wallet first");
    throw new Error("not connected");
  }
  const market = markets.find((m) => m.id === marketId);
  if (!market) throw new Error("market not found");
  if (market.status !== "RESOLVED" || !market.resolvedOutcome) {
    toast.error("Market not resolved");
    throw new Error("not resolved");
  }
  const winningIdx = market.resolvedOutcome.outcomeIdx;
  const mine = positions.filter((p) => p.marketId === marketId);
  if (mine.length === 0) {
    toast("No positions to redeem on this market");
    throw new Error("no positions");
  }
  toast.loading("Claiming winnings…", { id: "redeem" });
  await delay(null, 900);
  const txHash = randomHash();

  let payout = 0;
  for (const p of mine) {
    if (p.outcomeIdx === winningIdx) payout += p.size; // $1/share
  }
  setBalance(payout);
  useSim.setState({ positions: positions.filter((p) => p.marketId !== marketId) });
  toast.success(
    payout > 0
      ? `Redeemed $${payout.toFixed(2)} · tx ${txHash.slice(0, 10)}…`
      : `No winning shares on this market`,
    { id: "redeem", duration: 4000 },
  );
  return { txHash };
}

/**
 * CANCELLED market refund. Returns avg-cost per position (not $1).
 * On-chain analogue: EscrowVault.refundCancelled(questionId) — does NOT
 * exist in current contract; flagged as gap in plan.
 */
export async function refundCancelled(marketId: string): Promise<{ txHash: string }> {
  const { wallet, markets, positions, setBalance } = useSim.getState();
  if (!wallet.connected) {
    toast.error("Connect wallet first");
    throw new Error("not connected");
  }
  const market = markets.find((m) => m.id === marketId);
  if (!market) throw new Error("market not found");
  if (market.status !== "CANCELLED") {
    toast.error("Market not cancelled");
    throw new Error("not cancelled");
  }
  const mine = positions.filter((p) => p.marketId === marketId);
  if (mine.length === 0) {
    toast("Nothing to refund on this market");
    throw new Error("no positions");
  }
  toast.loading("Refunding…", { id: "refund" });
  await delay(null, 900);
  const txHash = randomHash();
  const refund = mine.reduce((s, p) => s + p.size * p.avgPrice, 0);
  setBalance(refund);
  useSim.setState({ positions: positions.filter((p) => p.marketId !== marketId) });
  toast.success(`Refunded $${refund.toFixed(2)} · tx ${txHash.slice(0, 10)}…`, {
    id: "refund",
    duration: 4000,
  });
  return { txHash };
}

/**
 * DISPUTE-stage challenge. Stake-bonded challenge against the proposed outcome.
 * On-chain analogue: AgriOracleV2.challenge(questionId, stake, reasonHash).
 * Sim: flip market status to DISPUTED, record challenge metadata.
 */
export async function fileChallenge(input: {
  marketId: string;
  stakeUsdc: number;
  reason: string;
}): Promise<{ txHash: string }> {
  const { wallet, markets, setBalance, setMarkets } = useSim.getState();
  if (!wallet.connected) {
    toast.error("Connect wallet first");
    throw new Error("not connected");
  }
  if (input.stakeUsdc <= 0) {
    toast.error("Stake must be > 0");
    throw new Error("invalid stake");
  }
  if (input.stakeUsdc > wallet.balance) {
    toast.error(`Insufficient balance ($${wallet.balance.toFixed(2)})`);
    throw new Error("insufficient balance");
  }
  const market = markets.find((m) => m.id === input.marketId);
  if (!market) throw new Error("market not found");

  toast.loading("Filing challenge…", { id: "challenge" });
  await delay(null, 1000);
  const txHash = randomHash();

  setBalance(-input.stakeUsdc);
  setMarkets((prev) =>
    prev.map((m) =>
      m.id === input.marketId
        ? {
            ...m,
            status: "DISPUTED" as const,
            challenge: {
              challenger: wallet.address ?? "0xUSER",
              reason: input.reason || "(no reason provided)",
              filedAt: new Date().toISOString(),
            },
          }
        : m,
    ),
  );
  toast.success(`Challenge filed · staked $${input.stakeUsdc.toFixed(2)} · tx ${txHash.slice(0, 10)}…`, {
    id: "challenge",
    duration: 4000,
  });
  return { txHash };
}

/**
 * PENDING-stage "notify me on open" subscription. Pure sim: records a
 * { wallet, marketId } in the store. Real impl: Push API + backend
 * `POST /api/subscriptions { wallet, marketId }` triggered by a worker
 * watching the on-chain `MarketActivated` event.
 */
export function subscribeNotify(marketId: string): void {
  const { wallet, notifications, addNotification, removeNotification, markets } = useSim.getState();
  if (!wallet.connected) {
    toast.error("Connect wallet to subscribe");
    return;
  }
  const already = notifications.some(
    (n) => n.wallet === wallet.address && n.marketId === marketId,
  );
  if (already) {
    removeNotification(wallet.address!, marketId);
    toast("Unsubscribed from open-alert");
    return;
  }
  addNotification({
    wallet: wallet.address!,
    marketId,
    subscribedAt: new Date().toISOString(),
  });
  const m = markets.find((x) => x.id === marketId);
  toast.success(`We'll notify you when ${m?.productName ?? "this market"} opens (sim only)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ACTIONS — every fn returns the fake tx hash + emits toast.
// Mirrors backend + contract param shapes documented in src/lib/admin/*.md.
// ═══════════════════════════════════════════════════════════════════════════

const HOUR_S = 60 * 60;

export interface CreateBinaryInput {
  productCode: string;
  productName: string;
  productCategory: string;
  title: string;
  description?: string;
  threshold: number;
  thresholdUnit: string;
  resolutionTime: string;
  tradingCutoffTime: string;
  disputePeriodDays: number;
}

export async function adminCreateBinary(input: CreateBinaryInput): Promise<{ txHash: string }> {
  toast.loading("Creating binary market…", { id: "admin-create" });
  await delay(null, 1200);
  const txHash = randomHash();
  const id = `bin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const market: Market = {
    id,
    question: input.title,
    type: "BINARY",
    status: "PENDING",
    productCode: input.productCode,
    productName: input.productName,
    productCategory: input.productCategory,
    productColor: "oklch(0.7 0.18 240)",
    threshold: input.threshold,
    thresholdUnit: input.thresholdUnit,
    outcomes: [
      { label: "YES", probability: 0.5 },
      { label: "NO", probability: 0.5 },
    ],
    volume: 0,
    resolutionTime: input.resolutionTime,
    tradingCutoffTime: input.tradingCutoffTime,
    disputePeriodSeconds: input.disputePeriodDays * 86400,
  };
  useSim.getState().setMarkets((prev) => [market, ...prev]);
  toast.success(`Binary market created — tx ${txHash.slice(0, 10)}…`, { id: "admin-create" });
  // Mimic oracle activation flipping PENDING → ACTIVE after 1.5s.
  setTimeout(() => {
    useSim.getState().setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "ACTIVE" } : m)),
    );
  }, 1500);
  return { txHash };
}

export interface CreateMultiInput {
  productCode: string;
  productName: string;
  productCategory: string;
  title: string;
  description?: string;
  brackets: number[];
  thresholdUnit: string;
  resolutionTime: string;
  tradingCutoffTime: string;
  disputePeriodDays: number;
}

export async function adminCreateMulti(input: CreateMultiInput): Promise<{ txHash: string }> {
  toast.loading("Creating multi-bracket market…", { id: "admin-create" });
  await delay(null, 1200);
  const txHash = randomHash();
  const id = `mb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const labels: string[] = [];
  labels.push(`< ${input.brackets[0]} ${input.thresholdUnit}`);
  for (let i = 0; i < input.brackets.length - 1; i++) {
    labels.push(`${input.brackets[i]}–${input.brackets[i + 1]} ${input.thresholdUnit}`);
  }
  labels.push(`≥ ${input.brackets[input.brackets.length - 1]} ${input.thresholdUnit}`);
  const evenProb = 1 / labels.length;
  const market: Market = {
    id,
    question: input.title,
    type: "MULTI_BRACKET",
    status: "PENDING",
    productCode: input.productCode,
    productName: input.productName,
    productCategory: input.productCategory,
    productColor: "oklch(0.7 0.18 240)",
    brackets: input.brackets,
    outcomes: labels.map((label) => ({ label, probability: evenProb })),
    volume: 0,
    resolutionTime: input.resolutionTime,
    tradingCutoffTime: input.tradingCutoffTime,
    disputePeriodSeconds: input.disputePeriodDays * 86400,
  };
  useSim.getState().setMarkets((prev) => [market, ...prev]);
  toast.success(`Multi-bracket market created — tx ${txHash.slice(0, 10)}…`, {
    id: "admin-create",
  });
  setTimeout(() => {
    useSim.getState().setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "ACTIVE" } : m)),
    );
  }, 1500);
  return { txHash };
}

export async function adminResolveMarket(marketId: string): Promise<{ txHash: string }> {
  const { markets, setMarkets } = useSim.getState();
  const m = markets.find((x) => x.id === marketId);
  if (!m) throw new Error("not found");
  toast.loading(`Resolving ${m.productName}…`, { id: `resolve-${marketId}` });
  await delay(null, 900);
  const txHash = randomHash();
  // Pick a mock settlement: random outcome weighted by current probability.
  const winnerIdx = m.outcomes
    .map((o, i) => ({ i, w: o.probability }))
    .reduce((a, b) => (b.w > a.w ? b : a)).i;
  const settlementPrice =
    m.type === "BINARY" && m.threshold
      ? winnerIdx === 0
        ? m.threshold * 1.02
        : m.threshold * 0.98
      : m.brackets?.[Math.min(winnerIdx, (m.brackets?.length ?? 1) - 1)] ?? 0;
  setMarkets((prev) =>
    prev.map((mm) =>
      mm.id === marketId
        ? {
            ...mm,
            status: "RESOLVED",
            resolvedOutcome: {
              label: mm.outcomes[winnerIdx]?.label ?? "YES",
              settlementPriceLabel: `${settlementPrice.toLocaleString()} ${mm.thresholdUnit ?? ""}`.trim(),
              outcomeIdx: winnerIdx,
            },
          }
        : mm,
    ),
  );
  toast.success(
    `Resolved ${m.productName} — ${m.outcomes[winnerIdx]?.label} · tx ${txHash.slice(0, 10)}…`,
    { id: `resolve-${marketId}`, duration: 4000 },
  );
  return { txHash };
}

export async function adminTriggerResolutionCycle(): Promise<void> {
  const { markets } = useSim.getState();
  const due = markets.filter(
    (m) => m.status === "ACTIVE" && new Date(m.resolutionTime).getTime() < Date.now(),
  );
  if (due.length === 0) {
    toast("No markets due for resolution");
    return;
  }
  toast(`Resolving ${due.length} due market(s)…`);
  for (const m of due) {
    await adminResolveMarket(m.id);
  }
}

export async function adminResolveDispute(
  marketId: string,
  uphold: boolean,
): Promise<{ txHash: string }> {
  const { markets, setMarkets } = useSim.getState();
  const m = markets.find((x) => x.id === marketId);
  if (!m) throw new Error("not found");
  toast.loading(`Resolving dispute — ${uphold ? "uphold" : "flip"}`, { id: `dispute-${marketId}` });
  await delay(null, 1100);
  const txHash = randomHash();
  const proposed = m.proposedOutcome;
  let outcomeIdx = proposed?.outcomeIdx ?? 0;
  if (!uphold) {
    if (m.type === "BINARY") outcomeIdx = outcomeIdx === 0 ? 1 : 0;
    else outcomeIdx = (outcomeIdx + 1) % m.outcomes.length;
  }
  setMarkets((prev) =>
    prev.map((mm) =>
      mm.id === marketId
        ? {
            ...mm,
            status: "RESOLVED",
            resolvedOutcome: {
              label: mm.outcomes[outcomeIdx]?.label ?? "?",
              settlementPriceLabel: proposed?.settlementPriceLabel ?? "(admin override)",
              outcomeIdx,
            },
          }
        : mm,
    ),
  );
  toast.success(
    `Dispute ${uphold ? "upheld" : "flipped"} → ${m.outcomes[outcomeIdx]?.label} · tx ${txHash.slice(0, 10)}…`,
    { id: `dispute-${marketId}` },
  );
  return { txHash };
}

export async function adminFreezeMarket(marketId: string): Promise<{ txHash: string }> {
  await delay(null, 700);
  const txHash = randomHash();
  useSim.getState().setMarkets((prev) =>
    prev.map((m) => (m.id === marketId ? { ...m, isFrozen: true } : m)),
  );
  toast.success(`Market frozen · tx ${txHash.slice(0, 10)}…`);
  return { txHash };
}

export async function adminUnfreezeMarket(marketId: string): Promise<{ txHash: string }> {
  await delay(null, 700);
  const txHash = randomHash();
  useSim.getState().setMarkets((prev) =>
    prev.map((m) => (m.id === marketId ? { ...m, isFrozen: false } : m)),
  );
  toast.success(`Market unfrozen · tx ${txHash.slice(0, 10)}…`);
  return { txHash };
}

// Removed: adminCancelMarket, adminPauseMarket, adminResumeMarket — these functions
// don't exist anywhere in the real codebase (no contract, no backend route). The UI
// no longer exposes them either.

export async function adminSetReportingWindow(seconds: number): Promise<{ txHash: string }> {
  await delay(null, 700);
  const txHash = randomHash();
  useSim.getState().setOracleParams({ reportingWindow: seconds });
  toast.success(`Reporting window set to ${seconds}s · tx ${txHash.slice(0, 10)}…`);
  return { txHash };
}

export async function adminSetDefaultDispute(seconds: number): Promise<{ txHash: string }> {
  await delay(null, 700);
  const txHash = randomHash();
  useSim.getState().setOracleParams({ defaultDispute: seconds });
  toast.success(`Default dispute window set to ${seconds}s · tx ${txHash.slice(0, 10)}…`);
  return { txHash };
}

export async function adminSetQuestionDispute(
  marketId: string,
  seconds: number,
): Promise<{ txHash: string }> {
  await delay(null, 700);
  const txHash = randomHash();
  useSim.getState().setOracleQuestionDispute(marketId, seconds);
  toast.success(`Per-question dispute set · tx ${txHash.slice(0, 10)}…`);
  return { txHash };
}

export async function adminSetOperator(
  address: string,
  status: boolean,
): Promise<{ txHash: string }> {
  await delay(null, 700);
  const txHash = randomHash();
  useSim.getState().setExchangeConfig((prev) => ({
    ...prev,
    operators: { ...prev.operators, [address]: status },
  }));
  toast.success(`Operator ${status ? "enabled" : "disabled"} · tx ${txHash.slice(0, 10)}…`);
  return { txHash };
}

export async function adminRegisterTokens(
  tokenIds: string[],
  status: boolean,
): Promise<{ txHash: string }> {
  await delay(null, 800);
  const txHash = randomHash();
  useSim.getState().setExchangeConfig((prev) => {
    const next = { ...prev.registeredTokens };
    for (const id of tokenIds) next[id] = status;
    return { ...prev, registeredTokens: next };
  });
  toast.success(
    `${tokenIds.length} token(s) ${status ? "registered" : "unregistered"} · tx ${txHash.slice(0, 10)}…`,
  );
  return { txHash };
}

// Removed: adminSetFeeCollector. Setter exists in contract (AgriExchange L143) but
// the project charges no fees in practice — orders are signed with feeRateBps: 0
// (frontend/src/web3/hooks/use-order-signing.ts:67). No admin form for it.

export async function adminSetTimelock(seconds: number): Promise<{ txHash: string }> {
  await delay(null, 700);
  const txHash = randomHash();
  useSim.getState().setEscrowConfig({ timelock: seconds });
  toast.success(`Timelock set to ${seconds}s · tx ${txHash.slice(0, 10)}…`);
  return { txHash };
}

export async function adminMintTestUSDC(
  to: string,
  amount: number,
): Promise<{ txHash: string }> {
  await delay(null, 800);
  const txHash = randomHash();
  const { wallet, setBalance } = useSim.getState();
  if (wallet.connected && wallet.address?.toLowerCase() === to.toLowerCase()) {
    setBalance(amount);
  }
  toast.success(`Minted ${amount} USDC → ${truncate(to)} · tx ${txHash.slice(0, 10)}…`);
  return { txHash };
}

// Removed: adminAddReporter, adminRemoveReporter, adminSlashReporter.
// Registration is self-service via AgriOracleV2.registerReporter() (payable, anyone).
// Unregistration is self-service via AgriOracleV2.unregisterReporter().
// Slashing is autonomous inside settleReports() at a fixed 0.05 ETH per offense
// (AgriOracleV2.sol:35, :299-302). Admin cannot trigger any of these — the UI
// no longer exposes buttons for them.

// Helper exported for the dashboard.
export function getPendingResolutions(): Market[] {
  const { markets } = useSim.getState();
  const now = Date.now();
  return markets.filter(
    (m) => m.status === "ACTIVE" && new Date(m.resolutionTime).getTime() < now,
  );
}

// Use the unused constant to dodge tsc warning if strict.
export const _HOUR_S = HOUR_S;

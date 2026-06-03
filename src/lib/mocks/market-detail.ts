import type { Market, Orderbook, OrderRow, PricePoint } from "@/lib/types";

/**
 * Deterministic mock generators for market detail data:
 *   - priceHistory (last 30 days of YES probability ticks)
 *   - orderbook (YES bids + asks ladder)
 *   - rules / marketContext markdown
 *
 * Seed = market.id hash, so charts look credible AND stable across refreshes.
 */

// 32-bit string hash (sdbm) → seed for PRNG
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (s.charCodeAt(i) + (h << 6) + (h << 16) - h) | 0;
  return Math.abs(h);
}

// Mulberry32 PRNG — fast, good distribution, deterministic.
function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOW = Date.now();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Generate a Polymarket-style price history terminating at `terminalProb`.
 * Backend equivalent: bucketed candle table at fine resolution.
 *
 * Base granularity:
 *   - last 7 days  → 1-minute LOCF buckets (≈ 10 080 pts)
 *   - 7–60 d back  → 1-hour LOCF buckets (≈ 1 272 pts)
 *
 * Total per market ≈ 11 350 pts. The chart resamples this base data to a
 * per-range bucket via {@link resampleByBucket} so longer-range tabs
 * (1M / ALL) render as smooth hourly lines rather than a dense minute
 * tape.
 *
 * Per-market: span randomly 7d-only OR full ~60d via PRNG so different
 * markets feel like distinct mint dates.
 */
// Polymarket-style price action: long flat stretches with occasional
// sudden jumps on news / large trades. Tuned so most minutes carry
// the previous value forward (LOCF) and the visible chart has step-like
// segments rather than continuous noise.
const ALL_BANDS: { ms: number; interval: number; tradeProb: number; stepMag: number }[] = [
  { ms: 7 * DAY, interval: 1 * MINUTE, tradeProb: 0.015, stepMag: 0.012 },  // ~1 trade / 70 min
  { ms: 53 * DAY, interval: 1 * HOUR, tradeProb: 0.18, stepMag: 0.04 },     // ~4 trades / day
];

export function generatePriceHistory(
  marketId: string,
  terminalProb: number,
): PricePoint[] {
  const rand = rng(hashSeed(marketId));

  const bandCount = rand() > 0.5 ? ALL_BANDS.length : 1;
  const bands = ALL_BANDS.slice(0, bandCount);

  type Bucket = { t: number; tradeProb: number; stepMag: number };
  const bucketGrid: Bucket[] = [];
  let cursor = NOW;
  for (const band of bands) {
    const n = Math.max(2, Math.round(band.ms / band.interval));
    const start = cursor - band.ms;
    for (let i = 0; i < n; i++) {
      bucketGrid.push({
        t: start + i * band.interval,
        tradeProb: band.tradeProb,
        stepMag: band.stepMag,
      });
    }
    cursor = start;
  }
  bucketGrid.sort((a, b) => a.t - b.t);

  // Random walk with momentum + mean-reversion + occasional spikes.
  let p = Math.max(0.05, Math.min(0.95, terminalProb + (rand() - 0.5) * 0.4));
  let momentum = 0;
  const pts: PricePoint[] = [];
  for (let i = 0; i < bucketGrid.length; i++) {
    const { t, tradeProb, stepMag } = bucketGrid[i];
    if (rand() < tradeProb) {
      // Pull toward terminal grows as we approach NOW.
      const pull = (terminalProb - p) * (i / bucketGrid.length) * 0.08;
      // Momentum decays + random shock.
      momentum = momentum * 0.85 + (rand() - 0.5) * stepMag;
      p = Math.max(0.01, Math.min(0.99, p + pull + momentum));
      // Rare 1% chance of a news shock.
      if (rand() > 0.99) {
        p = Math.max(0.01, Math.min(0.99, p + (rand() - 0.5) * 0.12));
        momentum = 0;
      }
    }
    pts.push({ t, yesProb: p });
  }

  pts[pts.length - 1] = { t: NOW, yesProb: terminalProb };
  return pts;
}

/**
 * Aggregate a dense `PricePoint[]` into fixed-interval buckets. Returns one
 * row per bucket; value = close (last point seen in that bucket window).
 * Used by `ProbabilityChart` to render the right resolution per range tab
 * (1H→1m, 1D→5m, 1W→30m, 1M/ALL→1h).
 */
export function resampleByBucket(
  data: PricePoint[],
  bucketMs: number,
): PricePoint[] {
  if (data.length === 0 || bucketMs <= 0) return data;
  const out: PricePoint[] = [];
  let bucketStart = Math.floor(data[0].t / bucketMs) * bucketMs;
  let last = data[0];
  for (const p of data) {
    if (p.t < bucketStart + bucketMs) {
      last = p;
    } else {
      out.push({ t: bucketStart, yesProb: last.yesProb });
      bucketStart = Math.floor(p.t / bucketMs) * bucketMs;
      last = p;
    }
  }
  out.push({ t: bucketStart, yesProb: last.yesProb });
  return out;
}

/**
 * Generate a synthetic YES-side orderbook. Bids are below midPrice,
 * asks above. Sizes follow a roughly exponential decay from the inside.
 */
export function generateOrderbook(marketId: string, yesProb: number): Orderbook {
  const rand = rng(hashSeed(marketId) ^ 0xb00b);
  const mid = Math.round(yesProb * 100); // cents
  const spread = 1; // 1¢ inside spread

  function ladder(side: "bid" | "ask", levels = 8): OrderRow[] {
    const rows: OrderRow[] = [];
    let cumTotal = 0;
    for (let i = 0; i < levels; i++) {
      const price =
        side === "bid"
          ? Math.max(1, mid - spread - i)
          : Math.min(99, mid + spread + i);
      // Size: 50–500 shares, decays with distance from inside.
      const baseShares = 50 + Math.floor(rand() * 450);
      const shares = Math.round(baseShares * (1 + i * 0.2));
      cumTotal += shares * price;
      rows.push({ price, shares, total: cumTotal });
    }
    return rows;
  }

  return { bids: ladder("bid"), asks: ladder("ask") };
}

/**
 * Build a default Rules markdown for a binary threshold market.
 */
export function generateRules(m: Pick<Market, "type" | "productName" | "threshold" | "thresholdUnit" | "brackets" | "resolutionTime">): string {
  const date = new Date(m.resolutionTime).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (m.type === "BINARY") {
    return `This market resolves to **YES** if the official Ministry of Commerce (MOC) Thailand weighted average wholesale price for ${m.productName} on or before ${date} is greater than or equal to **${m.threshold?.toLocaleString()} ${m.thresholdUnit}**.

It resolves to **NO** if the settlement price is strictly less than that threshold.

If the MOC daily index is unavailable on the resolution date (e.g. public holiday), the most recent preceding weekday price is used. Oracle reporters submit signed price snapshots; the median of valid reports settles the market on-chain via AgriOracleV2.`;
  }
  // multi-bracket
  const brackets = m.brackets ?? [];
  const labels = brackets.map((b, i) => `**Bracket ${i + 1}**: ${b}${i === 0 ? `–${brackets[1] ?? "+"} ${m.thresholdUnit}` : i === brackets.length - 1 ? `+ ${m.thresholdUnit}` : `–${brackets[i + 1] ?? "+"} ${m.thresholdUnit}`}`);
  return `This market resolves to the bracket containing the official MOC Thailand weighted average wholesale price for ${m.productName} on ${date}:

${labels.map((l) => `- ${l}`).join("\n")}

If the MOC daily index is unavailable on the resolution date the most recent preceding weekday price is used. Oracle reporters submit signed price snapshots; the median of valid reports settles the bracket on-chain via AgriOracleV2.`;
}

export function generateMarketContext(m: Pick<Market, "productName" | "productCategory">): string {
  return `${m.productName} is a Thai agricultural commodity tracked daily by the Ministry of Commerce as part of the national price index. The MOC publishes weighted-average wholesale prices Monday–Friday at approximately 01:00 ICT.

This market settles on the official daily figure. Reporters cross-check the MOC publication with independent regional surveys before submitting; any reporter found inaccurate during settlement is slashed for 0.05 ETH per inaccurate report.

Category: **${m.productCategory}**.`;
}

export function enrichMarketDetail(m: Market): Market {
  // Every market gets full detail enrichment so the chart, orderbook
  // snapshot, rules, and context render on every stage. PENDING gets a
  // baseline series anchored at the initial probability so the chart
  // exists but visibly conveys "no trading yet" via a near-flat line.
  const yesProb = m.outcomes[0]?.probability ?? 0.5;
  return {
    ...m,
    priceHistory: m.priceHistory ?? generatePriceHistory(m.id, yesProb),
    orderbook: m.orderbook ?? generateOrderbook(m.id, yesProb),
    rules: m.rules ?? generateRules(m),
    marketContext: m.marketContext ?? generateMarketContext(m),
  };
}

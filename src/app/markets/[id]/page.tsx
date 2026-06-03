"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useSim } from "@/lib/sim/store";
import { ProbabilityChart, type ChartReferenceLine, type ChartReferenceArea } from "@/components/market-detail/probability-chart";
import { ChartToolbar, RANGE_MS, BUCKET_MS, TICK_MS, type RangeKey } from "@/components/market-detail/chart-toolbar";
import { DEFAULT_CHART_SETTINGS, type ChartSettings } from "@/components/market-detail/chart-settings";
import {
  BracketList,
  type BracketTab,
  type BracketDisplayMode,
  type BracketRowAccent,
} from "@/components/market-detail/multi-bracket/bracket-list";
import {
  generatePriceHistory as genBracketHistory,
  generateOrderbook as genBracketOrderbook,
} from "@/lib/mocks/market-detail";
import { OrderbookPanel } from "@/components/market-detail/orderbook-panel";
import { MarketDetailHeader } from "@/components/market-detail/market-detail-header";
import { ChanceSummary } from "@/components/market-detail/chance-summary";
import { TradePanel } from "@/components/trading/trade-panel";
import { PendingPanel } from "@/components/market-detail/stages/pending-panel";
import { ClosedPanel } from "@/components/market-detail/stages/closed-panel";
import { ReportingPanel } from "@/components/market-detail/stages/reporting-panel";
import { DisputePanel } from "@/components/market-detail/stages/dispute-panel";
import { DisputedPanel } from "@/components/market-detail/stages/disputed-panel";
import { ResolvedPanel } from "@/components/market-detail/stages/resolved-panel";
import { CancelledPanel } from "@/components/market-detail/stages/cancelled-panel";
import { PausedPanel } from "@/components/market-detail/stages/paused-panel";
import { deriveMarketStage, type MarketStage } from "@/lib/market-stage";
import type { Market } from "@/lib/types";

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const search = useSearchParams();
  const market = useSim((s) => s.markets.find((m) => m.id === id));
  const [range, setRange] = useState<RangeKey>("ALL");

  const initialSide = (search.get("side") as "YES" | "NO" | null) ?? "YES";
  const [displaySide, setDisplaySide] = useState<"YES" | "NO">(initialSide);
  const flipSide = () => setDisplaySide((s) => (s === "YES" ? "NO" : "YES"));

  // Multi-bracket: which bracket the right-column TradePanel is scoped to.
  // Initial value from `?outcome=N` URL param (set by markets-list bracket
  // row click) → defaults to 0 (top bracket post-sort = first row).
  const initialOutcomeIdx = (() => {
    const raw = search.get("outcome");
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  })();
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState<number>(initialOutcomeIdx);
  const [bracketTab, setBracketTab] = useState<BracketTab>("graph");
  const [bracketExpanded, setBracketExpanded] = useState<boolean>(false);

  // Hover state shared between the chart and ChanceSummary header. When the
  // cursor hovers a point, the header swaps from the terminal value to the
  // hovered value (Polymarket-style scrubbing).
  const [hoverT, setHoverT] = useState<number | null>(null);

  // Chart settings popover (Autoscale / X-Axis / Y-Axis / grids / annotations
  // / Both Outcomes). Session-local — not persisted.
  const [chartSettings, setChartSettings] = useState<ChartSettings>(DEFAULT_CHART_SETTINGS);

  // deriveMarketStage() uses `new Date()` → SSR vs CSR drift around
  // CLOSED↔REPORTING↔DISPUTE boundaries. Defer to post-mount so the
  // entire stage-dependent UI renders only on the client. Avoids
  // hydration mismatches for any market within ±10min of a stage boundary.
  // `now` ticks every second so PENDING → ACTIVE (and ACTIVE → CLOSED →
  // REPORTING → DISPUTE) transitions re-render the page in place without
  // a manual refresh.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stage = useMemo<MarketStage | null>(
    () => (market && mounted ? deriveMarketStage(market, now) : null),
    [market, mounted, now],
  );

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center space-y-4">
        <h1 className="text-2xl font-semibold">Market not found</h1>
        <Button asChild variant="outline">
          <Link href="/markets">← Back to Markets</Link>
        </Button>
      </div>
    );
  }

  const isActive = stage === "ACTIVE";
  const isResolvedOrCancelled = stage === "RESOLVED" || stage === "CANCELLED";
  // Orderbook strip is binary-only this phase; multi-bracket would need a
  // per-bracket orderbook (deferred).
  const showFullOrderbook = isActive && market.type === "BINARY";

  // Chart reference lines + shaded "trading closed" area for non-active stages.
  const referenceLines = useMemo<ChartReferenceLine[]>(() => {
    const list: ChartReferenceLine[] = [];
    if (!isActive && market.tradingCutoffTime) {
      list.push({
        t: new Date(market.tradingCutoffTime).getTime(),
        label: "Trading closed",
        color: "oklch(0.65 0.18 80)",
      });
    }
    if (
      market.resolutionTime &&
      (stage === "REPORTING" || stage === "DISPUTE" || stage === "DISPUTED" || stage === "RESOLVED")
    ) {
      list.push({
        t: new Date(market.resolutionTime).getTime(),
        label: "Resolution",
        color: "oklch(0.6 0.22 270)",
      });
    }
    return list;
  }, [isActive, stage, market.tradingCutoffTime, market.resolutionTime]);

  const referenceAreas = useMemo<ChartReferenceArea[]>(() => {
    const list: ChartReferenceArea[] = [];
    if (!isActive && market.tradingCutoffTime) {
      const cutoff = new Date(market.tradingCutoffTime).getTime();
      const end =
        (market.priceHistory?.[market.priceHistory.length - 1]?.t ?? Date.now()) + 1;
      if (end > cutoff) {
        list.push({ from: cutoff, to: end, color: "currentColor" });
      }
    }
    return list;
  }, [isActive, market.tradingCutoffTime, market.priceHistory]);

  // Multi-bracket stage → BracketList display mode mapping. Drives per-row
  // styling (greyed losers, winner highlight, dispute ring) without making
  // BracketList aware of the lifecycle enum.
  const bracketMode: BracketDisplayMode = useMemo(() => {
    if (market.type !== "MULTI_BRACKET") return "interactive";
    switch (stage) {
      case "ACTIVE":
        return "interactive";
      case "PENDING":
        return "preview";
      case "CLOSED":
      case "PAUSED":
        return "frozen";
      case "REPORTING":
      case "DISPUTE":
      case "DISPUTED":
        return "reporting";
      case "RESOLVED":
        return "resolved";
      case "CANCELLED":
        return "cancelled";
      default:
        return "preview";
    }
  }, [market.type, stage]);

  // Per-row accents — winner row on RESOLVED, proposed row on DISPUTE / DISPUTED.
  const bracketAccents = useMemo<BracketRowAccent[] | undefined>(() => {
    if (market.type !== "MULTI_BRACKET") return undefined;
    if (stage === "RESOLVED" && typeof market.resolvedOutcome?.outcomeIdx === "number") {
      return [{ idx: market.resolvedOutcome.outcomeIdx, tone: "win" }];
    }
    if (
      (stage === "DISPUTE" || stage === "DISPUTED") &&
      typeof market.proposedOutcome?.outcomeIdx === "number"
    ) {
      return [
        {
          idx: market.proposedOutcome.outcomeIdx,
          tone: stage === "DISPUTED" ? "proposed" : "proposed",
        },
      ];
    }
    return undefined;
  }, [market.type, stage, market.resolvedOutcome, market.proposedOutcome]);

  // Stage banner shown above the bracket rows in non-ACTIVE states.
  const bracketBanner = useMemo<React.ReactNode>(() => {
    if (market.type !== "MULTI_BRACKET" || stage === "ACTIVE" || stage === "PENDING") {
      return null;
    }
    const base = "rounded-md px-3 py-2 text-xs font-semibold";
    switch (stage) {
      case "CLOSED":
        return (
          <div className={`${base} bg-amber-500/15 text-amber-700 dark:text-amber-300`}>
            Trading ended — awaiting oracle reporters
          </div>
        );
      case "REPORTING":
        return (
          <div className={`${base} bg-blue-500/15 text-blue-700 dark:text-blue-300`}>
            Oracle reporters submitting…
          </div>
        );
      case "DISPUTE":
        return (
          <div className={`${base} bg-indigo-500/15 text-indigo-700 dark:text-indigo-300`}>
            Dispute window open — auto-resolves shortly
          </div>
        );
      case "DISPUTED":
        return (
          <div className={`${base} bg-rose-500/15 text-rose-700 dark:text-rose-300`}>
            Challenge filed — under admin review
          </div>
        );
      case "RESOLVED":
        return (
          <div className={`${base} bg-emerald-500/15 text-emerald-700 dark:text-emerald-300`}>
            Settled · winning bracket: {market.resolvedOutcome?.label ?? "—"}
          </div>
        );
      case "CANCELLED":
        return (
          <div className={`${base} bg-muted text-muted-foreground`}>
            Market cancelled — refund available
          </div>
        );
      case "PAUSED":
        return (
          <div className={`${base} bg-orange-500/15 text-orange-700 dark:text-orange-300`}>
            Paused by admin — trading temporarily halted
          </div>
        );
      default:
        return null;
    }
  }, [market.type, market.resolvedOutcome, stage]);

  // Per-bracket price history + orderbook for multi-bracket ACTIVE.
  // Seeded by `${marketId}:${idx}` so each bracket has a stable, distinct
  // series across reloads.
  const bracketHistory = useMemo(() => {
    if (market.type !== "MULTI_BRACKET") return null;
    const prob = market.outcomes[selectedOutcomeIdx]?.probability ?? 0.5;
    return genBracketHistory(`${market.id}:${selectedOutcomeIdx}`, prob);
  }, [market.type, market.id, market.outcomes, selectedOutcomeIdx]);

  const bracketOrderbook = useMemo(() => {
    if (market.type !== "MULTI_BRACKET") return null;
    const prob = market.outcomes[selectedOutcomeIdx]?.probability ?? 0.5;
    return genBracketOrderbook(`${market.id}:${selectedOutcomeIdx}`, prob);
  }, [market.type, market.id, market.outcomes, selectedOutcomeIdx]);

  return (
    <div className="bg-mesh min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 lg:px-8 py-6 max-w-[1400px]">
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          ← Back to Markets
        </Link>

        <MarketDetailHeader market={market} />

        {/* Top row: chart-block (left) + stage panel (right). Columns
            sized INDEPENDENTLY — each surface has its own `min-h-[460px]`
            so they start at the same visual height without coupling. When
            the panel grows (e.g. reporter list expands) the chart card
            does NOT follow. */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-4 items-start">
          <div className="min-w-0">
            {/* MULTI_BRACKET — single BracketList drives every stage. ACTIVE
                renders interactive (drawer + Yes/No); other stages render
                their stage-specific variant (preview/frozen/reporting/
                resolved/cancelled) via `displayMode` + `banner` + accents. */}
            {market.type === "MULTI_BRACKET" && (
              <BracketList
                market={market}
                selectedOutcomeIdx={selectedOutcomeIdx}
                selectedSide={displaySide}
                expanded={bracketExpanded}
                displayMode={bracketMode}
                banner={bracketBanner}
                rowAccents={bracketAccents}
                onRowClick={(idx) => {
                  // Row click toggles the drawer when it's the same row;
                  // a different row selects + expands.
                  if (idx === selectedOutcomeIdx) {
                    setBracketExpanded((v) => !v);
                  } else {
                    setSelectedOutcomeIdx(idx);
                    setBracketExpanded(true);
                  }
                }}
                onSideClick={(idx, s) => {
                  // Yes/No button only updates selection — drawer state
                  // is independent and only toggled by clicking the row's
                  // label area.
                  setSelectedOutcomeIdx(idx);
                  setDisplaySide(s);
                }}
                activeTab={bracketTab}
                onTabChange={setBracketTab}
                expansion={
                  bracketTab === "graph" && bracketHistory ? (
                    <div className="rounded-lg border bg-card flex flex-col">
                      <div className="px-4 pt-3 pb-1">
                        <ChanceSummary
                          data={bracketHistory}
                          rangeMs={RANGE_MS[range]}
                          range={range}
                          displaySide={displaySide}
                          hoverT={hoverT}
                          bothOutcomes={chartSettings.bothOutcomes}
                        />
                      </div>
                      <div className="px-2">
                        <ProbabilityChart
                          data={bracketHistory}
                          rangeMs={RANGE_MS[range]}
                          bucketMs={BUCKET_MS[range]}
                          tickIntervalMs={TICK_MS[range]}
                          settings={chartSettings}
                          displaySide={displaySide}
                          onHoverChange={setHoverT}
                        />
                      </div>
                      <ChartToolbar
                        volume={market.volume}
                        resolutionDate={market.resolutionTime}
                        range={range}
                        onRangeChange={setRange}
                        displaySide={displaySide}
                        onFlipSide={flipSide}
                        settings={chartSettings}
                        onSettingsChange={setChartSettings}
                      />
                    </div>
                  ) : bracketTab === "orderbook" && bracketOrderbook ? (
                    <OrderbookPanel book={bracketOrderbook} />
                  ) : null
                }
              />
            )}

            {market.type !== "MULTI_BRACKET" && market.priceHistory && !isResolvedOrCancelled && stage !== "PENDING" && (
              <div className="rounded-xl border bg-card flex flex-col min-h-[460px]">
                <div className="px-4 pt-3 pb-1">
                  <ChanceSummary
                    data={market.priceHistory}
                    rangeMs={RANGE_MS[range]}
                    range={range}
                    displaySide={displaySide}
                    hoverT={hoverT}
                    bothOutcomes={chartSettings.bothOutcomes}
                  />
                </div>
                <div className="px-2 flex-1 min-h-0">
                  <ProbabilityChart
                    data={market.priceHistory}
                    rangeMs={RANGE_MS[range]}
                    bucketMs={BUCKET_MS[range]}
                    tickIntervalMs={TICK_MS[range]}
                    settings={chartSettings}
                    displaySide={displaySide}
                    referenceLines={referenceLines}
                    referenceAreas={referenceAreas}
                    onHoverChange={setHoverT}
                  />
                </div>
                <ChartToolbar
                  volume={market.volume}
                  resolutionDate={market.resolutionTime}
                  range={range}
                  onRangeChange={setRange}
                  displaySide={displaySide}
                  onFlipSide={flipSide}
                  settings={chartSettings}
                  onSettingsChange={setChartSettings}
                />
              </div>
            )}

            {/* PENDING binary → blurred chart with "no trading yet" overlay.
                PENDING multi-bracket is handled by the unified BracketList
                block above (displayMode="preview"). */}
            {market.type !== "MULTI_BRACKET" && market.priceHistory && stage === "PENDING" && (
              <div className="rounded-xl border bg-card px-2 py-3 space-y-2 relative overflow-hidden flex-1 flex flex-col min-h-[460px]">
                <div className="blur-md opacity-40 pointer-events-none select-none flex-1 flex flex-col">
                  <div className="flex-1 min-h-0">
                    <ProbabilityChart
                      data={market.priceHistory}
                      rangeMs={RANGE_MS[range]}
                      bucketMs={BUCKET_MS[range]}
                    tickIntervalMs={TICK_MS[range]}
                    settings={chartSettings}
                      displaySide={displaySide}
                    />
                  </div>
                  <ChartToolbar
                    volume={market.volume}
                    resolutionDate={market.resolutionTime}
                    range={range}
                    onRangeChange={setRange}
                    displaySide={displaySide}
                    onFlipSide={flipSide}
                  settings={chartSettings}
                  onSettingsChange={setChartSettings}
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="rounded-lg bg-background/90 backdrop-blur-sm border px-4 py-3 text-center max-w-xs">
                    <div className="text-sm font-semibold">No price history yet</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      Chart unlocks once the oracle activates this market and the first
                      trades land.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* RESOLVED → chart with both ref lines + ChanceSummary header
                so the chart card matches the visual structure of the
                ACTIVE / CLOSED / REPORTING variants. */}
            {market.type !== "MULTI_BRACKET" && market.priceHistory && stage === "RESOLVED" && (
              <div className="rounded-xl border bg-card flex flex-col min-h-[460px]">
                <div className="px-4 pt-3 pb-1">
                  <ChanceSummary
                    data={market.priceHistory}
                    rangeMs={RANGE_MS[range]}
                    range={range}
                    displaySide={displaySide}
                    hoverT={hoverT}
                    bothOutcomes={chartSettings.bothOutcomes}
                  />
                </div>
                <div className="px-2 flex-1 min-h-0">
                  <ProbabilityChart
                    data={market.priceHistory}
                    rangeMs={RANGE_MS[range]}
                    bucketMs={BUCKET_MS[range]}
                    tickIntervalMs={TICK_MS[range]}
                    settings={chartSettings}
                    displaySide={displaySide}
                    referenceLines={referenceLines}
                    referenceAreas={referenceAreas}
                    onHoverChange={setHoverT}
                  />
                </div>
                <ChartToolbar
                  volume={market.volume}
                  resolutionDate={market.resolutionTime}
                  range={range}
                  onRangeChange={setRange}
                  displaySide={displaySide}
                  onFlipSide={flipSide}
                  settings={chartSettings}
                  onSettingsChange={setChartSettings}
                />
              </div>
            )}

            {/* CANCELLED → greyed chart with ChanceSummary header for
                visual parity with the other stage variants. */}
            {market.type !== "MULTI_BRACKET" && market.priceHistory && stage === "CANCELLED" && (
              <div className="rounded-xl border bg-card opacity-50 relative flex flex-col min-h-[460px]">
                <div className="px-4 pt-3 pb-1">
                  <ChanceSummary
                    data={market.priceHistory}
                    rangeMs={RANGE_MS[range]}
                    range={range}
                    displaySide={displaySide}
                    hoverT={hoverT}
                    bothOutcomes={chartSettings.bothOutcomes}
                  />
                </div>
                <div className="px-2 flex-1 min-h-0">
                  <ProbabilityChart
                    data={market.priceHistory}
                    rangeMs={RANGE_MS[range]}
                    bucketMs={BUCKET_MS[range]}
                    tickIntervalMs={TICK_MS[range]}
                    settings={chartSettings}
                    displaySide={displaySide}
                    onHoverChange={setHoverT}
                  />
                </div>
                <ChartToolbar
                  volume={market.volume}
                  resolutionDate={market.resolutionTime}
                  range={range}
                  onRangeChange={setRange}
                  displaySide={displaySide}
                  onFlipSide={flipSide}
                  settings={chartSettings}
                  onSettingsChange={setChartSettings}
                />
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="rounded-md bg-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                    Cancelled
                  </span>
                </div>
              </div>
            )}

            {/* No price history yet (no enrichment) → placeholder card */}
            {!market.priceHistory && (
              <div className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground flex-1 grid place-items-center">
                Price history will appear when the market becomes active.
              </div>
            )}

            {/* Orderbook / last-quote strip — stacked TIGHT under the chart
                card in the same column. Eliminates the visible gap that
                used to appear between chart card and orderbook when the
                right panel was taller than 460 px. */}
            {showFullOrderbook && market.orderbook && (
              <div className="mt-4">
                <OrderbookPanel book={market.orderbook} />
              </div>
            )}
          </div>

          {/* Right column — stage panel sized independently from the
              chart block. Each panel Card has its own `min-h-[460px]`. */}
          <div className="min-w-0">
            <StagePanel
              stage={stage}
              market={market}
              displaySide={displaySide}
              onSideChange={setDisplaySide}
              selectedOutcomeIdx={selectedOutcomeIdx}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StagePanel({
  stage,
  market,
  displaySide,
  onSideChange,
  selectedOutcomeIdx,
}: {
  stage: MarketStage | null;
  market: Market;
  displaySide: "YES" | "NO";
  onSideChange: (s: "YES" | "NO") => void;
  selectedOutcomeIdx: number;
}) {
  // Pre-mount (server + first client paint): render a stable skeleton.
  if (stage === null) return <SkeletonPanel />;

  // PENDING is type-agnostic — PendingPanel renders threshold (binary) or
  // bracket list (multi) from the same panel. Routed before the type guard.
  if (stage === "PENDING") return <PendingPanel market={market} />;

  // ACTIVE multi-bracket → same TradePanel as binary, scoped to the
  // selected bracket. Other multi-bracket stages keep the placeholder.
  if (stage === "ACTIVE" && market.type === "MULTI_BRACKET") {
    return (
      <TradePanel
        market={market}
        side={displaySide}
        onSideChange={onSideChange}
        selectedOutcomeIdx={selectedOutcomeIdx}
      />
    );
  }

  // Non-ACTIVE stage panels (Closed / Reporting / Dispute / Disputed /
  // Resolved / Cancelled / Paused) are type-agnostic — they consume
  // generic fields (countdowns, reporters, proposedOutcome, resolvedOutcome)
  // that the mock already populates for multi-bracket markets. Bracket
  // identity surfaces in the left-column BracketList variant instead.
  switch (stage) {
    case "ACTIVE":
      return <TradePanel market={market} side={displaySide} onSideChange={onSideChange} />;
    case "CLOSED":
      return <ClosedPanel market={market} />;
    case "REPORTING":
      return <ReportingPanel market={market} />;
    case "DISPUTE":
      return <DisputePanel market={market} />;
    case "DISPUTED":
      return <DisputedPanel market={market} />;
    case "RESOLVED":
      return <ResolvedPanel market={market} />;
    case "CANCELLED":
      return <CancelledPanel market={market} />;
    case "PAUSED":
      return <PausedPanel market={market} />;
    default:
      return <SkeletonPanel />;
  }
}

function SkeletonPanel() {
  return (
    <div className="rounded-xl border px-5 py-6 bg-card sticky top-20 space-y-3 animate-pulse">
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="h-3 w-40 rounded bg-muted" />
      <div className="h-8 w-full rounded bg-muted" />
      <div className="h-3 w-32 rounded bg-muted" />
    </div>
  );
}

function MultiBracketSoonPanel({ stage }: { stage: MarketStage }) {
  return (
    <div className="rounded-xl border px-5 py-6 bg-muted/40 text-muted-foreground sticky top-20">
      <div className="font-semibold text-sm">{stage}</div>
      <p className="text-xs mt-1 leading-relaxed opacity-80">
        Stage panel for multi-bracket markets coming in the next phase.
      </p>
    </div>
  );
}

"use client";

import { useMemo, type ReactNode } from "react";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Market } from "@/lib/types";

function fmtResolution(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type BracketTab = "graph" | "orderbook";

export type BracketDisplayMode =
  | "interactive" // ACTIVE — full row click, Yes/No, drawer
  | "preview" // PENDING — no %, no Δ, no buttons, no drawer
  | "frozen" // CLOSED / PAUSED — last % shown, no Δ, no buttons, no drawer
  | "reporting" // REPORTING / DISPUTE / DISPUTED — frozen + reporter median per row
  | "resolved" // RESOLVED — winner highlighted, losers greyed
  | "cancelled"; // CANCELLED — all rows greyed

export interface BracketRowAccent {
  idx: number;
  tone: "win" | "loss" | "proposed";
}

interface BracketListProps {
  market: Market;
  selectedOutcomeIdx: number;
  selectedSide: "YES" | "NO";
  // Toggle behaviour for `interactive` mode only.
  expanded: boolean;
  onRowClick: (outcomeIdx: number) => void;
  onSideClick: (outcomeIdx: number, side: "YES" | "NO") => void;
  activeTab: BracketTab;
  onTabChange: (tab: BracketTab) => void;
  expansion: ReactNode;
  displayMode?: BracketDisplayMode;
  // Stage banner rendered between the volume strip and the rows.
  banner?: ReactNode;
  // Per-row accent overlay — used by RESOLVED (winning row) / DISPUTE
  // (proposed row).
  rowAccents?: BracketRowAccent[];
}

// Tiny deterministic hash → 24h-change % per bracket. Stable across reloads
// because seeded by `marketId + outcomeIdx`. Used only as cosmetic flavour
// on the row; real change data would come from the backend candles table.
function bracketChange(marketId: string, idx: number): number {
  let h = 0;
  const s = `${marketId}::${idx}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const v = ((Math.abs(h) % 80) - 40) / 10; // ~ -4.0 % .. +4.0 %
  return v;
}

const TABS: { key: BracketTab; label: string }[] = [
  { key: "graph", label: "Graph" },
  { key: "orderbook", label: "Order Book" },
];

export function BracketList({
  market,
  selectedOutcomeIdx,
  selectedSide,
  expanded,
  onRowClick,
  onSideClick,
  activeTab,
  onTabChange,
  expansion,
  displayMode = "interactive",
  banner,
  rowAccents,
}: BracketListProps) {
  const isInteractive = displayMode === "interactive";
  const isPreview = displayMode === "preview";
  const isResolved = displayMode === "resolved";
  const isCancelled = displayMode === "cancelled";
  const isReporting = displayMode === "reporting";
  const showProbability = !isPreview;
  const showChange = isInteractive;
  const proposedIdx = isReporting ? market.proposedOutcome?.outcomeIdx : undefined;

  const reporterByOutcome = useMemo(() => {
    // For REPORTING / DISPUTE / DISPUTED — surface the reporter median
    // value next to the bracket the reporters most often agreed on. The
    // mock stores `proposedOutcome.outcomeIdx` so use that for the hint
    // row; other rows leave it blank.
    const map = new Map<number, string>();
    if (!isReporting) return map;
    const idx = market.proposedOutcome?.outcomeIdx;
    if (typeof idx === "number" && market.proposedOutcome?.settlementPriceLabel) {
      map.set(idx, market.proposedOutcome.settlementPriceLabel);
    }
    return map;
  }, [isReporting, market.proposedOutcome]);

  const rows = useMemo(() => {
    const probSum = market.outcomes.reduce((s, o) => s + o.probability, 0) || 1;
    return market.outcomes.map((o, idx) => ({
      idx,
      label: o.label,
      probability: o.probability,
      volume: Math.round(market.volume * (o.probability / probSum)),
      change: bracketChange(market.id, idx),
    }));
  }, [market.id, market.outcomes, market.volume]);

  function rowTone(idx: number): BracketRowAccent["tone"] | undefined {
    return rowAccents?.find((a) => a.idx === idx)?.tone;
  }

  return (
    <div className="rounded-xl border bg-card divide-y">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground/90">
          ${market.volume.toLocaleString()} Vol.
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" />
          {fmtResolution(market.resolutionTime)}
        </span>
      </div>
      {banner && <div className="px-4 py-3">{banner}</div>}
      {rows.map((row) => {
        const yesCents = Math.round(row.probability * 100);
        const noCents = 100 - yesCents;
        const dir: "up" | "down" | "flat" =
          row.change > 0.1 ? "up" : row.change < -0.1 ? "down" : "flat";
        const Icon = dir === "up" ? TrendingUp : TrendingDown;
        const isSelectedRow = row.idx === selectedOutcomeIdx;
        const tone = rowTone(row.idx);
        const winnerRow = tone === "win";
        const resolvedLoserRow = isResolved && tone !== "win";
        const reporterHint = reporterByOutcome.get(row.idx);
        const isProposedRow = isReporting && row.idx === proposedIdx;
        const isProposedNo =
          isReporting && proposedIdx !== undefined && row.idx !== proposedIdx;

        return (
          <div key={row.idx}>
            <div
              className={cn(
                "grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 transition-colors",
                isPreview && "opacity-70",
                resolvedLoserRow && "opacity-60",
                (isCancelled || tone === "loss") && "opacity-35",
                winnerRow && "ring-2 ring-emerald-500/40 bg-emerald-500/10",
                tone === "proposed" && "ring-2 ring-indigo-500/40 bg-indigo-500/5",
                isInteractive &&
                  (isSelectedRow ? "bg-muted/50" : "hover:bg-muted/30"),
              )}
            >
              <div
                onClick={isInteractive ? () => onRowClick(row.idx) : undefined}
                className={cn("min-w-0", isInteractive && "cursor-pointer")}
              >
                <div
                  className={cn(
                    "text-base font-semibold leading-tight truncate",
                    tone === "proposed" && "line-through decoration-rose-500/60",
                  )}
                >
                  {row.label}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  ${row.volume.toLocaleString()} Vol.
                </div>
                {reporterHint && (
                  <div className="mt-1 text-[11px] font-mono text-blue-700 dark:text-blue-300">
                    median: {reporterHint}
                  </div>
                )}
                {isProposedNo && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Proposed NO
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {showProbability && (
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-2xl font-bold tabular-nums",
                        winnerRow && "text-emerald-600 dark:text-emerald-400",
                        resolvedLoserRow && "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {resolvedLoserRow ? "100%" : `${yesCents}%`}
                    </div>
                    {showChange && dir !== "flat" && (
                      <div
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
                          dir === "up"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        <Icon className="size-3" />
                        {Math.abs(row.change).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
                {winnerRow && (
                  <span className="rounded-md bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Yes Won
                  </span>
                )}
                {resolvedLoserRow && (
                  <span className="rounded-md bg-rose-500/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    No Won
                  </span>
                )}
                {isInteractive && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSideClick(row.idx, "YES");
                      }}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-semibold transition-colors min-w-[110px]",
                        "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25",
                        "dark:text-emerald-300",
                        isSelectedRow &&
                          selectedSide === "YES" &&
                          "ring-2 ring-emerald-500 bg-emerald-500/25",
                      )}
                    >
                      Buy Yes {yesCents}¢
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSideClick(row.idx, "NO");
                      }}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-semibold transition-colors min-w-[110px]",
                        "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25",
                        "dark:text-rose-300",
                        isSelectedRow &&
                          selectedSide === "NO" &&
                          "ring-2 ring-rose-500 bg-rose-500/25",
                      )}
                    >
                      Buy No {noCents}¢
                    </button>
                  </>
                )}
              </div>
            </div>
            {isInteractive && isSelectedRow && expanded && (
              <div className="px-4 pb-4 bg-muted/30 border-t">
                <div className="flex items-center gap-5 border-b pt-3 pb-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => onTabChange(tab.key)}
                      className={cn(
                        "text-sm font-medium pb-2 -mb-px border-b-2 transition-colors",
                        activeTab === tab.key
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="pt-3">{expansion}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

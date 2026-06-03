"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/lib/types";
import type { RangeKey } from "./chart-toolbar";

interface ChanceSummaryProps {
  data: PricePoint[];
  rangeMs?: number;
  range: RangeKey;
  displaySide: "YES" | "NO";
  hoverT?: number | null;
  bothOutcomes?: boolean;
}

const YES_COLOR = "oklch(0.55 0.25 270)";
const NO_COLOR = "oklch(0.55 0.22 25)";

const RANGE_LABEL: Record<RangeKey, string> = {
  "1H": "past hour",
  "6H": "past 6h",
  "1D": "past 24h",
  "1W": "past week",
  "1M": "past month",
  ALL: "all-time",
};

export function ChanceSummary({
  data,
  rangeMs,
  range,
  displaySide,
  hoverT,
  bothOutcomes,
}: ChanceSummaryProps) {
  const { current, change } = useMemo(() => {
    if (data.length === 0) return { current: 0, change: 0 };
    // Default: chart's terminal value. When hovering, pick the data point at
    // or just before hoverT.
    let endProb = data[data.length - 1].yesProb;
    if (typeof hoverT === "number") {
      // Linear walk back from end is cheap enough for ≤ 12k pts; binary search
      // would be premature optimisation here.
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].t <= hoverT) {
          endProb = data[i].yesProb;
          break;
        }
      }
    }
    let start = data[0].yesProb;
    if (rangeMs) {
      const cutoff = data[data.length - 1].t - rangeMs;
      const head = data.find((p) => p.t >= cutoff);
      if (head) start = head.yesProb;
    }
    const curr = displaySide === "YES" ? endProb : 1 - endProb;
    const startSide = displaySide === "YES" ? start : 1 - start;
    return { current: curr, change: curr - startSide };
  }, [data, rangeMs, displaySide, hoverT]);

  const pctCurrent = Math.round(current * 100);
  const pctChange = change * 100;
  const dir: "up" | "down" | "flat" = pctChange > 0.05 ? "up" : pctChange < -0.05 ? "down" : "flat";

  const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
  const toneClass =
    dir === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : dir === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";

  if (bothOutcomes) {
    // Dual-side legend: matches the YES + NO line colours in the chart.
    const yesPct = Math.round((displaySide === "YES" ? current : 1 - current) * 100);
    const noPct = 100 - yesPct;
    const primaryColor = displaySide === "YES" ? YES_COLOR : NO_COLOR;
    const oppositeColor = displaySide === "YES" ? NO_COLOR : YES_COLOR;
    const primaryLabel = displaySide === "YES" ? "Yes" : "No";
    const oppositeLabel = displaySide === "YES" ? "No" : "Yes";
    const primaryPct = displaySide === "YES" ? yesPct : noPct;
    const oppositePct = displaySide === "YES" ? noPct : yesPct;
    return (
      <div className="flex items-baseline gap-4 pt-1">
        <span
          className="inline-flex items-center gap-1.5 text-2xl font-bold tabular-nums"
          style={{ color: primaryColor }}
        >
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          {primaryLabel} {primaryPct}%
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-2xl font-bold tabular-nums"
          style={{ color: oppositeColor, opacity: 0.6 }}
        >
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: oppositeColor }}
          />
          {oppositeLabel} {oppositePct}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-2.5 pt-1">
      <span className="text-3xl font-bold tabular-nums">{pctCurrent}%</span>
      <span className="text-sm text-muted-foreground">chance</span>
      <span className={cn("inline-flex items-baseline gap-1 text-sm font-medium", toneClass)}>
        <Icon className="size-3.5 self-center" />
        <span className="tabular-nums">
          {pctChange > 0 ? "+" : ""}
          {pctChange.toFixed(1)}%
        </span>
        <span className="text-muted-foreground font-normal">({RANGE_LABEL[range]})</span>
      </span>
    </div>
  );
}

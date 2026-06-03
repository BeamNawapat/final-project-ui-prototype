"use client";

import { Clock, ArrowLeftRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartSettingsPopover, type ChartSettings } from "./chart-settings";

export type RangeKey = "1H" | "6H" | "1D" | "1W" | "1M" | "ALL";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const RANGE_MS: Record<RangeKey, number | undefined> = {
  "1H": HOUR,
  "6H": 6 * HOUR,
  "1D": DAY,
  "1W": 7 * DAY,
  "1M": 30 * DAY,
  ALL: undefined,
};

// Per-range bucket size for chart aggregation. Longer ranges use coarser
// buckets so the line reads as a smooth curve, not a hi-frequency tape.
const MIN = 60_000;
export const BUCKET_MS: Record<RangeKey, number> = {
  "1H": 1 * MIN,
  "6H": 1 * MIN,
  "1D": 5 * MIN,
  "1W": 30 * MIN,
  "1M": 4 * 60 * MIN,
  ALL: 4 * 60 * MIN,
};

// Per-range X-axis tick spacing (label cadence). User-spec:
//   1H → every 10 min,  6H → every 1h,  1D → every 4h,
//   1W → every 1d,      1M → every 3d,  ALL → every 3d.
export const TICK_MS: Record<RangeKey, number> = {
  "1H": 10 * MIN,
  "6H": 60 * MIN,
  "1D": 4 * 60 * MIN,
  "1W": 24 * 60 * MIN,
  "1M": 3 * 24 * 60 * MIN,
  ALL: 3 * 24 * 60 * MIN,
};

interface ChartToolbarProps {
  volume: number;
  resolutionDate: string;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  displaySide: "YES" | "NO";
  onFlipSide: () => void;
  settings: ChartSettings;
  onSettingsChange: (next: ChartSettings) => void;
}

function fmtVolume(v: number): string {
  return `$${v.toLocaleString()} Vol.`;
}

function fmtResolution(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const RANGES: RangeKey[] = ["1H", "6H", "1D", "1W", "1M", "ALL"];

export function ChartToolbar({
  volume,
  resolutionDate,
  range,
  onRangeChange,
  displaySide,
  onFlipSide,
  settings,
  onSettingsChange,
}: ChartToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 pb-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-semibold tabular-nums text-foreground/90">{fmtVolume(volume)}</span>
        <span className="opacity-40">·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" />
          {fmtResolution(resolutionDate)}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={cn(
              "px-2 py-1 rounded-md text-xs font-medium transition-colors",
              range === r
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
        <span className="w-px h-4 bg-border mx-1" />
        {!settings.bothOutcomes && (
          <button
            type="button"
            onClick={onFlipSide}
            className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground"
            title={`Showing ${displaySide} — click to flip to ${displaySide === "YES" ? "NO" : "YES"}`}
          >
            <ArrowLeftRight className="size-3.5" />
          </button>
        )}
        <ChartSettingsPopover
          value={settings}
          onChange={onSettingsChange}
          trigger={
            <button
              type="button"
              className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground"
              title="Chart settings"
            >
              <Settings2 className="size-3.5" />
            </button>
          }
        />
      </div>
    </div>
  );
}

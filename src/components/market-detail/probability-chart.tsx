"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import type { PricePoint } from "@/lib/types";
import { resampleByBucket } from "@/lib/mocks/market-detail";
import { DEFAULT_CHART_SETTINGS, type ChartSettings } from "./chart-settings";

export interface ChartReferenceLine {
  t: number; // unix ms
  label: string;
  color?: string; // tailwind-friendly oklch or hex
  strokeDasharray?: string;
}

export interface ChartReferenceArea {
  from: number;
  to: number;
  color?: string;
  label?: string;
}

interface ProbabilityChartProps {
  data: PricePoint[];
  rangeMs?: number; // slice the tail
  bucketMs?: number; // aggregation interval; pass via BUCKET_MS[range]
  tickIntervalMs?: number; // X-axis label cadence; pass via TICK_MS[range]
  height?: number;
  displaySide?: "YES" | "NO";
  referenceLines?: ChartReferenceLine[];
  referenceAreas?: ChartReferenceArea[];
  onHoverChange?: (t: number | null) => void;
  settings?: ChartSettings;
}

function fmtDate(t: number, span: number) {
  const d = new Date(t);
  if (span <= 86_400_000)
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (span <= 7 * 86_400_000)
    return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProbabilityChart({
  data,
  rangeMs,
  bucketMs,
  tickIntervalMs,
  height = 320,
  displaySide = "YES",
  referenceLines,
  referenceAreas,
  onHoverChange,
  settings = DEFAULT_CHART_SETTINGS,
}: ProbabilityChartProps) {
  // Project YES history to the displayed side. NO = 1 - YES.
  const projected = useMemo(
    () =>
      data.map((p) => ({
        t: p.t,
        yesProb: displaySide === "YES" ? p.yesProb : 1 - p.yesProb,
      })),
    [data, displaySide],
  );

  const sliced = useMemo(() => {
    if (!rangeMs || projected.length === 0) return projected;
    const cutoff = projected[projected.length - 1].t - rangeMs;
    return projected.filter((p) => p.t >= cutoff);
  }, [projected, rangeMs]);

  // Aggregate sliced data into per-range buckets (close-of-bucket).
  const bucketed = useMemo(
    () => (bucketMs ? resampleByBucket(sliced, bucketMs) : sliced),
    [sliced, bucketMs],
  );

  const last = bucketed[bucketed.length - 1];
  const span = bucketed.length > 1 ? bucketed[bucketed.length - 1].t - bucketed[0].t : 86_400_000;

  // Pre-computed X-axis ticks for label cadence. When `tickIntervalMs` is
  // provided, ticks land at fixed wall-clock intervals (10m / 1h / 4h / 1d
  // / 3d) regardless of how many data buckets land between them.
  const ticks = useMemo<number[] | undefined>(() => {
    if (!tickIntervalMs || bucketed.length === 0) return undefined;
    const startT = bucketed[0].t;
    const endT = bucketed[bucketed.length - 1].t;
    const first = Math.ceil(startT / tickIntervalMs) * tickIntervalMs;
    const arr: number[] = [];
    for (let t = first; t <= endT; t += tickIntervalMs) arr.push(t);
    return arr;
  }, [bucketed, tickIntervalMs]);

  // Local hover state — used to render the future-dim ReferenceArea. Also
  // propagated to parent via onHoverChange so ChanceSummary can swap value.
  const [hoverT, setHoverT] = useState<number | null>(null);
  function emitHover(t: number | null) {
    setHoverT(t);
    onHoverChange?.(t);
  }
  const domainMax = last?.t ?? 0;

  // Split data on hover: rows with `t <= hoverT` get the value on `past`,
  // rows with `t > hoverT` get the value on `future`. Two `<Line>` series
  // are rendered against these fields → past portion in primary colour,
  // future portion in dim gray.
  const splitData = useMemo(
    () =>
      bucketed.map((p) => {
        const complement = 1 - p.yesProb;
        const isPast = hoverT === null || p.t <= hoverT;
        const isFuture = hoverT !== null && p.t >= hoverT;
        return {
          t: p.t,
          yesProb: p.yesProb, // keep for tooltip payload
          past: isPast ? p.yesProb : null,
          future: isFuture ? p.yesProb : null,
          oppositePast: isPast ? complement : null,
          oppositeFuture: isFuture ? complement : null,
        };
      }),
    [bucketed, hoverT],
  );

  // Y-axis range — Autoscale on → fit to visible data; off → fixed 0–100 %.
  const { yMin, yMax } = useMemo(() => {
    if (!settings.autoscale) return { yMin: 0, yMax: 1 };
    if (bucketed.length === 0) return { yMin: 0, yMax: 1 };
    const lo = Math.min(...bucketed.map((p) => p.yesProb));
    const hi = Math.max(...bucketed.map((p) => p.yesProb));
    // When the opposite-outcome line is drawn we need to bracket both
    // halves so the muted line doesn't clip.
    const effectiveLo = settings.bothOutcomes ? Math.min(lo, 1 - hi) : lo;
    const effectiveHi = settings.bothOutcomes ? Math.max(hi, 1 - lo) : hi;
    const pad = Math.max(0.05, (effectiveHi - effectiveLo) * 0.3);
    return {
      yMin: Math.max(0, Math.floor((effectiveLo - pad) * 10) / 10),
      yMax: Math.min(1, Math.ceil((effectiveHi + pad) * 10) / 10),
    };
  }, [bucketed, settings.autoscale, settings.bothOutcomes]);

  const lineColor = displaySide === "YES" ? "oklch(0.55 0.25 270)" : "oklch(0.55 0.22 25)";
  const oppositeColor = displaySide === "YES" ? "oklch(0.55 0.22 25)" : "oklch(0.55 0.25 270)";

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={splitData}
          margin={{ top: 20, right: 5, left: 28, bottom: 5 }}
          onMouseMove={(state) => {
            const ap = (state as { activePayload?: { payload: { t: number } }[]; activeLabel?: number })
              ?.activePayload?.[0]?.payload;
            const label = (state as { activeLabel?: number })?.activeLabel;
            const t = typeof ap?.t === "number" ? ap.t : typeof label === "number" ? label : null;
            if (t !== null) emitHover(t);
          }}
          onMouseLeave={() => emitHover(null)}
        >
          <defs>
            <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={lineColor} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="currentColor"
            strokeOpacity={0.08}
            horizontal={settings.hGrid}
            vertical={settings.vGrid}
          />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickFormatter={(t) => fmtDate(t, span)}
            tickLine={false}
            axisLine={false}
            stroke="currentColor"
            opacity={0.5}
            tick={{ fontSize: 11 }}
            tickMargin={12}
            minTickGap={20}
            hide={!settings.xAxis}
          />
          <YAxis
            orientation="right"
            domain={[yMin, yMax]}
            ticks={Array.from({ length: 6 }, (_, i) => yMin + ((yMax - yMin) * i) / 5)}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tickLine={false}
            axisLine={false}
            stroke="currentColor"
            opacity={0.5}
            tick={{ fontSize: 11 }}
            tickMargin={12}
            width={settings.yAxis ? 52 : 0}
            hide={!settings.yAxis}
          />
          <Tooltip
            cursor={{
              stroke: "currentColor",
              strokeOpacity: 0.3,
              strokeDasharray: "3 3",
            }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as PricePoint;
              const primaryPct = (p.yesProb * 100).toFixed(1);
              const oppositePct = ((1 - p.yesProb) * 100).toFixed(1);
              const oppositeSide = displaySide === "YES" ? "NO" : "YES";
              return (
                <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md space-y-1">
                  <div className="text-muted-foreground text-[10px]">
                    {new Date(p.t).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  <div
                    className="font-mono tabular-nums font-semibold flex items-center gap-1.5"
                    style={{ color: lineColor }}
                  >
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: lineColor }}
                    />
                    {displaySide} {primaryPct}%
                  </div>
                  {settings.bothOutcomes && (
                    <div
                      className="font-mono tabular-nums font-semibold flex items-center gap-1.5"
                      style={{ color: oppositeColor }}
                    >
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: oppositeColor }}
                      />
                      {oppositeSide} {oppositePct}%
                    </div>
                  )}
                </div>
              );
            }}
          />
          {referenceAreas?.map((a, i) => (
            <ReferenceArea
              key={`ra-${i}`}
              x1={a.from}
              x2={a.to}
              fill={a.color ?? "currentColor"}
              fillOpacity={0.06}
              stroke="none"
              label={
                a.label
                  ? {
                      value: a.label,
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: "currentColor",
                      opacity: 0.5,
                    }
                  : undefined
              }
            />
          ))}
          {referenceLines?.map((r, i) => (
            <ReferenceLine
              key={`rl-${i}`}
              x={r.t}
              stroke={r.color ?? "currentColor"}
              strokeOpacity={0.5}
              strokeDasharray={r.strokeDasharray ?? "4 4"}
              label={{
                value: r.label,
                position: "insideTopRight",
                offset: 8,
                fontSize: 10,
                fill: r.color ?? "currentColor",
                opacity: 0.9,
              }}
            />
          ))}
          {/* Opposite outcome past portion — solid line in the
              opposite-side colour (blue ↔ rose). Slightly dimmer than
              the focused-side line so the active outcome reads as
              primary. */}
          {settings.bothOutcomes && (
            <Line
              type="monotone"
              dataKey="oppositePast"
              stroke={oppositeColor}
              strokeWidth={2}
              strokeOpacity={0.55}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: oppositeColor }}
              isAnimationActive={false}
              connectNulls={false}
            />
          )}
          {/* Opposite outcome future portion — dimmed gray to match the
              primary line's hover behaviour. */}
          {settings.bothOutcomes && (
            <Line
              type="monotone"
              dataKey="oppositeFuture"
              stroke="oklch(0.6 0 0)"
              strokeWidth={2}
              strokeOpacity={0.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          )}
          {/* Past portion — primary colour. No animation on hover toggle
              so the line redraws instantly as the cursor moves. */}
          <Line
            type="monotone"
            dataKey="past"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
            isAnimationActive={false}
            connectNulls={false}
          />
          {/* Future portion (only when hovering) — dimmed gray to signal
              "future relative to your cursor". */}
          <Line
            type="monotone"
            dataKey="future"
            stroke="oklch(0.6 0 0)"
            strokeWidth={2}
            strokeOpacity={0.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          {/* Latest-data marker — hidden while hovering so it doesn't
              read as a "current" indicator on top of the dimmed-future
              section. recharts' built-in activeDot handles the highlight
              at the cursor instead. */}
          {last && hoverT === null && (
            <ReferenceDot
              x={last.t}
              y={last.yesProb}
              r={4}
              fill={lineColor}
              stroke="none"
            />
          )}
          {settings.bothOutcomes && last && hoverT === null && (
            <ReferenceDot
              x={last.t}
              y={1 - last.yesProb}
              r={4}
              fill={oppositeColor}
              fillOpacity={0.55}
              stroke="none"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownRowProps {
  label: string;
  target: string; // ISO timestamp
  /** Optional start timestamp for progress-bar fill (now - start) / (target - start). */
  start?: string;
  /** Visual size. */
  size?: "sm" | "md" | "lg";
  /** Color tone. */
  tone?: "default" | "amber" | "blue" | "indigo" | "rose";
}

const TONE_BAR: Record<NonNullable<CountdownRowProps["tone"]>, string> = {
  default: "bg-muted-foreground/30",
  amber: "bg-amber-500/40",
  blue: "bg-blue-500/40",
  indigo: "bg-indigo-500/40",
  rose: "bg-rose-500/40",
};
const TONE_TEXT: Record<NonNullable<CountdownRowProps["tone"]>, string> = {
  default: "text-foreground",
  amber: "text-amber-700 dark:text-amber-300",
  blue: "text-blue-700 dark:text-blue-300",
  indigo: "text-indigo-700 dark:text-indigo-300",
  rose: "text-rose-700 dark:text-rose-300",
};

function format(ms: number): string {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function CountdownRow({
  label,
  target,
  start,
  size = "md",
  tone = "default",
}: CountdownRowProps) {
  // Avoid SSR/CSR hydration drift by rendering "—" until after mount, then
  // ticking once per second.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const targetMs = new Date(target).getTime();
  const startMs = start ? new Date(start).getTime() : null;
  const remaining = now === null ? null : targetMs - now;
  const elapsedPct =
    now !== null && startMs !== null && targetMs > startMs
      ? Math.max(0, Math.min(100, ((now - startMs) / (targetMs - startMs)) * 100))
      : null;

  const sizeText =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span
          className={cn(
            "font-mono font-semibold tabular-nums",
            sizeText,
            TONE_TEXT[tone],
          )}
        >
          {remaining === null ? "—" : format(remaining)}
        </span>
      </div>
      {elapsedPct !== null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full transition-all", TONE_BAR[tone])}
            style={{ width: `${elapsedPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

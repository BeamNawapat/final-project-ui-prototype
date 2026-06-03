"use client";

import { cn } from "@/lib/utils";

interface BracketRowProps {
  label: string;
  probability: number;
  onYes?: () => void;
  onNo?: () => void;
}

export function BracketRow({ label, probability, onYes, onNo }: BracketRowProps) {
  const pct = Math.round(probability * 100);
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="truncate text-foreground/90">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-9 text-right tabular-nums text-xs font-semibold text-muted-foreground">
          {pct}%
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onYes?.();
          }}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
            "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25",
            "dark:text-emerald-300",
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNo?.();
          }}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
            "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25",
            "dark:text-rose-300",
          )}
        >
          No
        </button>
      </div>
    </div>
  );
}

"use client";

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

interface MarketCardFooterProps {
  marketId: string;
  volume: number;
  rightLabel: string;
}

export function MarketCardFooter({ volume, rightLabel }: MarketCardFooterProps) {
  return (
    <div className="flex items-center justify-between pt-3 mt-auto text-xs text-muted-foreground">
      <span className="font-semibold tabular-nums text-foreground/80">
        {formatVolume(volume)} Vol.
      </span>
      <span>{rightLabel}</span>
    </div>
  );
}

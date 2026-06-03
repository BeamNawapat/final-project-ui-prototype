import { cn } from "@/lib/utils";
import type { Market } from "@/lib/types";

interface Props {
  market: Market;
  className?: string;
}

export function InactiveOutcomeList({ market, className }: Props) {
  if (market.type === "BINARY") {
    const yes = market.outcomes[0]?.probability ?? 0.5;
    return (
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
          <span className="font-semibold">Yes</span>
          <span className="tabular-nums">{Math.round(yes * 100)}%</span>
        </div>
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
          <span className="font-semibold">No</span>
          <span className="tabular-nums">{Math.round((1 - yes) * 100)}%</span>
        </div>
      </div>
    );
  }

  const top = [...market.outcomes]
    .map((o, i) => ({ ...o, idx: i }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 2);

  return (
    <div className={cn("divide-y divide-border/60 text-xs text-muted-foreground", className)}>
      {top.map((o) => (
        <div key={o.idx} className="flex items-center justify-between py-1.5">
          <span className="truncate">{o.label}</span>
          <span className="tabular-nums">{Math.round(o.probability * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

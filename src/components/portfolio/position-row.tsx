import { cn } from "@/lib/utils";
import type { PositionMTM } from "@/lib/portfolio";

interface PositionRowProps {
  outcomeLabel: string;
  side: "YES" | "NO";
  mtm: PositionMTM;
}

export function PositionRow({ outcomeLabel, side, mtm }: PositionRowProps) {
  const { shares, cost, mark, value, pnl, status } = mtm;

  const sideTone =
    side === "YES"
      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
      : "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30";

  const pnlTone =
    pnl > 0.005
      ? "text-emerald-600 dark:text-emerald-400"
      : pnl < -0.005
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";

  const pnlSign = pnl >= 0 ? "+" : "";

  // Mark display
  const markLabel =
    status === "won"
      ? "won $1.00"
      : status === "lost"
        ? "lost $0.00"
        : status === "refund"
          ? "refund"
          : `mark ${Math.round(mark * 100)}¢`;

  const markClass =
    status === "won"
      ? "text-emerald-600 dark:text-emerald-400"
      : status === "lost"
        ? "text-rose-500/70"
        : "text-muted-foreground";

  return (
    <div className="grid grid-cols-[64px_1fr_56px_56px_72px_64px] items-center gap-2 py-2 text-xs">
      {/* Side pill */}
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-center font-semibold border text-[10px] uppercase tracking-wide",
          sideTone,
        )}
      >
        {side}
      </span>

      {/* Outcome label */}
      <span className="text-foreground/80 truncate font-medium">{outcomeLabel}</span>

      {/* Shares */}
      <span className="text-right tabular-nums text-muted-foreground font-mono">
        {shares.toFixed(1)}
      </span>

      {/* Avg ¢ */}
      <span className="text-right tabular-nums text-muted-foreground font-mono">
        {Math.round(mtm.cost / Math.max(shares, 0.001) * 100)}¢
      </span>

      {/* Mark */}
      <span className={cn("text-right tabular-nums font-mono text-[11px]", markClass)}>
        {markLabel}
      </span>

      {/* PnL */}
      <span className={cn("text-right tabular-nums font-mono font-semibold", pnlTone)}>
        {pnlSign}${Math.abs(pnl).toFixed(2)}
      </span>
    </div>
  );
}

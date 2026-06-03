import { cn } from "@/lib/utils";
import { CheckCircle2, Trophy, XCircle } from "lucide-react";

interface OutcomeChipProps {
  label: string;
  settlementPriceLabel: string;
  tone?: "yes" | "no" | "neutral";
}

export function OutcomeChip({ label, settlementPriceLabel, tone }: OutcomeChipProps) {
  const inferred: "yes" | "no" | "neutral" =
    tone ??
    (label.toUpperCase() === "YES"
      ? "yes"
      : label.toUpperCase() === "NO"
        ? "no"
        : "neutral");

  const styles = {
    yes: "bg-gradient-to-r from-emerald-500/25 via-emerald-500/18 to-teal-500/10 text-emerald-800 border-emerald-500/40 dark:text-emerald-200 dark:from-emerald-500/30 dark:via-emerald-500/18 dark:to-teal-500/10",
    no: "bg-gradient-to-r from-rose-500/25 via-rose-500/18 to-orange-500/10 text-rose-800 border-rose-500/40 dark:text-rose-200 dark:from-rose-500/30 dark:via-rose-500/18 dark:to-orange-500/10",
    neutral:
      "bg-gradient-to-r from-violet-500/22 via-fuchsia-500/15 to-amber-500/10 text-violet-900 border-violet-500/35 dark:text-violet-100 dark:from-violet-500/30 dark:via-fuchsia-500/18 dark:to-amber-500/10",
  }[inferred];

  const Icon =
    inferred === "yes" ? CheckCircle2 : inferred === "no" ? XCircle : Trophy;

  const iconColor =
    inferred === "yes"
      ? "text-emerald-600 dark:text-emerald-400"
      : inferred === "no"
        ? "text-rose-600 dark:text-rose-400"
        : "text-violet-600 dark:text-violet-300";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium",
        styles,
      )}
    >
      <div className="flex items-center gap-2 font-semibold">
        <Icon className={cn("size-4", iconColor)} />
        <span>{label}</span>
      </div>
      <span className="tabular-nums text-foreground/90">{settlementPriceLabel}</span>
    </div>
  );
}

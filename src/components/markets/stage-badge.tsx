import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MarketStage } from "@/lib/market-stage";

const STYLES: Record<MarketStage, string> = {
  ACTIVE: "hidden",
  CLOSED: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  REPORTING: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
  DISPUTE: "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300",
  DISPUTED: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
  RESOLVED: "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300",
  CANCELLED: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
  PAUSED: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300",
  PENDING: "bg-gray-300/15 text-gray-600 border-gray-300/30",
};

const LABELS: Record<MarketStage, string> = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
  REPORTING: "REPORTING",
  DISPUTE: "DISPUTE",
  DISPUTED: "DISPUTED",
  RESOLVED: "RESOLVED",
  CANCELLED: "CANCELLED",
  PAUSED: "PAUSED",
  PENDING: "PENDING",
};

interface StageBadgeProps {
  stage: MarketStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  if (stage === "ACTIVE") return null;
  return (
    <Badge
      variant="outline"
      className={cn("uppercase tracking-wide text-[10px] px-2 py-0.5", STYLES[stage], className)}
    >
      {LABELS[stage]}
    </Badge>
  );
}

import { Wallet, Coins, TrendingUp, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PortfolioSummaryProps {
  totalValue: number;
  cash: number;
  totalPnl: number;
  positionCount: number;
  mounted: boolean;
}

interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "emerald" | "rose" | "neutral";
}

export function PortfolioSummary({
  totalValue,
  cash,
  totalPnl,
  positionCount,
  mounted,
}: PortfolioSummaryProps) {
  const pnlSign = totalPnl >= 0 ? "+" : "";
  const pnlTone: "emerald" | "rose" | "neutral" =
    totalPnl > 0.005 ? "emerald" : totalPnl < -0.005 ? "rose" : "neutral";

  const stats: StatCard[] = [
    {
      label: "Portfolio value",
      value: mounted ? `$${totalValue.toFixed(2)}` : "—",
      icon: <TrendingUp className="size-3.5" />,
    },
    {
      label: "Cash (USDC)",
      value: mounted ? `$${cash.toFixed(2)}` : "—",
      icon: <Coins className="size-3.5" />,
    },
    {
      label: "Total PnL",
      value: mounted ? `${pnlSign}$${Math.abs(totalPnl).toFixed(2)}` : "—",
      icon: <Wallet className="size-3.5" />,
      tone: pnlTone,
    },
    {
      label: "Markets held",
      value: mounted ? String(positionCount) : "—",
      icon: <LayoutGrid className="size-3.5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="px-4 py-3 gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {s.icon}
            {s.label}
          </div>
          <div
            className={cn(
              "text-2xl font-bold tabular-nums",
              s.tone === "emerald" && "text-emerald-600 dark:text-emerald-400",
              s.tone === "rose" && "text-rose-600 dark:text-rose-400",
            )}
          >
            {s.value}
          </div>
        </Card>
      ))}
    </div>
  );
}

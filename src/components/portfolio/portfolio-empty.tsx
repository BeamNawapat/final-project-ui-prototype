import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortfolioEmptyProps {
  title?: string;
  description?: string;
}

export function PortfolioEmpty({
  title = "Nothing here yet",
  description = "Browse markets and place your first trade to see your positions here.",
}: PortfolioEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="grid place-items-center size-12 rounded-full bg-muted/60">
        <TrendingUp className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground max-w-[260px]">{description}</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/markets">Browse markets</Link>
      </Button>
    </div>
  );
}

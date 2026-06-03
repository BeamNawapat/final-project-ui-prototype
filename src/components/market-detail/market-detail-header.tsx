import type { Market } from "@/lib/types";

interface MarketDetailHeaderProps {
  market: Market;
}

export function MarketDetailHeader({ market }: MarketDetailHeaderProps) {
  return (
    <div className="min-w-0 pb-2">
      <h1 className="text-xl font-semibold leading-snug">{market.question}</h1>
      <p className="text-xs text-muted-foreground mt-0.5">
        {market.productName} · {market.type === "BINARY" ? "Binary" : "Multi-Bracket"}
      </p>
    </div>
  );
}

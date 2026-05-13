import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_MARKETS } from "@/data/markets";
import { deriveStageStyle } from "@/lib/market-stage";

/**
 * UI prototype — markets list. Static MOCK_MARKETS, no backend.
 * Iterate visual design here; port back to main repo once happy.
 */
export default function MarketsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Thai agricultural commodity prediction markets — prototype layout.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_MARKETS.map((m) => {
          const stage = deriveStageStyle({
            status: m.status,
            tradingCutoffTime: m.tradingCutoffTime,
            resolutionTime: m.resolutionTime,
          });
          return (
            <Link key={m.id} href={`/markets/${m.id}`} className="group">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {m.product.category}
                    </div>
                    <Badge variant={stage.variant} className={stage.className}>
                      {stage.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-base line-clamp-2 mt-2">
                    {m.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-xs text-muted-foreground space-y-1">
                  <div>
                    Type:{" "}
                    {m.marketType === "BINARY"
                      ? "Binary"
                      : `Multi-Bracket (${m.outcomeCount} outcomes)`}
                  </div>
                  <div>
                    Vol:{" "}
                    $
                    {m.outcomes
                      .reduce((s, o) => s + o.volumeUsdc, 0)
                      .toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

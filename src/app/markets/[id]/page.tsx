"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { findMarket } from "@/data/markets";
import { deriveStageStyle } from "@/lib/market-stage";
import { cn } from "@/lib/utils";

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const market = findMarket(id);

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <h1 className="text-2xl font-bold">Market not found</h1>
        <Link href="/markets" className="text-primary underline mt-4 inline-block">
          ← Back to Markets
        </Link>
      </div>
    );
  }

  const stage = deriveStageStyle({
    status: market.status,
    tradingCutoffTime: market.tradingCutoffTime,
    resolutionTime: market.resolutionTime,
  });

  const isMulti = market.marketType === "MULTI_BRACKET";

  // Trade form state (mock, no backend)
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [tab, setTab] = useState<"BUY" | "SELL">("BUY");
  const [limitPrice, setLimitPrice] = useState("");
  const [shares, setShares] = useState("");

  const outcome = market.outcomes[selectedOutcome];
  const bestAsk = side === "YES"
    ? outcome.yesOrderbook.asks[0]?.price ?? 0.5
    : outcome.noOrderbook.asks[0]?.price ?? 0.5;
  const bestBid = side === "YES"
    ? outcome.yesOrderbook.bids[0]?.price ?? 0.5
    : outcome.noOrderbook.bids[0]?.price ?? 0.5;
  const effectivePrice = tab === "BUY" ? bestAsk : bestBid;
  const numericShares = parseFloat(shares || "0");
  const total = effectivePrice * numericShares;
  const payout = numericShares; // 1 token = $1 at settlement if winner
  const toWin = tab === "BUY" ? payout - total : total;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Link
        href="/markets"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Markets
      </Link>

      {/* Header */}
      <header className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">
            {market.product.category} · {market.product.productName}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 leading-tight">
            {market.title}
          </h1>
        </div>
        <Badge variant={stage.variant} className={stage.className}>
          {stage.label}
        </Badge>
      </header>

      {/* Layout: binary = single column, multi-bracket = two column */}
      <div
        className={cn(
          "mt-6 grid gap-6",
          isMulti ? "lg:grid-cols-[1fr_360px]" : "max-w-2xl mx-auto",
        )}
      >
        {/* Left column: outcome list (multi-bracket) or summary (binary) */}
        <section className="space-y-2">
          {isMulti && (
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Outcomes
            </h2>
          )}
          {market.outcomes.map((o) => {
            const isSelected = selectedOutcome === o.index;
            const yesAsk = o.yesOrderbook.asks[0]?.price ?? 0.5;
            const noAsk = o.noOrderbook.asks[0]?.price ?? 0.5;
            return (
              <button
                key={o.index}
                onClick={() => setSelectedOutcome(o.index)}
                className={cn(
                  "w-full text-left rounded-lg border bg-card px-4 py-3 transition-all",
                  isSelected
                    ? "border-primary/50 ring-1 ring-primary/30 bg-primary/5"
                    : "hover:bg-muted/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: o.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{o.label}</div>
                    <div className="text-xs text-muted-foreground">
                      ${o.volumeUsdc.toLocaleString()} vol
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold tabular-nums">
                      {Math.round(o.chance * 100)}%
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      chance
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOutcome(o.index);
                        setSide("YES");
                        setTab("BUY");
                      }}
                      className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-1.5 hover:bg-green-500/20 cursor-pointer"
                    >
                      <div className="text-[10px] uppercase tracking-wide text-green-700">
                        Buy Yes
                      </div>
                      <div className="text-sm font-semibold text-green-700 tabular-nums">
                        {(yesAsk * 100).toFixed(1)}¢
                      </div>
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOutcome(o.index);
                        setSide("NO");
                        setTab("BUY");
                      }}
                      className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 hover:bg-red-500/20 cursor-pointer"
                    >
                      <div className="text-[10px] uppercase tracking-wide text-red-700">
                        Buy No
                      </div>
                      <div className="text-sm font-semibold text-red-700 tabular-nums">
                        {(noAsk * 100).toFixed(1)}¢
                      </div>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {/* Right column: sticky trade form */}
        <aside className="lg:sticky lg:top-6 self-start">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: outcome.color }}
                />
                <div className="font-semibold truncate">{outcome.label}</div>
              </div>

              {/* Buy / Sell tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setTab("BUY")}
                  className={cn(
                    "py-2 text-sm font-semibold rounded-md transition-all",
                    tab === "BUY"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTab("SELL")}
                  className={cn(
                    "py-2 text-sm font-semibold rounded-md transition-all",
                    tab === "SELL"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  Sell
                </button>
              </div>

              {/* Yes / No toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSide("YES")}
                  className={cn(
                    "py-3 rounded-md font-semibold border transition-all tabular-nums",
                    side === "YES"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-card border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="text-xs uppercase tracking-wide opacity-80">
                    Yes
                  </div>
                  <div className="text-lg">
                    {(
                      (outcome.yesOrderbook.asks[0]?.price ?? 0.5) * 100
                    ).toFixed(1)}
                    ¢
                  </div>
                </button>
                <button
                  onClick={() => setSide("NO")}
                  className={cn(
                    "py-3 rounded-md font-semibold border transition-all tabular-nums",
                    side === "NO"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-card border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="text-xs uppercase tracking-wide opacity-80">
                    No
                  </div>
                  <div className="text-lg">
                    {(
                      (outcome.noOrderbook.asks[0]?.price ?? 0.5) * 100
                    ).toFixed(1)}
                    ¢
                  </div>
                </button>
              </div>

              {/* Limit price */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Limit price
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() =>
                      setLimitPrice((p) =>
                        Math.max(0, parseFloat(p || "0") - 1).toFixed(1),
                      )
                    }
                    className="h-8 w-8 rounded border hover:bg-muted"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={`${(effectivePrice * 100).toFixed(1)}`}
                    className="text-center tabular-nums"
                  />
                  <button
                    onClick={() =>
                      setLimitPrice((p) =>
                        (parseFloat(p || "0") + 1).toFixed(1),
                      )
                    }
                    className="h-8 w-8 rounded border hover:bg-muted"
                  >
                    +
                  </button>
                  <span className="text-xs text-muted-foreground ml-1">¢</span>
                </div>
              </div>

              {/* Shares */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Shares
                </label>
                <Input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="0"
                  className="text-right tabular-nums mt-1"
                />
                <div className="flex gap-1 mt-2">
                  {[-100, -10, 10, 100, 200].map((d) => (
                    <button
                      key={d}
                      onClick={() =>
                        setShares((p) =>
                          Math.max(0, parseFloat(p || "0") + d).toString(),
                        )
                      }
                      className="flex-1 text-xs rounded border py-1 hover:bg-muted tabular-nums"
                    >
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total / To Win */}
              <div className="space-y-1.5 pt-2 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold tabular-nums">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To win</span>
                  <span className="font-semibold text-green-600 tabular-nums">
                    ${Math.max(0, toWin).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className={cn(
                  "w-full",
                  side === "YES"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700",
                )}
              >
                {tab} {side}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Prototype — orders not submitted to real backend.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

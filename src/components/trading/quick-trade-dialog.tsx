"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useSim } from "@/lib/sim/store";
import { connectWallet, placeOrder } from "@/lib/sim/service";
import type { Market } from "@/lib/types";

interface QuickTradeDialogProps {
  open: boolean;
  market: Market | null;
  outcomeIdx: number;
  side: "YES" | "NO";
  onOpenChange: (open: boolean) => void;
}

export function QuickTradeDialog({
  open,
  market,
  outcomeIdx,
  side,
  onOpenChange,
}: QuickTradeDialogProps) {
  const wallet = useSim((s) => s.wallet);
  const [size, setSize] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSize(10);
  }, [open, market?.id, outcomeIdx, side]);

  const outcome = market?.outcomes[outcomeIdx];
  const price = useMemo(() => {
    if (!outcome) return 0.5;
    return side === "YES" ? outcome.probability : 1 - outcome.probability;
  }, [outcome, side]);
  const sharesOut = price > 0 ? size / price : 0;
  const payoutIfWin = sharesOut;

  if (!market || !outcome) return null;

  const handleSubmit = async () => {
    if (!wallet.connected) {
      await connectWallet();
      return;
    }
    setSubmitting(true);
    try {
      await placeOrder({ marketId: market.id, outcomeIdx, side, size, price });
      onOpenChange(false);
    } catch {
      // toast already raised in service
    } finally {
      setSubmitting(false);
    }
  };

  const sideStyles =
    side === "YES"
      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
      : "bg-rose-500 hover:bg-rose-600 text-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Buy <span className={side === "YES" ? "text-emerald-600" : "text-rose-600"}>{side}</span>
            {" "}— {outcome.label}
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{market.question}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Implied price</div>
              <div className="font-semibold tabular-nums">{(price * 100).toFixed(1)}¢</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Shares</div>
              <div className="font-semibold tabular-nums">{sharesOut.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Payout if win</div>
              <div className="font-semibold tabular-nums text-emerald-600">
                ${payoutIfWin.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="size" className="font-medium">
                Size (USDC)
              </label>
              <span className="text-xs text-muted-foreground">
                Balance: ${wallet.balance.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                id="size"
                type="number"
                min={1}
                max={Math.max(wallet.balance, 1)}
                value={size}
                onChange={(e) => setSize(Number(e.target.value) || 0)}
                className="w-28"
              />
              <Slider
                value={[size]}
                onValueChange={([v]) => setSize(v)}
                max={Math.max(wallet.balance, 100)}
                min={1}
                step={1}
                className="flex-1"
              />
            </div>
            <div className="flex gap-1.5">
              {[10, 25, 50, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSize(v)}
                  className="rounded-md border bg-background px-2 py-0.5 text-xs hover:bg-muted/60"
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {!wallet.connected && (
            <p className="text-xs text-amber-600">
              Wallet not connected — clicking submit will connect first (simulated).
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className={sideStyles}
            onClick={handleSubmit}
            disabled={submitting || size <= 0}
          >
            {submitting
              ? "Placing…"
              : wallet.connected
                ? `Buy ${side} — $${size.toFixed(2)}`
                : "Connect & Buy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

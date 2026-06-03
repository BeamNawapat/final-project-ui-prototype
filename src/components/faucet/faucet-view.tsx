"use client";

import { useState } from "react";
import { Droplets, Coins, Wallet, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSim } from "@/lib/sim/store";
import { connectWallet } from "@/lib/sim/service";

// Mirrors contracts/src/tokens/TestUSDC.sol immutable constants.
const FAUCET_AMOUNT = 10_000; // L14: FAUCET_AMOUNT = 10_000 * 10**DECIMALS
const FAUCET_COOLDOWN_SEC = 3600; // L15: FAUCET_COOLDOWN = 1 hours

export function FaucetView() {
  const wallet = useSim((s) => s.wallet);
  const setBalance = useSim((s) => s.setBalance);
  const [claiming, setClaiming] = useState(false);
  const [lastClaim, setLastClaim] = useState<number | null>(null);

  const now = Date.now();
  const cooldownLeft =
    lastClaim !== null
      ? Math.max(0, FAUCET_COOLDOWN_SEC * 1000 - (now - lastClaim))
      : 0;
  const onCooldown = cooldownLeft > 0;

  async function handleClaim() {
    if (!wallet.connected) {
      await connectWallet();
      return;
    }
    if (onCooldown) {
      toast.error("Faucet on cooldown — try again later");
      return;
    }
    setClaiming(true);
    toast.loading("Claiming TestUSDC…", { id: "faucet" });
    await new Promise((r) => setTimeout(r, 800));
    setBalance(FAUCET_AMOUNT);
    setLastClaim(Date.now());
    toast.success(`+${FAUCET_AMOUNT.toLocaleString()} tUSDC claimed`, {
      id: "faucet",
      duration: 4000,
    });
    setClaiming(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gradient">Faucet</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Claim free TestUSDC to trade on AgriCast prediction markets. Test tokens
          have no real value.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
        {/* Claim card */}
        <Card className="px-6 py-8 gap-5 items-center text-center">
          <div className="grid place-items-center size-16 rounded-full bg-primary/10">
            <Droplets className="size-7 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tabular-nums">
              {FAUCET_AMOUNT.toLocaleString()} tUSDC
            </div>
            <p className="text-xs text-muted-foreground">per claim · 1 hour cooldown</p>
          </div>

          <Button
            className="w-full h-11 gap-2 max-w-xs"
            disabled={claiming || onCooldown}
            onClick={handleClaim}
          >
            {!wallet.connected ? (
              <>
                <Wallet className="size-4" />
                Connect wallet to claim
              </>
            ) : onCooldown ? (
              <>
                <Lock className="size-4" />
                On cooldown
              </>
            ) : (
              <>
                <Coins className="size-4" />
                {claiming ? "Claiming…" : `Claim ${FAUCET_AMOUNT.toLocaleString()} tUSDC`}
              </>
            )}
          </Button>

          {wallet.connected && (
            <p className="text-xs text-muted-foreground tabular-nums">
              Balance: <span className="font-mono text-foreground">${wallet.balance.toFixed(2)}</span>
            </p>
          )}
        </Card>

        {/* Info card */}
        <Card className="px-5 py-5 gap-3">
          <h2 className="font-semibold text-sm">How it works</h2>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">1.</span>
              Connect your wallet to receive tokens.
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">2.</span>
              Claim {FAUCET_AMOUNT.toLocaleString()} tUSDC — once per hour.
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">3.</span>
              Use tUSDC to buy outcome tokens on any market.
            </li>
          </ul>
          <div className="rounded-lg border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground mt-1">
            On-chain: <code className="font-mono text-foreground">TestUSDC.faucet()</code> —
            cooldown-gated, mints a fixed amount to the caller.
          </div>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Droplets, Coins, Wallet, Lock, Fuel } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSim } from "@/lib/sim/store";
import { connectWallet } from "@/lib/sim/service";
import { cn } from "@/lib/utils";

// Mirrors contracts/src/tokens/TestUSDC.sol immutable constants.
const TUSDC_AMOUNT = 10_000; // FAUCET_AMOUNT = 10_000 * 10**DECIMALS
const TUSDC_COOLDOWN_SEC = 3600; // FAUCET_COOLDOWN = 1 hours
// Native ETH faucet — gas + reporter staking (AgriOracleV2.registerReporter is payable).
const ETH_AMOUNT = 1; // 1 ETH per claim
const ETH_COOLDOWN_SEC = 3600;

export function FaucetView() {
  const wallet = useSim((s) => s.wallet);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gradient">Faucet</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Claim free test tokens to use AgriCast. <strong>ETH</strong> covers gas and
          reporter staking; <strong>tUSDC</strong> is the trading collateral. Test
          tokens have no real value.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FaucetCard
          token="ETH"
          subtitle="gas + reporter staking"
          amount={ETH_AMOUNT}
          unit="ETH"
          cooldownSec={ETH_COOLDOWN_SEC}
          icon={<Fuel className="size-7 text-indigo-500" />}
          accent="bg-indigo-500/10"
          contractNote="AgriOracleV2.registerReporter() is payable — needs native ETH."
          connected={wallet.connected}
        />
        <FaucetCard
          token="tUSDC"
          subtitle="trading collateral"
          amount={TUSDC_AMOUNT}
          unit="tUSDC"
          cooldownSec={TUSDC_COOLDOWN_SEC}
          icon={<Droplets className="size-7 text-primary" />}
          accent="bg-primary/10"
          contractNote="TestUSDC.faucet() — cooldown-gated, mints a fixed amount to the caller."
          connected={wallet.connected}
        />
      </div>

      {/* How it works */}
      <Card className="px-5 py-5 gap-3">
        <h2 className="font-semibold text-sm">How it works</h2>
        <ol className="space-y-2 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary font-bold">1.</span>
            Connect your wallet to receive tokens.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">2.</span>
            Claim ETH for gas (and reporter staking) + tUSDC for trading — each once per hour.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">3.</span>
            Use tUSDC to buy outcome tokens on any market.
          </li>
        </ol>
      </Card>
    </div>
  );
}

function FaucetCard({
  token,
  subtitle,
  amount,
  unit,
  cooldownSec,
  icon,
  accent,
  contractNote,
  connected,
}: {
  token: string;
  subtitle: string;
  amount: number;
  unit: string;
  cooldownSec: number;
  icon: React.ReactNode;
  accent: string;
  contractNote: string;
  connected: boolean;
}) {
  const setBalance = useSim((s) => s.setBalance);
  const [claiming, setClaiming] = useState(false);
  const [lastClaim, setLastClaim] = useState<number | null>(null);

  const cooldownLeft =
    lastClaim !== null ? Math.max(0, cooldownSec * 1000 - (Date.now() - lastClaim)) : 0;
  const onCooldown = cooldownLeft > 0;
  const toastId = `faucet-${token}`;

  async function handleClaim() {
    if (!connected) {
      await connectWallet();
      return;
    }
    if (onCooldown) {
      toast.error(`${token} faucet on cooldown — try again later`);
      return;
    }
    setClaiming(true);
    toast.loading(`Claiming ${token}…`, { id: toastId });
    await new Promise((r) => setTimeout(r, 800));
    // tUSDC feeds the trading balance; ETH is gas/staking only (no sim slot).
    if (unit === "tUSDC") setBalance(amount);
    setLastClaim(Date.now());
    toast.success(`+${amount.toLocaleString()} ${unit} claimed`, {
      id: toastId,
      duration: 4000,
    });
    setClaiming(false);
  }

  return (
    <Card className="px-6 py-8 gap-5 items-center text-center">
      <div className={cn("grid place-items-center size-16 rounded-full", accent)}>{icon}</div>
      <div className="space-y-1">
        <div className="text-3xl font-bold tabular-nums">
          {amount.toLocaleString()} {unit}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle} · 1 hour cooldown</p>
      </div>

      <Button
        className="w-full h-11 gap-2 max-w-xs"
        disabled={claiming || onCooldown}
        onClick={handleClaim}
      >
        {!connected ? (
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
            {claiming ? "Claiming…" : `Claim ${amount.toLocaleString()} ${unit}`}
          </>
        )}
      </Button>

      <div className="rounded-lg border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground w-full">
        <code className="font-mono text-foreground">{contractNote}</code>
      </div>
    </Card>
  );
}

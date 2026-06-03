"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SimulatedTxReceipt } from "@/components/admin/simulated-tx-receipt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminMintTestUSDC } from "@/lib/sim/service";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10_000_000;

// Pulled directly from contracts/src/tokens/TestUSDC.sol (immutable constants).
const FAUCET_COOLDOWN_SEC = 3600; // L15: `uint256 public constant FAUCET_COOLDOWN = 1 hours;`
const FAUCET_AMOUNT_TUSDC = 10_000; // L14: `uint256 public constant FAUCET_AMOUNT = 10_000 * 10**DECIMALS;`
const DECIMALS = 6;

function isValidAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function fmtCooldown(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function AdminFaucetPage() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(1000);

  const addrError = to.length > 0 && !isValidAddress(to);
  const amountError = amount < MIN_AMOUNT;

  return (
    <>
      <AdminPageHeader
        title="Faucet"
        description="Mint TestUSDC for testing. Public faucet constants are read directly from the on-chain contract."
      />

      {/* Mint TestUSDC — admin path (bypasses cooldown) */}
      <Card className="px-5 py-5 gap-3">
        <h2 className="font-semibold text-sm">Mint TestUSDC (admin)</h2>
        <p className="text-xs text-muted-foreground">
          Calls <code className="font-mono">TestUSDC.mint(to, amount)</code> — gated{" "}
          <code className="font-mono">onlyOwner</code>, <strong>bypasses the public faucet
          cooldown</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <label className="text-sm space-y-1 md:col-span-2">
            <span className="block">Recipient address</span>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
              placeholder="0x…"
              className={addrError ? "border-destructive" : undefined}
            />
            {addrError && (
              <span className="text-xs text-destructive">
                Must be a 0x-prefixed 40-hex-char address.
              </span>
            )}
          </label>
          <label className="text-sm space-y-1">
            <span className="block">Amount (USDC)</span>
            <Input
              type="number"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step="1"
              value={amount}
              onChange={(e) =>
                setAmount(clamp(Math.floor(Number(e.target.value)), MIN_AMOUNT, MAX_AMOUNT))
              }
              onBlur={() => setAmount((a) => clamp(a, MIN_AMOUNT, MAX_AMOUNT))}
              className={amountError ? "border-destructive" : undefined}
            />
            {amountError && (
              <span className="text-xs text-destructive">
                Amount must be ≥ {MIN_AMOUNT} USDC.
              </span>
            )}
          </label>
        </div>
        <Button
          disabled={!isValidAddress(to) || amountError}
          onClick={() => adminMintTestUSDC(to, amount)}
        >
          Mint
        </Button>
        <SimulatedTxReceipt
          contract="TestUSDC"
          fn="mint"
          args={[
            { name: "to", value: to || "<address>" },
            { name: "amount", value: `${amount} * 10**${DECIMALS}` },
          ]}
          note="onlyOwner — bypasses cooldown."
        />
      </Card>

      {/* Public faucet — read-only constants */}
      <Card className="px-5 py-5 gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Public faucet constants</h2>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Lock className="size-3" /> immutable
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="FAUCET_COOLDOWN"
            value={`${fmtCooldown(FAUCET_COOLDOWN_SEC)} (${FAUCET_COOLDOWN_SEC}s)`}
            source="TestUSDC.sol:15"
          />
          <Stat
            label="FAUCET_AMOUNT"
            value={`${FAUCET_AMOUNT_TUSDC.toLocaleString()} tUSDC`}
            source="TestUSDC.sol:14"
          />
        </div>

        <div className="rounded-lg border bg-muted/20 px-3 py-2 text-xs space-y-1">
          <div className="font-semibold text-foreground">Three contract entry points:</div>
          <ul className="space-y-0.5 list-disc list-inside text-muted-foreground">
            <li>
              <code className="font-mono text-foreground">faucet()</code> — public, cooldown-gated,
              mints fixed FAUCET_AMOUNT to <code className="font-mono">msg.sender</code>
            </li>
            <li>
              <code className="font-mono text-foreground">faucetTo(to, amount)</code> — public,
              cooldown-gated against <code className="font-mono">to</code>, custom amount
            </li>
            <li>
              <code className="font-mono text-foreground">mint(to, amount)</code> —{" "}
              <span className="text-foreground">onlyOwner</span>, no cooldown (the form above)
            </li>
          </ul>
        </div>

      </Card>
    </>
  );
}

function Stat({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        {label}
      </div>
      <div className="font-mono tabular-nums text-sm font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono">{source}</div>
    </div>
  );
}

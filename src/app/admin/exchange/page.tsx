"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SimulatedTxReceipt } from "@/components/admin/simulated-tx-receipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSim } from "@/lib/sim/store";
import { adminRegisterTokens, adminSetOperator } from "@/lib/sim/service";

function isValidAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export default function AdminExchangePage() {
  const cfg = useSim((s) => s.exchangeConfig);
  const [opAddr, setOpAddr] = useState("");
  const [tokenIds, setTokenIds] = useState("");

  const registeredCount = Object.entries(cfg.registeredTokens).filter(
    ([, v]) => v,
  ).length;

  return (
    <>
      <AdminPageHeader
        title="Exchange"
        description="On-chain admin paths for AgriExchange. Operator allowlist + outcome-token registry."
      />

      {/* Operators — real + useful */}
      <Card className="px-5 py-5 gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Operators</h2>
            <p className="text-xs text-muted-foreground">
              Addresses allowed to call <code className="font-mono">fillOrder</code> /{" "}
              <code className="font-mono">matchOrders</code> (the off-chain matcher worker).
              On-chain mapping: <code className="font-mono">operators(address) → bool</code>.
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300 text-[10px]"
            title="Contract function exists but no backend route wraps it — admin must call via wallet directly."
          >
            not wired
          </Badge>
        </div>

        <ul className="divide-y divide-border/60 text-sm">
          {Object.entries(cfg.operators).map(([addr, status]) => (
            <li key={addr} className="flex items-center justify-between py-2">
              <span className="font-mono text-xs">{addr}</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    status
                      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {status ? "enabled" : "disabled"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adminSetOperator(addr, !status)}
                >
                  {status ? "Disable" : "Enable"}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Input
            placeholder="0x… new operator"
            value={opAddr}
            onChange={(e) => setOpAddr(e.target.value.trim())}
            className="flex-1 font-mono text-xs"
          />
          <Button
            disabled={!isValidAddress(opAddr)}
            onClick={() => {
              adminSetOperator(opAddr, true);
              setOpAddr("");
            }}
          >
            Add operator
          </Button>
        </div>
        <SimulatedTxReceipt
          contract="AgriExchange"
          fn="setOperator"
          args={[
            { name: "operator", value: opAddr || "<address>" },
            { name: "status", value: "true" },
          ]}
        />
      </Card>

      {/* Token registry — real but mostly auto-handled */}
      <Card className="px-5 py-5 gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Outcome-token registry</h2>
            <p className="text-xs text-muted-foreground">
              Whitelist of ERC-1155 outcome token IDs valid for order matching. The backend
              already calls <code className="font-mono">registerTokens(ids, true)</code>{" "}
              automatically on every new market (
              <code className="font-mono">backend/src/services/market.ts:621</code>) — manual
              admin use is only for backfill / emergency.
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300 text-[10px]"
            title="Auto-handled by market creation flow. Manual override available via direct contract call."
          >
            auto
          </Badge>
        </div>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
          Currently registered (in sim store):{" "}
          <span className="font-mono tabular-nums font-semibold">{registeredCount}</span> token id(s)
        </div>

        <p className="text-xs font-medium">Manual override (comma-separated tokenIds)</p>
        <Input
          placeholder="123, 456, 789"
          value={tokenIds}
          onChange={(e) => setTokenIds(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const ids = tokenIds.split(",").map((s) => s.trim()).filter(Boolean);
              if (ids.length) adminRegisterTokens(ids, true);
            }}
          >
            Register
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const ids = tokenIds.split(",").map((s) => s.trim()).filter(Boolean);
              if (ids.length) adminRegisterTokens(ids, false);
            }}
          >
            <Trash2 className="size-4" />
            Unregister
          </Button>
        </div>
        <SimulatedTxReceipt
          contract="AgriExchange"
          fn="registerTokens"
          args={[
            { name: "tokenIds", value: `[${tokenIds || "…"}]` },
            { name: "status", value: "true" },
          ]}
        />
      </Card>

      {/* Fees — read-only fact panel, no admin form */}
      <Card className="px-5 py-5 gap-2">
        <h2 className="font-semibold text-sm">Fees</h2>
        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs space-y-1.5">
          <p>
            <strong className="text-foreground">No protocol fee is charged today.</strong> The
            frontend signs every order with{" "}
            <code className="font-mono">feeRateBps: 0</code> (
            <code className="font-mono">frontend/src/web3/hooks/use-order-signing.ts:67</code>),
            so the per-order fee transfer at{" "}
            <code className="font-mono">AgriExchange.sol:337/358/420</code> always pays{" "}
            <code className="font-mono">0</code>.
          </p>
          <p className="text-muted-foreground">
            The contract <em>does</em> have <code className="font-mono">setFeeCollector(address)</code>{" "}
            and a <code className="font-mono">MAX_FEE_RATE_BPS = 500</code> ceiling (5%), but
            until traders sign orders with non-zero <code className="font-mono">feeRateBps</code>,
            the collector address is decorative — no revenue flows. No admin form here on
            purpose.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Current fee collector on-chain: <code className="font-mono">{cfg.feeCollector}</code>
        </div>
      </Card>
    </>
  );
}

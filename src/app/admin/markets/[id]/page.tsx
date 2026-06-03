"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Snowflake,
  AlertTriangle,
  Siren,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GapBanner } from "@/components/admin/gap-banner";
import { SimulatedTxReceipt } from "@/components/admin/simulated-tx-receipt";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSim } from "@/lib/sim/store";
import { deriveMarketStage, getStageStyle } from "@/lib/market-stage";
import {
  adminFreezeMarket,
  adminResolveDispute,
  adminResolveMarket,
  adminSetQuestionDispute,
  adminUnfreezeMarket,
} from "@/lib/sim/service";

export default function AdminMarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const market = useSim((s) => s.markets.find((m) => m.id === id));
  const perQuestion = useSim((s) => s.oracleParams.perQuestion[id]);

  const [confirm, setConfirm] = useState<null | "resolve" | "freeze" | "unfreeze" | "emergency">(null);
  const [loading, setLoading] = useState(false);

  const [disputeUphold, setDisputeUphold] = useState<"uphold" | "flip">("uphold");
  const [perQDispute, setPerQDispute] = useState(perQuestion ?? 300);

  if (!market) {
    return (
      <>
        <AdminPageHeader title="Not found" />
        <Button asChild variant="outline">
          <Link href="/admin/markets">
            <ArrowLeft className="size-4" />
            Back to markets
          </Link>
        </Button>
      </>
    );
  }

  const stage = deriveMarketStage(market);
  const style = getStageStyle(stage);

  async function run(action: () => Promise<unknown>) {
    setLoading(true);
    try {
      await action();
      setConfirm(null);
    } finally {
      setLoading(false);
    }
  }

  const canResolve =
    market.status === "ACTIVE" && new Date(market.resolutionTime).getTime() < Date.now();
  const canOverride = market.status === "DISPUTED";

  return (
    <>
      {/* Breadcrumb (top-left) */}
      <Link
        href="/admin/markets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to markets
      </Link>

      <AdminPageHeader
        title={market.question}
        description={`${market.productName} · ${market.type === "BINARY" ? "Binary" : "Multi-Bracket"} · ID ${market.id}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canResolve && (
              <Button size="sm" onClick={() => setConfirm("resolve")}>
                Resolve
              </Button>
            )}
            {canOverride && (
              <Button
                size="sm"
                variant="outline"
                className="bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-300 gap-1"
                onClick={() => setConfirm("resolve")}
                title="AgriOracleV2.resolveDispute()"
              >
                <AlertTriangle className="size-3.5" />
                Override dispute
              </Button>
            )}
            {market.status === "DISPUTED" && (
              <Button
                size="sm"
                variant="outline"
                className="bg-rose-500/10 text-rose-700 border-rose-500/30 hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-300 gap-1"
                onClick={() => setConfirm("emergency")}
                title="AgriOracleV2.emergencyResolve(qid, payouts[])"
              >
                <Siren className="size-3.5" />
                Emergency
              </Button>
            )}
            {!market.isFrozen ? (
              <Button
                size="sm"
                variant="outline"
                className="bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-700 dark:text-blue-300 gap-1"
                onClick={() => setConfirm("freeze")}
                title="EscrowVault.freezeMarket(questionId)"
              >
                <Snowflake className="size-3.5" />
                Freeze
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-700 dark:text-blue-300 gap-1 ring-1 ring-blue-500/40"
                onClick={() => setConfirm("unfreeze")}
                title="EscrowVault.unfreezeMarket(questionId)"
              >
                <Snowflake className="size-3.5" />
                Unfreeze
              </Button>
            )}
          </div>
        }
      />

      {/* Status bar — grid of stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCell
          label="Stage"
          value={
            <Badge variant="outline" className={style.className}>
              {style.label}
            </Badge>
          }
        />
        <StatCell
          label="Volume"
          value={
            <span className="font-mono font-semibold tabular-nums">
              ${market.volume.toLocaleString()}
            </span>
          }
        />
        <StatCell
          label="Resolution"
          value={
            <span className="font-mono tabular-nums text-xs">
              {new Date(market.resolutionTime).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          }
        />
        <StatCell
          label="Escrow"
          value={
            market.isFrozen ? (
              <Badge
                variant="outline"
                className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
              >
                <Snowflake className="size-3" /> Frozen
              </Badge>
            ) : (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Open
              </span>
            )
          }
        />
      </div>


      {/* Dispute override panel */}
      {market.status === "DISPUTED" && (
        <Card className="px-5 py-5 gap-3">
          <h2 className="font-semibold text-sm">Resolve dispute</h2>
          {market.proposedOutcome && (
            <p className="text-xs text-muted-foreground">
              Proposed by oracle: <span className="font-medium">{market.proposedOutcome.label}</span> @{" "}
              {market.proposedOutcome.settlementPriceLabel}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant={disputeUphold === "uphold" ? "default" : "outline"}
              size="sm"
              onClick={() => setDisputeUphold("uphold")}
            >
              Uphold reporter
            </Button>
            <Button
              variant={disputeUphold === "flip" ? "default" : "outline"}
              size="sm"
              onClick={() => setDisputeUphold("flip")}
            >
              Flip outcome
            </Button>
          </div>
          <SimulatedTxReceipt
            contract="AgriOracleV2"
            fn="resolveDispute"
            args={[
              { name: "questionId", value: `keccak256("${market.id}")` },
              { name: "uphold", value: String(disputeUphold === "uphold") },
            ]}
          />
          <Button
            disabled={loading}
            onClick={() =>
              run(() => adminResolveDispute(market.id, disputeUphold === "uphold"))
            }
          >
            Submit dispute resolution
          </Button>
        </Card>
      )}

      {/* Per-question dispute period */}
      <Card className="px-5 py-5 gap-3">
        <h2 className="font-semibold text-sm">Per-question dispute period</h2>
        <p className="text-xs text-muted-foreground">
          Override the global default just for this market.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm space-y-1">
            <span className="block">Seconds</span>
            <Input
              type="number"
              min={1}
              value={perQDispute}
              onChange={(e) => setPerQDispute(Math.max(1, Number(e.target.value) || 1))}
              className="w-32"
            />
          </label>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => run(() => adminSetQuestionDispute(market.id, perQDispute))}
          >
            Apply
          </Button>
          <div className="ml-auto flex items-center gap-2 h-9 rounded-md border bg-muted/30 px-3 text-xs">
            <span className="text-muted-foreground">Current override</span>
            <span className="font-mono tabular-nums font-semibold">
              {perQuestion != null ? `${perQuestion}s` : "—"}
            </span>
          </div>
        </div>
        <SimulatedTxReceipt
          contract="AgriOracleV2"
          fn="setQuestionDisputePeriod"
          args={[
            { name: "questionId", value: `keccak256("${market.id}")` },
            { name: "period", value: perQDispute },
          ]}
        />
      </Card>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirm === "resolve"}
        title="Resolve market"
        description="Oracle settles the question. Final on-chain."
        confirmLabel="Resolve"
        loading={loading}
        onOpenChange={(o) => !o && setConfirm(null)}
        onConfirm={() => run(() => adminResolveMarket(market.id))}
      >
        <SimulatedTxReceipt
          contract="AgriMarketFactoryV2 / AgriOracleV2"
          fn="settle"
          args={[{ name: "marketId", value: `"${market.id}"` }]}
          note="Backend: POST /api/admin/markets/:id/resolve"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === "freeze"}
        title="Freeze withdrawals"
        description="Locks the EscrowVault for this market. Trading not affected."
        confirmLabel="Freeze"
        loading={loading}
        onOpenChange={(o) => !o && setConfirm(null)}
        onConfirm={() => run(() => adminFreezeMarket(market.id))}
      >
        <SimulatedTxReceipt
          contract="EscrowVault"
          fn="freezeMarket"
          args={[{ name: "questionId", value: `keccak256("${market.id}")` }]}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === "unfreeze"}
        title="Unfreeze withdrawals"
        confirmLabel="Unfreeze"
        loading={loading}
        onOpenChange={(o) => !o && setConfirm(null)}
        onConfirm={() => run(() => adminUnfreezeMarket(market.id))}
      >
        <SimulatedTxReceipt
          contract="EscrowVault"
          fn="unfreezeMarket"
          args={[{ name: "questionId", value: `keccak256("${market.id}")` }]}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === "emergency"}
        title="Emergency resolve"
        description="Owner-only escape hatch for stuck or compromised markets."
        confirmLabel="Emergency resolve"
        destructive
        loading={loading}
        onOpenChange={(o) => !o && setConfirm(null)}
        onConfirm={() => run(() => adminResolveDispute(market.id, true))}
      >
        <SimulatedTxReceipt
          contract="AgriOracleV2"
          fn="emergencyResolve"
          args={[
            { name: "questionId", value: `keccak256("${market.id}")` },
            { name: "payouts[]", value: "<admin-specified array>" },
          ]}
          note="Owner-only. No backend route wraps this — UI calls the contract directly via wallet when wired."
        />
        <GapBanner>
          No backend endpoint wraps <code className="font-mono">emergencyResolve</code> yet.
          Production admin must invoke the contract directly via wallet (e.g. Etherscan write
          tab) until a `/admin/markets/:id/emergency-resolve` route is added.
        </GapBanner>
      </ConfirmDialog>
    </>
  );
}

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="px-3 py-2 gap-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </Card>
  );
}

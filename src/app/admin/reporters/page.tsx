"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSim } from "@/lib/sim/store";

function truncate(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

const ACTIVE_THRESHOLD_ETH = 0.5;
const SLASH_AMOUNT_ETH = 0.05; // AgriOracleV2.sol:35 — `uint256 public constant SLASH_AMOUNT = 0.05 ether;`

export default function AdminReportersPage() {
  const reporters = useSim((s) => s.reporters);

  const totalStaked = reporters.reduce((acc, r) => acc + r.stake, 0);
  const activeCount = reporters.filter((r) => r.stake >= ACTIVE_THRESHOLD_ETH).length;

  return (
    <>
      <AdminPageHeader
        title="Reporters"
        description="Oracle reporter registry. Admin has NO direct add / remove / slash powers — registration is self-service and slashing is autonomous."
      />

      {/* Summary */}
      <Card className="px-4 py-4 gap-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Total reporters" value={String(reporters.length)} />
          <Stat label="Active" value={String(activeCount)} />
          <Stat label="Total staked" value={`${totalStaked.toFixed(4)} ETH`} />
          <Stat label="Active threshold" value={`${ACTIVE_THRESHOLD_ETH} ETH`} />
        </div>
      </Card>

      {/* Reporter table — read only */}
      <Card className="px-4 py-4 gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Reporters ({reporters.length})</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            GET /api/oracle/reporters
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <th className="text-left py-2 px-2">Address</th>
                <th className="text-right py-2 px-2">Stake (ETH)</th>
                <th className="text-right py-2 px-2">Reports</th>
                <th className="text-right py-2 px-2">Accuracy</th>
                <th className="text-right py-2 px-2">Slashed</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reporters.map((r) => {
                const belowThreshold = r.stake < ACTIVE_THRESHOLD_ETH;
                return (
                  <tr key={r.address} className="border-b last:border-0">
                    <td className="py-2 px-2 font-mono text-xs">{truncate(r.address)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {r.stake.toFixed(4)}
                      {belowThreshold && (
                        <span className="ml-1 text-[10px] text-rose-600 dark:text-rose-400">
                          ⚠ inactive
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {r.accurateReports}/{r.totalReports}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {(r.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.slashes}×</td>
                    <td className="py-2 px-2">
                      <Badge
                        variant="outline"
                        className={
                          r.status === "active" && !belowThreshold
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
                            : r.status === "paused" || belowThreshold
                              ? "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300"
                              : "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300"
                        }
                      >
                        {belowThreshold ? "inactive" : r.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* How it works — facts only, no fake actions */}
      <Card className="px-5 py-5 gap-3">
        <h2 className="font-semibold text-sm">How the registry works</h2>

        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <Fact label="Registration">
            <strong className="text-foreground">Self-service.</strong> Anyone can call{" "}
            <code className="font-mono">AgriOracleV2.registerReporter()</code> (payable, L121) and
            send ETH as stake. Admin does NOT add reporters.
          </Fact>
          <Fact label="Unregistration">
            <strong className="text-foreground">Self-service.</strong> The reporter calls{" "}
            <code className="font-mono">unregisterReporter()</code> (L162). Admin cannot remove
            a reporter.
          </Fact>
          <Fact label="Active threshold">
            Reporter is "inactive" when stake drops below{" "}
            <code className="font-mono">{ACTIVE_THRESHOLD_ETH} ETH</code>. They stop receiving
            settlement rewards until they top up.
          </Fact>
          <Fact label="Slashing — autonomous">
            <strong className="text-foreground">No admin trigger.</strong> Slash runs
            automatically inside <code className="font-mono">settleReports()</code> (L299–302).
            Each inaccurate report deducts exactly{" "}
            <code className="font-mono">SLASH_AMOUNT = {SLASH_AMOUNT_ETH} ETH</code> (L35) from
            the reporter's stake and emits{" "}
            <code className="font-mono">ReporterSlashed(rep, questionId, amount)</code>.
          </Fact>
          <Fact label="Rewards">
            Accurate reporters share the reward pool on settlement (also inside{" "}
            <code className="font-mono">settleReports()</code>). Not an admin action.
          </Fact>
        </div>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200 dark:bg-emerald-500/15 space-y-1">
          <div className="font-semibold">Data is fully on-chain — no admin endpoint needed.</div>
          <p>
            The whole registry is queryable directly from{" "}
            <code className="font-mono">AgriOracleV2</code> via{" "}
            <code className="font-mono">getReporterInfo(addr)</code> (L501),{" "}
            <code className="font-mono">getReporterCount()</code> (L530), and the auto-getter
            on the <code className="font-mono">reporters</code> mapping. Historical activity
            comes from <code className="font-mono">ReporterRegistered</code> +{" "}
            <code className="font-mono">ReporterSlashed</code> events. The backend route{" "}
            <code className="font-mono">GET /api/oracle/reporters</code> is just a pass-through
            cache (<code className="font-mono">oracle-dashboard.ts:141, :433</code>).
          </p>
          <p>
            All <strong>writes</strong> are either self-service
            (<code className="font-mono">registerReporter</code> /{" "}
            <code className="font-mono">unregisterReporter</code>) or autonomous (slash inside{" "}
            <code className="font-mono">settleReports</code>). No admin write path exists —
            and that's the design.
          </p>
        </div>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-3 py-2 gap-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="font-mono tabular-nums text-sm font-semibold">{value}</div>
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 w-32 shrink-0 pt-0.5">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

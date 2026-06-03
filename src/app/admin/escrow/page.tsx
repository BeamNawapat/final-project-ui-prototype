"use client";

import { useState } from "react";
import { Snowflake } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SimulatedTxReceipt } from "@/components/admin/simulated-tx-receipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSim } from "@/lib/sim/store";
import { adminFreezeMarket, adminSetTimelock, adminUnfreezeMarket } from "@/lib/sim/service";

export default function AdminEscrowPage() {
  const cfg = useSim((s) => s.escrowConfig);
  const markets = useSim((s) => s.markets);
  const [timelock, setTimelock] = useState(cfg.timelock);

  return (
    <>
      <AdminPageHeader
        title="Escrow"
        description="Withdrawal timelock + per-market freeze toggle."
      />

      <Card className="px-5 py-5 gap-3">
        <h2 className="font-semibold text-sm">Withdrawal timelock</h2>
        <p className="text-xs text-muted-foreground">
          Currently {cfg.timelock.toLocaleString()}s ({(cfg.timelock / 3600).toFixed(1)}h).
        </p>
        <div className="flex items-end gap-2">
          <label className="text-sm space-y-1">
            <span className="block">Seconds</span>
            <Input
              type="number"
              value={timelock}
              onChange={(e) => setTimelock(Number(e.target.value) || 0)}
              className="w-32"
            />
          </label>
          <Button onClick={() => adminSetTimelock(timelock)}>Apply</Button>
        </div>
        <SimulatedTxReceipt
          contract="EscrowVault"
          fn="setTimelockDuration"
          args={[{ name: "newDuration", value: timelock }]}
        />
      </Card>

      <Card className="px-4 py-4 gap-3">
        <h2 className="font-semibold text-sm">Freeze markets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <th className="text-left py-2 px-2">Market</th>
                <th className="text-left py-2 px-2">State</th>
                <th className="text-right py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2 px-2 w-full">
                    <div className="line-clamp-1">{m.question}</div>
                  </td>
                  <td className="py-2 px-2">
                    {m.isFrozen ? (
                      <Badge
                        variant="outline"
                        className="bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-300"
                      >
                        <Snowflake className="size-3" /> Frozen
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
                      >
                        Open
                      </Badge>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        m.isFrozen ? adminUnfreezeMarket(m.id) : adminFreezeMarket(m.id)
                      }
                    >
                      {m.isFrozen ? "Unfreeze" : "Freeze"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

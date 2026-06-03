"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSim } from "@/lib/sim/store";
import { deriveMarketStage, getStageStyle } from "@/lib/market-stage";
import { adminResolveMarket } from "@/lib/sim/service";

export default function AdminMarketsPage() {
  const markets = useSim((s) => s.markets);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filtered = markets.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      if (!m.question.toLowerCase().includes(q) && !m.productName.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (typeFilter !== "ALL" && m.type !== typeFilter) return false;
    if (stageFilter !== "ALL" && deriveMarketStage(m) !== stageFilter) return false;
    return true;
  });

  return (
    <>
      <AdminPageHeader
        title="Markets"
        description="All markets across every lifecycle stage. Filter, inspect, resolve."
        actions={
          <Button asChild>
            <Link href="/admin/markets/create" className="gap-1.5">
              <Plus className="size-4" />
              Create market
            </Link>
          </Button>
        }
      />

      <Card className="px-4 py-4 gap-3">
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Search by question or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All stages</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="REPORTING">Reporting</SelectItem>
              <SelectItem value="DISPUTE">Dispute window</SelectItem>
              <SelectItem value="DISPUTED">Disputed</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="BINARY">Binary</SelectItem>
              <SelectItem value="MULTI_BRACKET">Multi-Bracket</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <th className="text-left font-medium py-2 px-2">Product</th>
                <th className="text-left font-medium py-2 px-2">Question</th>
                <th className="text-left font-medium py-2 px-2">Type</th>
                <th className="text-left font-medium py-2 px-2">Stage</th>
                <th className="text-right font-medium py-2 px-2">Vol.</th>
                <th className="text-right font-medium py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const stage = deriveMarketStage(m);
                const style = getStageStyle(stage);
                const dueForResolve =
                  m.status === "ACTIVE" && new Date(m.resolutionTime).getTime() < Date.now();
                return (
                  <tr
                    key={m.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2 px-2 font-medium">{m.productName}</td>
                    <td className="py-2 px-2 max-w-md">
                      <Link
                        href={`/admin/markets/${m.id}`}
                        className="hover:underline line-clamp-1"
                      >
                        {m.question}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {m.type === "BINARY" ? "Binary" : "Multi-Bracket"}
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className={`text-[10px] ${style.className}`}>
                        {style.label}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-xs">
                      ${Math.round(m.volume / 1000)}K
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        {dueForResolve && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adminResolveMarket(m.id)}
                          >
                            Resolve
                          </Button>
                        )}
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/markets/${m.id}`}>Manage</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                    No markets match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

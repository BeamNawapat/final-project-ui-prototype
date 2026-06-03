"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSim } from "@/lib/sim/store";
import type { FilterState } from "@/lib/types";

// CANCELLED intentionally omitted — terminal post-mortem stage with no
// trader action. View cancelled markets via /admin. PENDING IS visible
// so users can browse upcoming markets and subscribe to the open event.
const STAGE_OPTIONS: { value: FilterState["stage"]; label: string }[] = [
  { value: "ALL", label: "All stages" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
  { value: "REPORTING", label: "Reporting" },
  { value: "DISPUTE", label: "Dispute window" },
  { value: "DISPUTED", label: "Disputed" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "PAUSED", label: "Paused" },
];

const TYPE_OPTIONS: { value: FilterState["type"]; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "BINARY", label: "Binary" },
  { value: "MULTI_BRACKET", label: "Multi-Bracket" },
];

export function MarketsPageHeader() {
  const filters = useSim((s) => s.filters);
  const setFilters = useSim((s) => s.setFilters);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gradient">Markets</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Trade outcome tokens on Thai agricultural commodity prices. Each market
          settles on-chain via the AgriCast decentralized oracle once trading closes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search markets…"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <Select
            value={filters.stage}
            onValueChange={(v) => setFilters({ stage: v as FilterState["stage"] })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type}
            onValueChange={(v) => setFilters({ type: v as FilterState["type"] })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

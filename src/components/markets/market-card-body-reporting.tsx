"use client";

import { copyAddress } from "@/lib/sim/service";
import type { Market } from "@/lib/types";

interface Props {
  market: Market;
  variant: "REPORTING" | "DISPUTE";
}

const MAX_VISIBLE = 2;

// Card-context address abbreviation: `0xa53d…9431` → `0xa5…31`.
function shortenAddress(addr: string): string {
  const stripped = addr.replace(/\.{3}|…/, "");
  if (stripped.length <= 8) return addr;
  return `${stripped.slice(0, 4)}…${stripped.slice(-2)}`;
}

// Trim verbose value labels — keep the price and the side/bracket arrow.
// e.g. `172 THB/kg → NO` → `172 → NO`, `39,200 tons → YES` → `39,200 → YES`.
function shortenValue(label: string): string {
  const arrowIdx = label.indexOf("→");
  if (arrowIdx < 0) return label;
  const lhs = label.slice(0, arrowIdx).trim();
  const rhs = label.slice(arrowIdx).trim();
  // Drop everything after the leading numeric (incl. comma + dot) so the
  // unit (`THB/kg`, `tons`, etc.) is gone.
  const numMatch = lhs.match(/^[\d.,]+/);
  const num = numMatch ? numMatch[0] : lhs;
  return `${num} ${rhs}`;
}

export function MarketCardBodyReporting({ market, variant }: Props) {
  const reporters = market.reporters ?? [];
  const visible = reporters.slice(0, MAX_VISIBLE);
  const extra = Math.max(0, reporters.length - MAX_VISIBLE);
  const heading =
    variant === "REPORTING" ? "Oracle reporters submitting…" : "Dispute window open";
  const subline =
    variant === "DISPUTE" && market.proposedOutcome
      ? `Proposed: ${market.proposedOutcome.label}`
      : null;

  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold leading-snug line-clamp-2">{market.question}</p>
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs dark:bg-blue-500/15">
        <div className="font-semibold text-blue-700 dark:text-blue-300">{heading}</div>
        {subline && (
          <div className="text-blue-700/80 dark:text-blue-300/80 mb-1">{subline}</div>
        )}
        <ul className="space-y-1 mt-1">
          {visible.map((r) => (
            <li key={r.address} className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyAddress(r.address);
                }}
                className="font-mono text-blue-700 dark:text-blue-300 hover:underline"
                title={r.address}
              >
                {shortenAddress(r.address)}
              </button>
              <span
                className="text-blue-700/80 dark:text-blue-300/80 tabular-nums truncate max-w-[140px]"
                title={r.valueLabel}
              >
                {shortenValue(r.valueLabel)}
              </span>
            </li>
          ))}
        </ul>
        {extra > 0 && (
          <div className="text-[10px] text-blue-700/70 dark:text-blue-300/70 mt-1">
            +{extra} more
          </div>
        )}
      </div>
    </div>
  );
}

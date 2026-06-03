"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { copyAddress } from "@/lib/sim/service";
import type { ReporterSubmission } from "@/lib/types";

interface ReporterListPanelProps {
  reporters: ReporterSubmission[];
  defaultCollapsed?: boolean;
  title?: string;
}

export function ReporterListPanel({
  reporters,
  defaultCollapsed = false,
  title = "Reporter submissions",
}: ReporterListPanelProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

  if (reporters.length === 0) {
    return (
      <div className="rounded-lg border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
        No reporters have submitted yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2.5 flex items-center justify-between"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title} ({reporters.length})
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (() => {
        const ROW = 36; // px — fixed row height so 5 rows ≈ 180px viewport.
        const list = (
          <ul className="divide-y">
            {reporters.map((r) => (
              <li
                key={r.address}
                className="px-4 flex items-center justify-between gap-3 text-xs hover:bg-muted/30"
                style={{ height: ROW }}
              >
                <button
                  type="button"
                  onClick={() => copyAddress(r.address)}
                  className="font-mono text-foreground hover:underline"
                  title="Copy address"
                >
                  {r.address}
                </button>
                <span className="text-muted-foreground font-mono text-right">
                  {r.valueLabel}
                </span>
              </li>
            ))}
          </ul>
        );
        // Show max 5 rows; scroll via shadcn ScrollArea past that.
        return reporters.length > 5 ? (
          <ScrollArea className="border-t" style={{ height: ROW * 5 }}>
            {list}
          </ScrollArea>
        ) : (
          <div className="border-t">{list}</div>
        );
      })()}
    </div>
  );
}

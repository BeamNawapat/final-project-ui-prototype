"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  /** "HH:mm" */
  value: string;
  onChange: (next: string) => void;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const PRESETS = ["09:00", "12:00", "15:00", "18:00", "23:59"];

export function TimePickerPopover({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [h, m] = (value || "12:00").split(":");

  function set(hh: string, mm: string) {
    onChange(`${hh}:${mm}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-10 justify-start gap-2 px-3 font-normal w-32", className)}
        >
          <Clock className="size-4 text-muted-foreground" />
          <span className="tabular-nums">{value || "—:—"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="space-y-2">
          {/* Hour + minute columns */}
          <div className="flex gap-2">
            <Column label="Hour" values={HOURS} active={h} onPick={(v) => set(v, m)} />
            <Column label="Min" values={MINS} active={m} onPick={(v) => set(h, v)} />
          </div>
          {/* Quick presets */}
          <div className="border-t pt-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
              Quick set
            </div>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors",
                    value === p && "bg-primary/10 text-primary border-primary/40",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Column({
  label,
  values,
  active,
  onPick,
}: {
  label: string;
  values: string[];
  active: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground text-center mb-1">
        {label}
      </div>
      <div className="h-40 w-14 overflow-y-auto rounded-md border bg-muted/20 flex flex-col">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onPick(v)}
            className={cn(
              "py-1 text-sm tabular-nums hover:bg-primary/10 hover:text-primary transition-colors",
              active === v && "bg-primary/15 text-primary font-semibold",
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

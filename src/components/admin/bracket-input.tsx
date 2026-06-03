"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  value: number[];
  onChange: (next: number[]) => void;
  unitLabel?: string;
}

export function BracketInput({ value, onChange, unitLabel }: Props) {
  function set(i: number, v: number) {
    const next = [...value];
    next[i] = v;
    onChange(next);
  }
  function add() {
    const last = value[value.length - 1] ?? 0;
    onChange([...value, last + 10]);
  }
  function remove(i: number) {
    if (value.length <= 2) return;
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((b, i) => (
          <div key={i} className="flex items-center gap-1">
            <Input
              type="number"
              value={b}
              onChange={(e) => set(i, Number(e.target.value) || 0)}
              className="w-24"
            />
            {value.length > 2 && (
              <button
                type="button"
                aria-label="Remove bracket"
                onClick={() => remove(i)}
                className="grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted/60"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
          <Plus className="size-3.5" />
          Add bracket
        </Button>
      </div>
      {unitLabel && (
        <p className="text-xs text-muted-foreground">
          Ascending boundaries in {unitLabel}. Creates {value.length + 1} outcome buckets.
        </p>
      )}
    </div>
  );
}

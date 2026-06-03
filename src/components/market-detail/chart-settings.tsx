"use client";

import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

export interface ChartSettings {
  autoscale: boolean;
  xAxis: boolean;
  yAxis: boolean;
  hGrid: boolean;
  vGrid: boolean;
  bothOutcomes: boolean;
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  autoscale: true,
  xAxis: true,
  yAxis: true,
  hGrid: true,
  vGrid: false,
  bothOutcomes: false,
};

interface ChartSettingsPopoverProps {
  value: ChartSettings;
  onChange: (next: ChartSettings) => void;
  trigger: ReactNode;
}

const ROWS: { key: keyof ChartSettings; label: string }[] = [
  { key: "autoscale", label: "Autoscale" },
  { key: "xAxis", label: "X-Axis" },
  { key: "yAxis", label: "Y-Axis" },
  { key: "hGrid", label: "Horizontal Grid" },
  { key: "vGrid", label: "Vertical Grid" },
  { key: "bothOutcomes", label: "Both Outcomes" },
];

export function ChartSettingsPopover({ value, onChange, trigger }: ChartSettingsPopoverProps) {
  function setKey(key: keyof ChartSettings, checked: boolean) {
    onChange({ ...value, [key]: checked });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-60 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Settings
        </div>
        <div className="flex flex-col gap-2.5">
          {ROWS.map((row) => (
            <label
              key={row.key}
              htmlFor={`chart-setting-${row.key}`}
              className="flex items-center justify-between gap-3 text-sm cursor-pointer"
            >
              <span className="text-foreground">{row.label}</span>
              <Switch
                id={`chart-setting-${row.key}`}
                checked={value[row.key]}
                onCheckedChange={(c) => setKey(row.key, c)}
              />
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

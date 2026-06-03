"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TimePickerPopover } from "./time-picker-popover";

interface Props {
  /** Local datetime string `YYYY-MM-DDTHH:mm` */
  value: string;
  onChange: (next: string) => void;
  /** YYYY-MM-DD (today, etc.) */
  minDate?: string;
  className?: string;
}

function parseValue(v: string): { date: Date | undefined; time: string } {
  if (!v) return { date: undefined, time: "12:00" };
  const [d, t] = v.split("T");
  const time = (t ?? "").slice(0, 5) || "12:00";
  return { date: d ? new Date(`${d}T${time}`) : undefined, time };
}

function combine(date: Date | undefined, time: string): string {
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${time || "12:00"}`;
}

export function DateTimePicker({ value, onChange, minDate, className }: Props) {
  const [open, setOpen] = useState(false);
  const { date, time } = parseValue(value);
  const min = minDate ? new Date(`${minDate}T00:00`) : undefined;

  const displayDate = date ? format(date, "EEE, MMM d, yyyy") : "Pick a date";

  return (
    <div className={cn("grid grid-cols-[1fr_auto] gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 justify-start gap-2 px-3 font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-4 text-muted-foreground" />
            {displayDate}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              onChange(combine(d, time));
              setOpen(false);
            }}
            disabled={min ? { before: min } : undefined}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <TimePickerPopover value={time} onChange={(t) => onChange(combine(date, t))} />
    </div>
  );
}

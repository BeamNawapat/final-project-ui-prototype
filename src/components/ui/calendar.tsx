"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "space-y-2",
        month_caption: "flex justify-center pt-1 relative items-center text-sm font-semibold",
        caption_label: "text-sm font-semibold",
        nav: "absolute right-1 top-1 flex items-center gap-1",
        button_previous:
          "size-7 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
        button_next:
          "size-7 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
        month_grid: "w-full border-collapse mt-2",
        weekdays: "flex",
        weekday: "text-muted-foreground w-8 text-[10px] uppercase tracking-wider font-medium",
        week: "flex w-full mt-1",
        day: "size-8 text-center text-sm",
        day_button: cn(
          "size-8 inline-flex items-center justify-center rounded-md transition-colors",
          "hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ),
        range_start: "bg-primary text-primary-foreground",
        range_end: "bg-primary text-primary-foreground",
        selected:
          "[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground",
        today: "[&_button]:ring-1 [&_button]:ring-primary/40",
        outside: "[&_button]:text-muted-foreground/40",
        disabled: "[&_button]:text-muted-foreground/30 [&_button]:pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 3-way theme toggle: system | light | dark.
 * Defaults to system on first load. Persisted by next-themes in localStorage.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    // avoid hydration mismatch — render an invisible placeholder of the same size
    return <div className="h-9 w-[108px]" aria-hidden />;
  }

  const options: Array<{
    value: "system" | "light" | "dark";
    icon: React.ReactNode;
    label: string;
  }> = [
    { value: "system", icon: <Monitor className="h-3.5 w-3.5" />, label: "System" },
    { value: "light", icon: <Sun className="h-3.5 w-3.5" />, label: "Light" },
    { value: "dark", icon: <Moon className="h-3.5 w-3.5" />, label: "Dark" },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border bg-card p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          aria-label={opt.label}
          title={opt.label}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            theme === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

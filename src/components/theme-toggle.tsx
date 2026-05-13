"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

/**
 * Single-button light/dark toggle with animated icon swap.
 * Both Sun + Moon are stacked in the same slot; the inactive one
 * scales to 0 and rotates 90° while the active one rotates back to 0
 * and scales to 1. Classic shadcn theme-toggle motion.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
    </button>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/oracle", label: "Oracle" },
  { href: "/faucet", label: "Faucet" },
  { href: "/admin", label: "Admin" },
];

/**
 * Navbar — ported style from production frontend/src/components/layout/navbar.tsx
 * Differences: SVG logo (not 🌾 emoji), keeps light/dark theme toggle,
 * plain Connect Wallet button (no RainbowKit in prototype scope).
 */
export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-background border-b shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/agricast-mark.svg"
            alt="AgriCast"
            width={28}
            height={28}
            priority
          />
          <span className="text-xl font-bold text-gradient group-hover:opacity-80 transition-opacity">
            AgriCast
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="ml-8 flex gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right cluster: theme toggle + wallet */}
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Button size="sm" className="rounded-lg">
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  );
}

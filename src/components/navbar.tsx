"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS: Array<{ label: string; href: string }> = [
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Oracle", href: "/oracle" },
  { label: "Faucet", href: "/faucet" },
  { label: "Admin", href: "/admin" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-6 px-4 max-w-7xl">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/agricast-mark.svg"
            alt="AgriCast"
            width={28}
            height={28}
            priority
          />
          <span className="text-base font-semibold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            AgriCast
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster: spacer + theme toggle + wallet */}
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Button size="sm" className="rounded-full">
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Radio,
  Users,
  ArrowLeftRight,
  Vault,
  Droplets,
  Activity,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/markets", label: "Markets", icon: ListChecks },
  { href: "/admin/oracle", label: "Oracle", icon: Radio },
  { href: "/admin/reporters", label: "Reporters", icon: Users },
  { href: "/admin/exchange", label: "Exchange", icon: ArrowLeftRight },
  { href: "/admin/escrow", label: "Escrow", icon: Vault },
  { href: "/admin/queues", label: "Queues", icon: Activity },
  { href: "/admin/faucet", label: "Faucet", icon: Droplets },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r bg-card/40 px-3 py-6 hidden md:flex flex-col gap-1">
      <div className="px-3 mb-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Admin
        </p>
      </div>
      {NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}

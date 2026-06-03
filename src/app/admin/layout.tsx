"use client";

import Link from "next/link";
import { Lock, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSim } from "@/lib/sim/store";
import { useIsAdmin } from "@/lib/sim/admin";
import { connectWallet } from "@/lib/sim/service";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const wallet = useSim((s) => s.wallet);
  const isAdmin = useIsAdmin();

  if (!wallet.connected) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-md text-center space-y-4">
        <div className="mx-auto grid place-items-center size-12 rounded-full bg-primary/10 text-primary">
          <Lock className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Admin Access</h1>
        <p className="text-sm text-muted-foreground">
          Connect a wallet to continue. The admin role is gated by wallet address allowlist
          in production (sim wallet here).
        </p>
        <Button onClick={() => connectWallet()} className="rounded-lg">
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-md text-center space-y-4">
        <div className="mx-auto grid place-items-center size-12 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-sm text-muted-foreground break-all">
          <span className="font-mono">{wallet.address}</span> is not an admin.
        </p>
        <p className="text-xs text-muted-foreground">
          For the prototype, open the wallet menu in the navbar and toggle{" "}
          <span className="font-semibold">Become Admin (Sim)</span> to enter admin mode.
        </p>
        <Button asChild variant="outline">
          <Link href="/markets">← Back to Markets</Link>
        </Button>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

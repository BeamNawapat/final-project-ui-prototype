"use client";

import { Wallet, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSim } from "@/lib/sim/store";
import { connectWallet, disconnectWallet } from "@/lib/sim/service";
import { BecomeAdminToggle } from "@/components/admin/become-admin-toggle";
import { useState } from "react";

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function FakeConnectButton() {
  const wallet = useSim((s) => s.wallet);
  const [open, setOpen] = useState(false);

  if (wallet.connected && wallet.address) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg gap-2 bg-blue-500/10 border-blue-500/30 text-blue-700 hover:bg-blue-500/20 hover:text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/25 dark:hover:text-blue-200"
          onClick={() => setOpen(true)}
        >
          <Wallet className="size-4" />
          <span className="font-mono">{truncate(wallet.address)}</span>
          <span className="text-muted-foreground">·</span>
          <span className="tabular-nums">${wallet.balance.toFixed(0)}</span>
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Wallet</DialogTitle>
              <DialogDescription>Simulated wallet — no real chain</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <div className="text-xs text-muted-foreground">Address</div>
                <div className="font-mono break-all">{wallet.address}</div>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="font-semibold tabular-nums">
                  {wallet.balance.toFixed(2)} USDC
                </div>
              </div>
              <BecomeAdminToggle />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  disconnectWallet();
                  setOpen(false);
                }}
              >
                <LogOut className="size-4" />
                Disconnect
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button size="sm" className="rounded-lg" onClick={() => connectWallet()}>
      Connect Wallet
    </Button>
  );
}

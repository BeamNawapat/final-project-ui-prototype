"use client";

import { Shield, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsAdmin, setIsAdmin } from "@/lib/sim/admin";
import { toast } from "sonner";

export function BecomeAdminToggle() {
  const isAdmin = useIsAdmin();
  return (
    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={() => {
        setIsAdmin(!isAdmin);
        toast(isAdmin ? "Admin role revoked" : "Admin role granted (sim only)");
      }}
    >
      {isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
      {isAdmin ? "Leave Admin Role" : "Become Admin (Sim)"}
    </Button>
  );
}

import type { Metadata } from "next";
import { FaucetView } from "@/components/faucet/faucet-view";

export const metadata: Metadata = {
  title: "Faucet · AgriCast",
  description: "Claim TestUSDC to trade on AgriCast markets.",
};

export default function FaucetPage() {
  return (
    <div className="bg-mesh min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <FaucetView />
      </div>
    </div>
  );
}

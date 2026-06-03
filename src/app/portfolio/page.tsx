import type { Metadata } from "next";
import { PortfolioView } from "@/components/portfolio/portfolio-view";

export const metadata: Metadata = {
  title: "Portfolio · AgriCast",
  description: "Your positions, open orders, and trade activity.",
};

export default function PortfolioPage() {
  return (
    <div className="bg-mesh min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PortfolioView />
      </div>
    </div>
  );
}

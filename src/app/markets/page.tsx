import { MarketsGrid } from "@/components/markets/markets-grid";
import { MarketsPageHeader } from "@/components/markets/markets-page-header";

export const metadata = {
  title: "Markets — AgriCast",
};

export default function MarketsPage() {
  return (
    <div className="bg-mesh min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <MarketsPageHeader />
        <MarketsGrid />
      </div>
    </div>
  );
}

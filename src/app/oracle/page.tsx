import type { Metadata } from "next";
import { OracleView } from "@/components/oracle/oracle-view";

export const metadata: Metadata = {
  title: "Oracle · AgriCast",
  description: "Decentralized oracle reporters and settlement parameters.",
};

export default function OraclePage() {
  return (
    <div className="bg-mesh min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <OracleView />
      </div>
    </div>
  );
}

import type { ReporterRecord } from "@/lib/types";

// Reporter stake is in ETH (native token, 18 decimals) in production.
// ACTIVE_THRESHOLD = 0.5 ETH — below that the reporter is inactive.
// See frontend/src/app/admin/reporters/page.tsx:93 + line 402 (formatEther).
export const MOCK_REPORTERS: ReporterRecord[] = [
  {
    address: "0xa53d1f9b8c4e2d5a8b9c3f1e7d4b6a8c9d2e9431",
    stake: 1.2,
    totalReports: 142,
    accurateReports: 138,
    accuracy: 0.972,
    slashes: 0,
    status: "active",
  },
  {
    address: "0x7c12b88e3a5f1d8c4b9a7e6d2c5b8a3f9e1db88e",
    stake: 0.85,
    totalReports: 138,
    accurateReports: 132,
    accuracy: 0.957,
    slashes: 1,
    status: "active",
  },
  {
    address: "0x9f4e3a2b1c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f",
    stake: 0.32,
    totalReports: 87,
    accurateReports: 81,
    accuracy: 0.931,
    slashes: 2,
    status: "paused",
  },
];

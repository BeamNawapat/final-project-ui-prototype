import type { TradeRecord } from "@/lib/types";

const now = Date.now();

export const MOCK_TRADES: TradeRecord[] = [
  {
    id: "t-1",
    marketId: "rice-hommali-march-2026",
    marketTitle: "Hom Mali rice ≥ 14,200 THB",
    side: "YES",
    outcomeLabel: "YES",
    shares: 50,
    pricePerShare: 0.62,
    timestamp: new Date(now - 1 * 60_000).toISOString(),
  },
  {
    id: "t-2",
    marketId: "palm-oil-march-2026",
    marketTitle: "Palm oil March 2026 bracket",
    side: "YES",
    outcomeLabel: "32–36 THB",
    shares: 120,
    pricePerShare: 0.47,
    timestamp: new Date(now - 4 * 60_000).toISOString(),
  },
  {
    id: "t-3",
    marketId: "cassava-march-2026",
    marketTitle: "Cassava ≥ 525 USD/ton",
    side: "NO",
    outcomeLabel: "NO",
    shares: 35,
    pricePerShare: 0.26,
    timestamp: new Date(now - 8 * 60_000).toISOString(),
  },
  {
    id: "t-4",
    marketId: "durian-monthong-may-2026",
    marketTitle: "Monthong durian ≥ 175 THB",
    side: "YES",
    outcomeLabel: "YES",
    shares: 75,
    pricePerShare: 0.41,
    timestamp: new Date(now - 15 * 60_000).toISOString(),
  },
  {
    id: "t-5",
    marketId: "sugar-export-q1-2026",
    marketTitle: "Sugar Q1 2026 bracket",
    side: "YES",
    outcomeLabel: "480–500",
    shares: 200,
    pricePerShare: 0.45,
    timestamp: new Date(now - 22 * 60_000).toISOString(),
  },
];

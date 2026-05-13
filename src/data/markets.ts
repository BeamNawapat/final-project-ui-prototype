import type { Market } from "@/types";
import { OUTCOME_COLORS_HEX } from "@/lib/market-utils";

function ob(asks: Array<[number, number]>, bids: Array<[number, number]>) {
  return {
    asks: asks.map(([price, size]) => ({ price, size })),
    bids: bids.map(([price, size]) => ({ price, size })),
  };
}

export const MOCK_MARKETS: Market[] = [
  {
    id: "binary-tangerine",
    marketId: "0xaa1...",
    title: "Will Tangerine Sai Nam Phueng No.4 exceed THB 57.5 by May 11, 2026?",
    description: "Binary YES/NO market on Tangerine price threshold",
    marketType: "BINARY",
    status: "ACTIVE",
    product: {
      productCode: "F11005",
      productName: "Tangerine Sai Nam Phueng No.4",
      category: "Fruits",
    },
    threshold: 57.5,
    brackets: [],
    outcomeCount: 2,
    tokenIds: ["yes-token-id", "no-token-id"],
    noTokenIds: [], // binary doesn't need separate noTokenIds (outcome 1 IS the no)
    resolutionTime: "2026-05-14T19:00:00.000Z",
    tradingCutoffTime: "2026-05-14T19:00:00.000Z",
    createdAt: "2026-05-09T00:00:00.000Z",
    resolvedAt: null,
    winningOutcome: null,
    settlementPrice: null,
    outcomes: [
      {
        index: 0,
        label: "YES",
        color: "#16a34a",
        volumeUsdc: 12_450,
        chance: 0.52,
        yesOrderbook: ob(
          [[0.53, 800], [0.54, 1500], [0.55, 3000]],
          [[0.52, 1200], [0.51, 2400], [0.50, 5000]],
        ),
        noOrderbook: ob(
          [[0.48, 1200], [0.49, 2400], [0.50, 5000]],
          [[0.47, 800], [0.46, 1500], [0.45, 3000]],
        ),
      },
      {
        index: 1,
        label: "NO",
        color: "#dc2626",
        volumeUsdc: 12_450,
        chance: 0.48,
        yesOrderbook: ob(
          [[0.48, 1200], [0.49, 2400], [0.50, 5000]],
          [[0.47, 800], [0.46, 1500], [0.45, 3000]],
        ),
        noOrderbook: ob(
          [[0.53, 800], [0.54, 1500], [0.55, 3000]],
          [[0.52, 1200], [0.51, 2400], [0.50, 5000]],
        ),
      },
    ],
  },

  {
    id: "multi-pork-belly",
    marketId: "0xbb2...",
    title: "Where will Pork Belly price land by May 11, 2026?",
    description: "Multi-bracket market — exactly one bracket wins. Each bracket is an independent binary with its own YES + NO sides.",
    marketType: "MULTI_BRACKET",
    status: "ACTIVE",
    product: {
      productCode: "M16033",
      productName: "Pork Belly",
      category: "Meat",
    },
    brackets: [100, 120, 140, 160, 180, 200, 220],
    outcomeCount: 8,
    tokenIds: Array.from({ length: 8 }, (_, i) => `yes-pork-${i}`),
    noTokenIds: Array.from({ length: 8 }, (_, i) => `no-pork-${i}`),
    resolutionTime: "2026-05-14T19:00:00.000Z",
    tradingCutoffTime: "2026-05-14T19:00:00.000Z",
    createdAt: "2026-05-09T00:00:00.000Z",
    resolvedAt: null,
    winningOutcome: null,
    settlementPrice: null,
    outcomes: [
      { idx: 0, label: "< 100 THB", chance: 0.04, vol: 2_400 },
      { idx: 1, label: "100-120 THB", chance: 0.09, vol: 4_100 },
      { idx: 2, label: "120-140 THB", chance: 0.14, vol: 7_800 },
      { idx: 3, label: "140-160 THB", chance: 0.21, vol: 12_500 },
      { idx: 4, label: "160-180 THB", chance: 0.27, vol: 18_300 },
      { idx: 5, label: "180-200 THB", chance: 0.15, vol: 9_400 },
      { idx: 6, label: "200-220 THB", chance: 0.07, vol: 3_200 },
      { idx: 7, label: "≥ 220 THB", chance: 0.03, vol: 1_100 },
    ].map(({ idx, label, chance, vol }) => {
      const yesPrice = Math.max(0.01, Math.min(0.99, chance));
      const noPrice = 1 - yesPrice;
      return {
        index: idx,
        label,
        color: OUTCOME_COLORS_HEX[idx % OUTCOME_COLORS_HEX.length] as string,
        volumeUsdc: vol,
        chance: yesPrice,
        yesOrderbook: ob(
          [[+(yesPrice + 0.01).toFixed(2), 800], [+(yesPrice + 0.02).toFixed(2), 1500]],
          [[+(yesPrice - 0.01).toFixed(2), 1200], [+(yesPrice - 0.02).toFixed(2), 2400]],
        ),
        noOrderbook: ob(
          [[+(noPrice + 0.01).toFixed(2), 800], [+(noPrice + 0.02).toFixed(2), 1500]],
          [[+(noPrice - 0.01).toFixed(2), 1200], [+(noPrice - 0.02).toFixed(2), 2400]],
        ),
      };
    }),
  },

  {
    id: "binary-rss3-closed",
    marketId: "0xcc3...",
    title: "Did RSS3 Rubber exceed THB 80/kg on May 5, 2026?",
    description: "Binary market — trading already ended, awaiting oracle resolution",
    marketType: "BINARY",
    status: "ACTIVE",
    product: {
      productCode: "R12001",
      productName: "RSS3 Rubber",
      category: "Industrial",
    },
    threshold: 80,
    brackets: [],
    outcomeCount: 2,
    tokenIds: ["yes-rss3", "no-rss3"],
    noTokenIds: [],
    resolutionTime: "2026-05-13T22:00:00.000Z",
    tradingCutoffTime: "2026-05-13T21:00:00.000Z",
    createdAt: "2026-05-01T00:00:00.000Z",
    resolvedAt: null,
    winningOutcome: null,
    settlementPrice: null,
    outcomes: [
      {
        index: 0,
        label: "YES",
        color: "#16a34a",
        volumeUsdc: 8_200,
        chance: 0.71,
        yesOrderbook: ob([[0.72, 500]], [[0.70, 500]]),
        noOrderbook: ob([[0.30, 500]], [[0.28, 500]]),
      },
      {
        index: 1,
        label: "NO",
        color: "#dc2626",
        volumeUsdc: 8_200,
        chance: 0.29,
        yesOrderbook: ob([[0.30, 500]], [[0.28, 500]]),
        noOrderbook: ob([[0.72, 500]], [[0.70, 500]]),
      },
    ],
  },
];

export function findMarket(id: string): Market | undefined {
  return MOCK_MARKETS.find((m) => m.id === id);
}

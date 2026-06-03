/**
 * Domain types for the UI prototype. Shape mirrors backend Prisma Market
 * (backend/prisma/schema.prisma) so future wiring to /api/markets is a
 * rename-free swap.
 */

export type MarketType = "BINARY" | "MULTI_BRACKET";

export type MarketStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "DISPUTED"
  | "RESOLVED"
  | "CANCELLED";

export interface Outcome {
  label: string;
  probability: number;
}

export interface ReporterSubmission {
  address: string;
  valueLabel: string;
}

export interface ResolvedOutcome {
  label: string;
  settlementPriceLabel: string;
  outcomeIdx: number;
}

export interface PricePoint {
  t: number; // unix ms
  yesProb: number; // 0..1
}

export interface OrderRow {
  price: number; // cents (0..100)
  shares: number;
  total: number; // cumulative cents
}

export interface Orderbook {
  bids: OrderRow[]; // YES-bids — buyers willing to pay this for YES
  asks: OrderRow[]; // YES-asks — sellers offering YES at this price
}

export interface Challenge {
  challenger: string;
  reason: string;
  filedAt: string;
}

export interface Market {
  id: string;
  question: string;
  type: MarketType;
  status: MarketStatus;
  productCode: string;
  productName: string;
  productCategory: string;
  productColor: string;
  productIcon?: string; // emoji fallback
  threshold?: number;
  thresholdUnit?: string;
  brackets?: number[];
  outcomes: Outcome[];
  volume: number;
  resolutionTime: string;
  tradingCutoffTime?: string;
  reportingEndsAt?: string;
  disputeEndsAt?: string;
  reporters?: ReporterSubmission[];
  resolvedOutcome?: ResolvedOutcome;
  proposedOutcome?: ResolvedOutcome;
  isFrozen?: boolean;
  disputePeriodSeconds?: number;
  // PENDING markets — wall-clock when the oracle is scheduled to activate
  // trading. `deriveMarketStage()` treats PENDING markets past this time
  // as ACTIVE (or later, depending on the cutoff/resolution fields).
  expectedOpenTime?: string;
  // Detail-page extensions
  priceHistory?: PricePoint[];
  orderbook?: Orderbook;
  rules?: string;
  marketContext?: string;
  reason?: string; // CANCELLED / PAUSED admin note
  challenge?: Challenge; // DISPUTED challenger record
}

export interface ReporterRecord {
  address: string;
  stake: number;
  totalReports: number;
  accurateReports: number;
  accuracy: number;
  slashes: number;
  status: "active" | "paused" | "slashed";
}

export interface ProductOption {
  code: string;
  name: string;
  unit: string;
  category: string;
}

export interface TradeRecord {
  id: string;
  marketId: string;
  marketTitle: string;
  side: "YES" | "NO";
  outcomeLabel: string;
  shares: number;
  pricePerShare: number;
  timestamp: string;
}

export interface OracleParams {
  reportingWindow: number;
  defaultDispute: number;
  perQuestion: Record<string, number>;
}

export interface ExchangeConfig {
  operators: Record<string, boolean>;
  registeredTokens: Record<string, boolean>;
  feeCollector: string;
}

export interface EscrowConfig {
  timelock: number;
}

export interface Position {
  id: string;
  marketId: string;
  outcomeIdx: number;
  outcomeLabel: string;
  side: "YES" | "NO";
  size: number;
  avgPrice: number;
  createdAt: string;
}

export type OrderType = "MARKET" | "LIMIT" | "SPLIT";

export interface OrderRecord {
  id: string;
  marketId: string;
  outcomeIdx: number;
  side: "YES" | "NO";
  direction: "BUY" | "SELL";
  orderType: OrderType;
  size: number; // USDC for buy, shares for sell
  price: number; // 0..1 probability (=cents/100)
  limitPrice?: number; // 0..1, only for LIMIT
  status: "PENDING" | "OPEN" | "FILLED" | "FAILED" | "CANCELLED";
  txHash?: string;
  createdAt: string;
}

export type StageFilter =
  | "ALL"
  | "ACTIVE"
  | "CLOSED"
  | "REPORTING"
  | "DISPUTE"
  | "DISPUTED"
  | "RESOLVED"
  | "CANCELLED"
  | "PAUSED"
  | "PENDING";

export interface FilterState {
  query: string;
  stage: StageFilter;
  type: "ALL" | MarketType;
}

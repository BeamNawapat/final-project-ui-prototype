// Minimal types for UI prototype — match shape of real backend so design
// transfers cleanly back to main repo.

export type MarketType = "BINARY" | "MULTI_BRACKET";

export type MarketStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "DISPUTED"
  | "RESOLVED"
  | "CANCELLED";

export interface Product {
  productCode: string;
  productName: string;
  category: string;
}

export interface OrderbookSide {
  price: number;
  size: number;
}

export interface OrderbookSnapshot {
  bids: OrderbookSide[];
  asks: OrderbookSide[];
}

export interface Market {
  id: string;
  marketId: string;
  title: string;
  description?: string;
  marketType: MarketType;
  status: MarketStatus;
  product: Product;

  // binary
  threshold?: number;

  // multi-bracket
  brackets: number[];
  outcomeCount: number;

  // CTF token ids per outcome
  tokenIds: string[];        // YES side per bracket
  noTokenIds: string[];      // NO  side per bracket (empty for binary)

  // timing
  resolutionTime: string;          // ISO string
  tradingCutoffTime: string | null;
  createdAt: string;
  resolvedAt: string | null;

  // outcomes (per-bracket orderbook snapshot for the prototype only)
  outcomes: Array<{
    index: number;
    label: string;          // e.g. "100-120 THB" or "YES"
    color: string;          // hex
    volumeUsdc: number;     // for display
    yesOrderbook: OrderbookSnapshot;
    noOrderbook: OrderbookSnapshot;
    chance: number;         // 0..1 implied probability from yes mid
  }>;

  // resolution
  winningOutcome: number | null;
  settlementPrice: number | null;
}

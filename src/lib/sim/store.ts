"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  EscrowConfig,
  ExchangeConfig,
  FilterState,
  Market,
  OracleParams,
  OrderRecord,
  Position,
  ReporterRecord,
  TradeRecord,
} from "@/lib/types";
import { MOCK_MARKETS } from "@/lib/mocks/markets";
import { MOCK_REPORTERS } from "@/lib/mocks/reporters";
import { MOCK_TRADES } from "@/lib/mocks/trades";
import { MOCK_POSITIONS, MOCK_OPEN_ORDERS } from "@/lib/mocks/positions";
import { enrichMarketDetail } from "@/lib/mocks/market-detail";

const SEEDED_MARKETS: Market[] = MOCK_MARKETS.map(enrichMarketDetail);

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
}

interface NotificationSub {
  wallet: string;
  marketId: string;
  subscribedAt: string;
}

interface SimState {
  wallet: WalletState;
  isAdmin: boolean;
  markets: Market[];
  positions: Position[];
  orders: OrderRecord[];
  trades: TradeRecord[];
  reporters: ReporterRecord[];
  oracleParams: OracleParams;
  exchangeConfig: ExchangeConfig;
  escrowConfig: EscrowConfig;
  bookmarks: string[];
  notifications: NotificationSub[];
  filters: FilterState;
  setWallet: (w: Partial<WalletState>) => void;
  setIsAdmin: (v: boolean) => void;
  setBalance: (delta: number) => void;
  setMarkets: (m: Market[] | ((prev: Market[]) => Market[])) => void;
  addOrder: (o: OrderRecord) => void;
  updateOrder: (id: string, patch: Partial<OrderRecord>) => void;
  addPosition: (p: Position) => void;
  addTrade: (t: TradeRecord) => void;
  setReporters: (r: ReporterRecord[] | ((prev: ReporterRecord[]) => ReporterRecord[])) => void;
  setOracleParams: (p: Partial<OracleParams>) => void;
  setOracleQuestionDispute: (marketId: string, seconds: number) => void;
  setExchangeConfig: (
    cfg: Partial<ExchangeConfig> | ((prev: ExchangeConfig) => ExchangeConfig),
  ) => void;
  setEscrowConfig: (cfg: Partial<EscrowConfig>) => void;
  toggleBookmark: (id: string) => void;
  setFilters: (f: Partial<FilterState>) => void;
  addNotification: (n: NotificationSub) => void;
  removeNotification: (wallet: string, marketId: string) => void;
}

export const useSim = create<SimState>()(
  persist(
    (set) => ({
      wallet: { connected: false, address: null, balance: 0 },
      isAdmin: false,
      markets: SEEDED_MARKETS,
      positions: MOCK_POSITIONS,
      orders: MOCK_OPEN_ORDERS,
      trades: MOCK_TRADES,
      reporters: MOCK_REPORTERS,
      oracleParams: { reportingWindow: 600, defaultDispute: 300, perQuestion: {} },
      // Seed values mirror contracts/deployments/dev.json:
      // - feeCollector = deployer (Deploy.s.sol:58 `feeCollector = vm.addr(deployerPrivateKey)`)
      // - operators bootstrap with deployer (AgriExchange.sol:109 `operators[msg.sender] = true`)
      exchangeConfig: {
        operators: { "0xC8cDB116ec49fb4DdF2fB21afeCa479073f6dfDf": true },
        registeredTokens: {},
        feeCollector: "0xC8cDB116ec49fb4DdF2fB21afeCa479073f6dfDf",
      },
      escrowConfig: { timelock: 86400 },
      bookmarks: [],
      notifications: [],
      filters: { query: "", stage: "ALL", type: "ALL" },
      setWallet: (w) => set((s) => ({ wallet: { ...s.wallet, ...w } })),
      setIsAdmin: (v) => set({ isAdmin: v }),
      setBalance: (delta) =>
        set((s) => ({ wallet: { ...s.wallet, balance: s.wallet.balance + delta } })),
      setMarkets: (m) =>
        set((s) => ({ markets: typeof m === "function" ? m(s.markets) : m })),
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      updateOrder: (id, patch) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      addPosition: (p) => set((s) => ({ positions: [p, ...s.positions] })),
      addTrade: (t) => set((s) => ({ trades: [t, ...s.trades].slice(0, 50) })),
      setReporters: (r) =>
        set((s) => ({ reporters: typeof r === "function" ? r(s.reporters) : r })),
      setOracleParams: (p) =>
        set((s) => ({ oracleParams: { ...s.oracleParams, ...p } })),
      setOracleQuestionDispute: (marketId, seconds) =>
        set((s) => ({
          oracleParams: {
            ...s.oracleParams,
            perQuestion: { ...s.oracleParams.perQuestion, [marketId]: seconds },
          },
        })),
      setExchangeConfig: (cfg) =>
        set((s) => ({
          exchangeConfig:
            typeof cfg === "function" ? cfg(s.exchangeConfig) : { ...s.exchangeConfig, ...cfg },
        })),
      setEscrowConfig: (cfg) =>
        set((s) => ({ escrowConfig: { ...s.escrowConfig, ...cfg } })),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((x) => x !== id)
            : [...s.bookmarks, id],
        })),
      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      addNotification: (n) =>
        set((s) => ({
          notifications: s.notifications.some(
            (x) => x.wallet === n.wallet && x.marketId === n.marketId,
          )
            ? s.notifications
            : [n, ...s.notifications],
        })),
      removeNotification: (wallet, marketId) =>
        set((s) => ({
          notifications: s.notifications.filter(
            (x) => !(x.wallet === wallet && x.marketId === marketId),
          ),
        })),
    }),
    {
      name: "agricast-sim",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        bookmarks: s.bookmarks,
        wallet: s.wallet,
        isAdmin: s.isAdmin,
        notifications: s.notifications,
      }),
    },
  ),
);

# Create Binary Market

## Real implementation
- Backend: `POST /api/markets/binary` → `MarketService.createBinaryMarket()` (`backend/src/services/market.ts`) — `backend/src/routes/markets.ts:85`
- Alt path (user-signed): `POST /api/markets/index/binary` (records a market the wallet already deployed itself).
- Contract: `AgriMarketFactoryV2.createBinaryMarket(string productCode, uint256 threshold, uint256 resolutionTime, string question)` — `contracts/src/factory/AgriMarketFactoryV2.sol:116`
  - Emits `BinaryMarketCreated(marketId, questionId, conditionId, productCode, threshold, resolutionTime, question)`.
  - Gated `onlyOwner`.

## Form params (mirrors real shape)

| field | type | notes |
|---|---|---|
| productCode | `string` | from `/api/products` list |
| title | `string` | human-readable; auto-generates if blank |
| description | `string?` | optional |
| threshold | `number` | THB / kg / ton — unit per product |
| thresholdUnit | `string` | display-only |
| resolutionTime | ISO 8601 `string` | when oracle settles |
| tradingCutoffTime | ISO 8601 `string` | auto = resolutionTime − 2h |
| disputePeriodDays | `1 \| 3 \| 7 \| 14 \| 30` | seconds = days × 86400 → on-chain |

## Prototype simulation
- File: `src/components/admin/create-binary-market-form.tsx` + service `adminCreateBinary(input)` in `src/lib/sim/service.ts`.
- Behaviour: validates required fields → renders `<SimulatedTxReceipt>` preview ("Will execute: `AgriMarketFactoryV2.createBinaryMarket(productCode, thresholdWei, resolutionTimeUnix, question)`") → on confirm, fakes 1200ms write → appends new `Market` to sim store with `status: "PENDING"`, then auto-flips to `ACTIVE` after 1.5s to mimic oracle activation.
- Toast: `"Binary market created — tx 0x…"`.
- Store mutations: `setMarkets((prev) => [newMarket, ...prev])`.

## Gaps from production
- Backend route exists but has no auth gate; UI is the only filter today.
- `tradingCutoffTime` auto-derivation lives in frontend — should move to backend/contract to prevent drift.

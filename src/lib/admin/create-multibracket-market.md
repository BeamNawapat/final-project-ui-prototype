# Create Multi-Bracket Market

## Real implementation
- Backend: `POST /api/markets/multi-bracket` → `MarketService.createMultiBracketMarket()` — `backend/src/routes/markets.ts:131`
- Alt path (user-signed): `POST /api/markets/index/multi-bracket` — `backend/src/routes/markets.ts:220`
- Contract: `AgriMarketFactoryV2.createMultiBracketMarket(string productCode, uint256[] brackets, uint256 resolutionTime, string question)` — `contracts/src/factory/AgriMarketFactoryV2.sol:188`
  - Brackets array length N → creates N+1 outcomes: `<brackets[0]`, `brackets[0]–brackets[1]`, …, `≥brackets[N-1]`.
  - Emits `MultiBracketMarketCreated(marketId, questionId, conditionId, productCode, brackets, resolutionTime, question)`.
  - Gated `onlyOwner`.

## Form params

| field | type | notes |
|---|---|---|
| productCode | `string` | |
| title | `string` | |
| description | `string?` | |
| brackets | `number[]` (≥2 boundaries) | ascending; sanitized client-side |
| resolutionTime | ISO 8601 | |
| tradingCutoffTime | ISO 8601 | auto −2h |
| disputePeriodDays | `1 \| 3 \| 7 \| 14 \| 30` | |

## Prototype simulation
- File: `src/components/admin/create-multibracket-market-form.tsx` + `adminCreateMulti(input)`.
- Behaviour: uses `<BracketInput>` for the dynamic boundary list; preview shows derived outcome labels (`< 460 USD`, `460–480 USD`, …); receipt: `"Will execute: AgriMarketFactoryV2.createMultiBracketMarket(productCode, [bracketsScaled], resolutionTimeUnix, question)"`.
- Store mutations: same as binary — `setMarkets` prepend.

## Gaps from production
- Production form does not validate ascending order or duplicates server-side; UI catches both client-side only.

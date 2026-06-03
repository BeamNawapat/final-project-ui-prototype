# Oracle Parameters

## Real implementation
- Contract: `AgriOracleV2` (`contracts/src/core/AgriOracleV2.sol`)
  - `setReportingWindow(uint256 newWindow)` — L480 — global default reporting window (sec)
  - `setDefaultDisputePeriod(uint256 newPeriod)` — L484 — global dispute period (sec)
  - `setQuestionDisputePeriod(bytes32 questionId, uint256 period)` — L492 — per-question override
  - All `onlyOwner`.
- Backend (read-only health): `GET /api/admin/oracle-lifecycle/status` — `backend/src/routes/resolution.ts:232`. Returns BullMQ queue depths, last successful settlement, etc.

## Form params

| Form | field | type | notes |
|---|---|---|---|
| Global reporting window | `seconds` | `number` | typical 600 (10 min) |
| Global dispute period | `seconds` | `number` | typical 300 (5 min) |
| Per-question dispute | `marketId` | `string` | select |
|  | `seconds` | `number` | override |

## Prototype simulation
- File: `src/app/admin/oracle/page.tsx`.
- Service: `adminSetReportingWindow(seconds)`, `adminSetDefaultDispute(seconds)`, `adminSetQuestionDispute(marketId, seconds)`.
- Store: `oracleParams: { reportingWindow, defaultDispute, perQuestion: { [marketId]: seconds } }`.
- Lifecycle health panel: mock JSON view of queue depths (`match-orders: 3`, `resolve-markets: 0`, …) refreshed every 5s with random ±drift.
- Toast: `"Reporting window set to <N> seconds"` etc.

## Gaps from production
- `GET /api/admin/oracle-lifecycle/status` exists but no auth; should be admin-gated.
- No way to revert a bad param change without another tx.

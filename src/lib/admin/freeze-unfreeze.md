# Freeze / Unfreeze Market

## Real implementation
- Backend: **gap**.
- Contract:
  - `EscrowVault.freezeMarket(bytes32 questionId)` — `contracts/src/escrow/EscrowVault.sol:179` — emits `MarketFrozen(questionId)`
  - `EscrowVault.unfreezeMarket(bytes32 questionId)` — `contracts/src/escrow/EscrowVault.sol:184` — emits `MarketUnfrozen(questionId)`
  - Both `onlyOwner`.

## Form params

| field | type | notes |
|---|---|---|
| marketId | `string` | |
| action | `"freeze" \| "unfreeze"` | derived from current `isFrozen` |

## Prototype simulation
- File: `src/app/admin/markets/[id]/page.tsx` + `src/app/admin/escrow/page.tsx` (per-market inspector).
- Service: `adminFreezeMarket(marketId)` / `adminUnfreezeMarket(marketId)`.
- Behaviour: 700ms latency → toggles `Market.isFrozen` in sim store.
- UI hint: when `isFrozen`, the public market card shows a small "Frozen" pill and trade buttons disable. (To wire into `MarketCard` later; for now visible only on the admin escrow page table.)
- Toast: `"Market frozen"` / `"Market unfrozen"`.

## Gaps from production
- No corresponding REST endpoint to surface frozen state to public clients fast — must add `GET /api/escrow/frozen-markets` or expose `isFrozen` in `/api/markets`.

# Escrow Admin

## Real implementation
- Contract: `EscrowVault` (`contracts/src/escrow/EscrowVault.sol`)
  - `setTimelockDuration(uint256 newDuration)` — L189 — withdrawal timelock seconds.
  - `freezeMarket(bytes32 questionId)` / `unfreezeMarket(bytes32 questionId)` — see `freeze-unfreeze.md`.
  - All `onlyOwner`.

## Form params

| Form | field | type | notes |
|---|---|---|---|
| Set timelock | `seconds` | `number` | typical 86400 (1 day) |

## Prototype simulation
- File: `src/app/admin/escrow/page.tsx`.
- Service: `adminSetTimelock(seconds)`.
- Store: `escrowConfig: { timelock: number, frozenMarkets: string[] }`.
- Page lists all markets with a per-row Freeze/Unfreeze toggle (cross-references the `freeze-unfreeze` action).
- Toast: `"Timelock set to <N> seconds"`.

## Gaps from production
- Timelock applies to ALL withdrawals; no per-market override exists. Future work: add `setMarketTimelock(questionId, seconds)`.

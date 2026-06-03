# Exchange Admin

## Real implementation
- Contract: `AgriExchange` (`contracts/src/exchange/AgriExchange.sol`)
  - `setOperator(address operator, bool status)` — L117 — emits `OperatorUpdated`. Whitelists order operators (off-chain matchers).
  - `registerToken(uint256 tokenId, bool status)` — L125 — single outcome token.
  - `registerTokens(uint256[] tokenIds, bool status)` — L133 — batch.
  - `setFeeCollector(address newCollector)` — L143 — emits `FeeCollectorUpdated`.
  - All `onlyOwner`.

## Form params

| Form | field | type | notes |
|---|---|---|---|
| Set operator | `address` | `0x…` | |
|  | `status` | `boolean` | on/off |
| Register tokens (batch) | `tokenIds` | `bigint[]` | comma-separated input |
|  | `status` | `boolean` | |
| Set fee collector | `address` | `0x…` | |

## Prototype simulation
- File: `src/app/admin/exchange/page.tsx`.
- Service: `adminSetOperator(address, status)`, `adminRegisterTokens(ids, status)`, `adminSetFeeCollector(addr)`.
- Store: `exchangeConfig: { operators: Record<string, boolean>, registeredTokens: Record<string, boolean>, feeCollector: string }`.
- Toasts: action-specific.

## Gaps from production
- No off-chain index of operators; the table reads only from sim store. Real prod would need an event-indexed table.

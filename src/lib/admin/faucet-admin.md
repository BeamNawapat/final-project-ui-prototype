# Faucet Admin

## Real implementation

### Contract — `contracts/src/tokens/TestUSDC.sol`

Three entry points. Two public, one admin.

| Function | Sig | Auth | Cooldown | Notes |
|---|---|---|---|---|
| `faucet` | `external` | public | gated against `msg.sender` | Mints fixed `FAUCET_AMOUNT = 10,000 tUSDC` (L14) |
| `faucetTo` | `(address to, uint256 amount) external` | public | gated against `to` | Custom amount |
| `mint` | `(address to, uint256 amount) external` | `onlyOwner` (L69) | **none** | Admin liquidity, arbitrary amount |

Constants (immutable):
- `FAUCET_COOLDOWN = 1 hours` — L15
- `FAUCET_AMOUNT = 10,000 * 10**6` — L14 (6 decimals)
- `DECIMALS = 6` — L13
- `mapping(address => uint256) public lastFaucetTime` — L17 per-address tracking

Cooldown check (L38–41 and L55–58):
```solidity
require(block.timestamp >= lastFaucetTime[user] + FAUCET_COOLDOWN, "TestUSDC: faucet cooldown not elapsed");
lastFaucetTime[user] = block.timestamp;
```

### Backend — `backend/src/routes/faucet.ts`

Duplicates the cooldown via a Redis TTL key per address (`backend/src/routes/faucet.ts:57–146`).  Faster fail than the on-chain revert. Both layers enforce 1h.  No admin endpoint exists to change the cooldown — flushing Redis is the only side-channel override.

## Form params

| Form | field | type | notes |
|---|---|---|---|
| Mint (admin) | `to` | `0x…` | 0x-prefixed 40-hex regex check |
|  | `amount` | `number` (USDC) | clamped `[1, 10_000_000]`, integer, multiplied to `* 10**6` on submit |

No editable cooldown / amount form — both are `constant` in Solidity.

## Prototype simulation
- File: `src/app/admin/faucet/page.tsx`.
- Service: `adminMintTestUSDC(to, amount)` in `src/lib/sim/service.ts` — 800 ms latency, fake tx hash, if `to == wallet.address` bumps the in-memory balance.
- Toast: `Minted <amount> USDC → <truncated addr> · tx 0x…`.
- Read-only "Public faucet (constants)" card displays `FAUCET_COOLDOWN`, `FAUCET_AMOUNT`, entry-point reference, and a `GapBanner` explaining why neither is editable.
- Number-input guards: `min`, `max`, integer step, clamping on change + blur, inline red error when `< 1`. Address regex check with inline red error.

## Gaps from production
- **No admin override of cooldown** anywhere — neither contract nor backend exposes a setter. To make cooldown configurable: turn `FAUCET_COOLDOWN` into a storage variable + add `setFaucetCooldown(uint256) onlyOwner`.
- Same for `FAUCET_AMOUNT` — currently fixed at 10,000 tUSDC.
- Backend Redis TTL key is config-only; an admin endpoint (e.g. `PATCH /api/admin/faucet/cooldown`) would still need to be added even if the contract becomes mutable, because the Redis layer is the first guard.
- The `mint` entry point's `onlyOwner` gate is the only operational lever today.

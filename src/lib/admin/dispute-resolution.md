# Dispute Resolution (Owner Override)

## Real implementation
- Backend: **gap** — no admin override endpoint exists yet.
- Contract: `AgriOracleV2.resolveDispute(bytes32 questionId, bool uphold)` — `contracts/src/core/AgriOracleV2.sol:441`
  - `uphold=true` → original reporter answer stands.
  - `uphold=false` → flips outcome.
  - Emits `ResolutionFinalized(questionId, outcomeIdx)`.
  - Gated `onlyOwner`.

## Form params

| field | type | notes |
|---|---|---|
| marketId | `string` | UI form picks via select (only `DISPUTED` markets shown) |
| uphold | `boolean` | radio: "Uphold reporter" vs "Flip outcome" |

## Prototype simulation
- File: `src/app/admin/markets/[id]/page.tsx` (action button visible when status=DISPUTED).
- Service: `adminResolveDispute(marketId, uphold)`.
- Behaviour: 1100ms latency → flips status `DISPUTED → RESOLVED`. If `uphold=true`, uses `proposedOutcome`. If `uphold=false`, inverts binary (`YES↔NO`) or picks the next bracket index for multi.
- Toast: `"Dispute resolved — outcome upheld"` or `"Dispute resolved — outcome flipped to <label>"`.

## Gaps from production
- Backend endpoint missing; only on-chain owner call exists. UI receipt notes this.
- No reason/notes field — production should add an audit trail (off-chain) for why the override happened.

# Resolve Market / Trigger Resolution Cycle

## Real implementation
- Backend (manual single resolve): `POST /api/admin/markets/:id/resolve` → `resolveMarket(id)` in `backend/src/services/resolution.ts:8` — `backend/src/routes/resolution.ts:154`
- Backend (cycle all due): `POST /api/admin/resolution/trigger` → `triggerResolutionCycle()` — `backend/src/routes/resolution.ts:202`
- Contract: indirect — backend reads `AgriOracleV2` signed price, calls the market's settle path.
- Auth: **none today (gap)**.

## Prototype simulation
- Files: `src/components/admin/admin-markets-table.tsx` row action + `src/app/admin/markets/[id]/page.tsx` action button.
- Service: `adminResolveMarket(marketId)` + `adminTriggerResolutionCycle()` in `src/lib/sim/service.ts`.
- Behaviour: 900ms latency → flips status to `RESOLVED`, populates `resolvedOutcome` with mock oracle price compared against `threshold` (binary) or bracket boundaries (multi).
- Toast: `"Resolved <Product> — <YES|NO> @ <price>"` or `"Resolved <Product> — bracket N @ <price>"`.
- Cycle action: walks every market past `resolutionTime` and runs the single-resolve mutation in sequence, with one toast per resolution.

## Gaps from production
- Production resolves immediately to whatever oracle reports; no admin override of price.
- No undo path — resolution is final on-chain.

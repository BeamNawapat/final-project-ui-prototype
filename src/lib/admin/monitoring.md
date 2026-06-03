# Admin Dashboard / Monitoring

## Real implementation
- `GET /api/markets` (aggregate counts client-side)
- `GET /api/resolution/pending` — `backend/src/routes/resolution.ts`
- `GET /api/trades` — `backend/src/routes/trades.ts`
- `GET /api/admin/oracle-lifecycle/status` — `backend/src/routes/resolution.ts:232`
- Bull Board worker dashboard — `MODE=monitor` standalone — `backend/src/monitor.ts` (link only, runs on its own port).

## Panels on `/admin` dashboard

| Panel | Source | Notes |
|---|---|---|
| Stage counts | sim-store filter | `ACTIVE`, `REPORTING`, `DISPUTE`, `DISPUTED`, etc. |
| Pending resolutions | markets where `resolutionTime` past + status `ACTIVE` | 1-click resolve action per row |
| Recent trades | mock trades array in sim store | scrolling latest |
| Oracle lifecycle health | mock queue depths (random ±drift every 5s) | links to gap note for real implementation |
| Worker queues link | external | open `http://localhost:3002` in new tab — gap-marked since standalone Bull Board may not be running locally |

## Prototype simulation
- File: `src/app/admin/page.tsx`.
- Reads: `useSim().markets`, recent trades (seeded into sim store from `src/lib/mocks/trades.ts`), `oracleParams`.
- No write actions on dashboard except quick-resolve buttons in the pending list (delegates to `adminResolveMarket`).

## Gaps from production
- All endpoints are unauthed — must add admin auth.
- Mock recent-trades list is fully fabricated; real implementation should hit `GET /api/trades?limit=10`.

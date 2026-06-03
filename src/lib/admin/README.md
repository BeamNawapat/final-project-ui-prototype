# Admin Topics — Index

Each file in this folder documents one admin "topic" (one or more related actions). Every doc follows the same template so wiring the real implementation later is mechanical.

## Map

| File | Actions |
|---|---|
| `auth-gate.md` | how `isAdmin` is simulated and gated |
| `create-binary-market.md` | Create Binary Market |
| `create-multibracket-market.md` | Create Multi-Bracket Market |
| `resolve-market.md` | Resolve Market, Trigger Resolution Cycle |
| `dispute-resolution.md` | Resolve Dispute (owner override) |
| `freeze-unfreeze.md` | Freeze / Unfreeze Market |
| `cancel-pause-resume.md` | Cancel / Pause / Resume Market (gaps) |
| `oracle-params.md` | Reporting window, default & per-question dispute period, lifecycle health |
| `reporters.md` | View / add / remove / slash reporter (mostly gaps) |
| `exchange-admin.md` | Operator allowlist, token registry, fee collector |
| `escrow-admin.md` | Timelock duration + freeze refs |
| `faucet-admin.md` | Mint TestUSDC, cooldown |
| `monitoring.md` | Dashboard panels |

## How to read these

Each doc has:

1. **Real implementation** — backend endpoint + contract function + auth strategy. Cite file:line so the next dev can `cmd+click` directly.
2. **Form params** — exact field shape that matches the real backend payload + contract args.
3. **Prototype simulation** — file path + behaviour + toast string + sim-store mutations.
4. **Gaps from production** — what's missing in the real backend/contracts today.

## Sim layer cheat-sheet

- `useSim()` Zustand store — `markets`, `wallet`, `oracleParams`, `exchangeConfig`, `escrowConfig`, etc.
- `useIsAdmin()` — `src/lib/sim/admin.ts`
- All admin actions live in `src/lib/sim/service.ts`, prefixed `admin*`.
- Every admin action returns `Promise<{ txHash: string }>` after a 600–1500ms simulated latency.

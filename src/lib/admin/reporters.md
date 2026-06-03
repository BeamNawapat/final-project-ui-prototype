# Reporters

## Reality check (verified via code read)

The previous version of this doc described admin-driven add / remove / slash actions. **None of those exist.** Audit results from `contracts/src/core/AgriOracleV2.sol`:

| Function | Line | Auth | Notes |
|---|---|---|---|
| `registerReporter() payable` | L121 | **public, self-service** | Anyone can call. Sends ETH as stake. |
| `unregisterReporter()` | L162 | **public, self-service** | Only the reporter themselves. |
| internal slash | L299–302 | **autonomous, no caller** | Runs inside `settleReports()` after median aggregation. Deducts fixed `SLASH_AMOUNT = 0.05 ether` (L35). Emits `ReporterSlashed(rep, questionId, amount)`. |
| `getReporter(address)` | L506 | public view | Read-only |

## What exists in the backend

| Endpoint | Method | Use |
|---|---|---|
| `GET /api/oracle/reporters` | — | Read-only list with stake / reports / accuracy / slashedCount |

No admin route to add, remove, or slash a reporter. No auth gate either.

## Prototype state

The Reporters admin page renders:
- **Read-only summary** — total reporters, active count, total staked, active threshold (0.5 ETH).
- **Read-only table** — address, stake (ETH), reports, accuracy, slashed count, status.
- **"How the registry works" panel** — plain text facts citing the contract: register is self-service, unregister is self-service, slash is autonomous and fixed.
- **No admin buttons**. No Add / Remove / Slash. The prototype previously had these — they were hallucinations.

## Gaps (real, for future scope)

- No admin path to forcibly remove a malicious reporter (currently only autonomous slash + their own unregister).
- No admin path to refund a wrongly-slashed reporter.
- No way to update `SLASH_AMOUNT` without redeploy (it's a `constant`).
- `ACTIVE_THRESHOLD` of 0.5 ETH is hardcoded in production frontend (`frontend/src/app/admin/reporters/page.tsx:93`), not in the contract.

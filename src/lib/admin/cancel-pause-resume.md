# Cancel / Pause / Resume Market — DOES NOT EXIST

## Audit result (verified via grep)

```bash
grep -rn "pauseMarket\|resumeMarket\|cancelMarket" backend/ contracts/   # zero matches
grep -rn "pause\|cancel\|halt\|circuit" contracts/src/                   # zero relevant matches
```

There is **no contract function and no backend route** for pausing, resuming, or cancelling a market anywhere in the codebase. The Prisma `MarketStatus` enum lists `PAUSED` and `CANCELLED` values, but no admin path ever writes them.

## Prototype state

These actions are **removed from the admin UI** entirely. The market detail page does not show Pause / Resume / Cancel tiers. The sim service no longer exports `adminPauseMarket`, `adminResumeMarket`, `adminCancelMarket`.

## What would be needed (future scope)

If we ever want this:
- **Pause / Resume**: add a per-market circuit-breaker in `AgriExchange` (gates `placeOrder` based on a frozen flag), plus a `pauseTrading(questionId)` / `resumeTrading(questionId)` `onlyOwner` function. Wire `POST /admin/markets/:id/pause` + `/resume`.
- **Cancel**: needs (1) a factory function `cancelMarket(questionId, reasonHash)` that flips status, (2) escrow refund logic that releases collateral to all holders pro-rata, (3) a worker job to settle refunds, (4) a backend route + admin auth gate.

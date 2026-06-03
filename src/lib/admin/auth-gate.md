# Admin Auth Gate

## Real implementation
- Production: `frontend/src/app/admin/layout.tsx:24` calls `useIsAdmin()` (from `frontend/src/web3/hooks/use-is-admin`) — wallet allowlist check, addresses sourced from env var (`NEXT_PUBLIC_ADMIN_WALLETS` comma-separated).
- Backend: **no auth middleware exists today** — all admin REST routes are public (see `gaps`). Production must add a signed-message middleware before mainnet.

## Prototype simulation
- File: `src/lib/sim/admin.ts`
- Stores `isAdmin: boolean` in the sim store (persisted via `localStorage`).
- Hook `useIsAdmin()` returns the flag.
- Setter `setIsAdmin(boolean)` flipped by a dev-only toggle inside the wallet popover (`src/components/wallet/fake-connect-button.tsx` → "Become Admin / Leave Admin" button).
- `src/app/admin/layout.tsx` renders 3 states:
  1. `wallet.connected === false` → "Connect wallet to access admin".
  2. `wallet.connected && !isAdmin` → "Access denied — `<addr>` is not an admin".
  3. `wallet.connected && isAdmin` → render `<AdminShell>` with sidebar + content.

## Gaps from production
- No real signature check on admin actions — must add EIP-712 signed nonce + server-side allowlist verification before going live.
- Production frontend only gates the UI; backend endpoints remain public. Real prod must dual-gate.

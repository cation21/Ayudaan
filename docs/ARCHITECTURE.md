# Architecture

This is the living version of spec section 8 — keep it in sync with
`apps/api/src/interfaces` and `apps/api/src/services` as they change.

## Services (Single Responsibility)

| Service | Owns | Does not own |
|---|---|---|
| `VerificationService` | Tier assignment, re-verification | Payments, ledger, grants |
| `LedgerService` | Append-only ledger writes/reads | Payments, chain anchoring |
| `PaymentService` | Charge/refund/webhooks | Payout policy decisions |
| `GrantService` | Application/review/approval workflow | Ledger writes (delegates to `LedgerService`) |
| `ChainAnchorService` | Merkle batching + submission via `IChainAnchor` | Everything else — this is the only module that should ever import a chain SDK |

## Interfaces (Open/Closed + Dependency Inversion)

- `PaymentProvider` — `apps/api/src/interfaces/payment-provider.ts`
- `IdentityVerifier` — `apps/api/src/interfaces/identity-verifier.ts`
- `IChainAnchor` — `apps/api/src/interfaces/chain-anchor.ts` (implementation:
  `@ayudaan/chain-anchor`'s `PolygonAnchorAdapter`)
- `ILedgerRepository` — `apps/api/src/interfaces/ledger-repository.ts`

Adding a new payment rail, verifier, or anchor chain means adding a new
implementation of the relevant interface — not editing the service that
consumes it.

## Auth surfaces (Interface Segregation)

Three logins, three route modules, one shared identity system:

- `src/auth/default-login.ts` — individuals
- `src/auth/org-login.ts` — NGOs/Companies; Org Admin vs. Reviewer role is
  resolved via `org_memberships` after login, not by which endpoint was used
- `src/auth/dev-login.ts` — local dev only, isolated, hard-disabled outside
  `NODE_ENV !== "production"`, removable with one line in
  `src/routes/index.ts`

## Data model

See `apps/api/src/db/schema.ts` — mirrors spec section 5 (verification
tiers), section 7 (grants), and section 9 (append-only ledger, chain
anchor batches).

## Full context

`docs/spec/ayudaan-spec-v0.3.md` is the source of truth for product
decisions. This file only tracks how the code maps to it.

# Ayudaan

Transparent, verified need & donation platform — India-first, CSR/grant-focused.
Money moves through regulated fiat rails; a public, hash-chained ledger
(periodically anchored to Polygon) provides independent proof it was used as
claimed.

**Status:** Phase 0 (pre-incorporation pilot). This is a structural scaffold —
see `docs/spec/ayudaan-spec-v0.3.md` for the full spec and
`docs/ARCHITECTURE.md` for how the code maps to it.

## Layout

```
apps/web                   Vite + React frontend
apps/api                   Express + Drizzle backend
packages/shared-types      Types shared between web and api
packages/chain-anchor      IChainAnchor + PolygonAnchorAdapter
packages/fraud-heuristics  Interface only in this repo — see its own README
docs/                      Spec, architecture doc, ADRs
```

## Quickstart

See `CONTRIBUTING.md`.

## Note on secrets

`.env.example` lists every variable the app expects, with placeholder values.
Never commit a real `.env`. `CHAIN_ANCHOR_WALLET_PRIVATE_KEY` and
`DEV_ADMIN_*` in particular should never hold real values outside a local
machine — see spec section 9.

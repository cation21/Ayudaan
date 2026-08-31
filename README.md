# Ayudaan

Ayudaan aims to be a common platform for the following activites:
1. A transparent donation platform where verified users can ask for donation for their causes, including individual, organizations etc.
2. Every transaction is verifiable on-chain and immutable.
3. Proof of work after donation is necessary, fund will be released in batches if the amount is high to make sure the work is getting done(via an internal team)
4. CSR made easy with NGOs making requests or claiming the CSR budget and guidelines posted on the platform. It will get released and proof of work will also exist likewise.

Currently in progress. If you want to contribute go through CONTRIBUTING.md

**Status:** Phase 0 (pre-incorporation pilot). This is a structural scaffold,
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

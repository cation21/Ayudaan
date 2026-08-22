# ADR 0003: Decouple money rail from proof rail

**Status:** Accepted

## Context

Every blockchain-donation platform studied (Giveth, Gitcoin,
BitGive/GiveTrack) anchors the donation itself on-chain, which is a large
part of why none reached mainstream India adoption — it adds a crypto
on-ramp step, and collides with Indian crypto-tax/FCRA rules (spec
section 10).

## Decision

Money moves through UPI/regulated fiat rails. The blockchain is used only
to anchor hashes of ledger batches (ADR 0002) — never to move donor funds.

## Consequences

- Donors and NGOs never need a wallet.
- The optional crypto donation rail (spec section 11, Phase 5) is a
  separate, later, clearly-optional feature — not a prerequisite for the
  transparency guarantee.

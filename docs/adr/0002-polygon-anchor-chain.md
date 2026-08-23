# ADR 0002: Polygon as the anchoring chain

**Status:** Accepted

## Context

The transparency ledger needs a public, independently verifiable
tamper-evidence layer beyond the database's own hash-chaining, without
requiring donors or NGOs to hold or transact in crypto.

## Decision

Anchor a Merkle root of batched ledger entries to Polygon on a scheduled
interval, paid for by a platform-owned operational wallet (POL, formerly
MATIC) — never by donors.

## Consequences

- Anyone can verify a batch's root against Polygon independently of
  Ayudaan's own servers.
- Batching (not anchoring every row) keeps gas cost and transaction rate
  low.
- The concrete integration lives behind `IChainAnchor`
  (`@ayudaan/chain-anchor`'s `PolygonAnchorAdapter`) so a future chain
  change is a new adapter, not a rewrite (spec section 8).
- Hot wallet key management (rotation, balance alerts, secrets manager) is
  an operational requirement, not just a code concern — see spec section 9.

# ADR 0001: PostgreSQL over MongoDB

**Status:** Accepted

## Context

The donation ledger, phased payout release, and the CSR/grant program are
inherently relational — donations reference posts, grant applications
reference grants and organizations, org memberships reference both users
and organizations.

## Decision

Use PostgreSQL via Drizzle ORM instead of MongoDB.

## Consequences

- Native ACID transactions and real foreign-key/CHECK constraints enforce
  integrity at the database level (a donation can't reference a
  nonexistent post, amounts can't go negative) instead of relying solely on
  application-level validation.
- No replica-set operational overhead just to get transactional guarantees,
  unlike the earlier MongoDB setup.
- See spec section 8 for how `ILedgerRepository` keeps this an
  implementation detail behind an interface, in case it ever needs to
  change again.

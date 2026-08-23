# ADR 0004: Three login surfaces, one identity system

**Status:** Accepted

## Context

Individuals, organizations (with internally scoped Reviewer roles), and
the development team all need to authenticate, with very different
privilege levels and audiences.

## Decision

Three route-level login surfaces — Default, Organizational,
Development/Ops — backed by one underlying identity system. Role within an
organization (Admin vs. Reviewer) is resolved via `org_memberships` after
authentication, not by which endpoint was used.

## Consequences

- The Development/Ops login is structurally isolated (own file, own
  router) so it can be stripped from any production or public build with a
  one-line change (`src/routes/index.ts`), and is hard-disabled outside
  local dev regardless.
- Any production "platform staff" elevated access must go through a real
  role in the normal identity system, not the dev login — see spec
  section 9.

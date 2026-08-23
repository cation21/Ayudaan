# ADR 0005: Manual admin approval via requireDevAuth, not a new role

**Status:** Accepted (interim)

## Context

Document-Verified status for organizations needs *some* human-in-the-loop
approval step — spec section 6 explicitly allows "even a manual
admin-approves-after-reviewing-documents version" as acceptable for now,
since there's no automated way to check Darpan/12A/80G against a real
registry yet. That approval action needs to be gated behind something.

The correct long-term answer, per spec section 9, is a `Platform Staff`
role living inside the same identity system as everyone else — scoped,
audited, MFA-gated. That role doesn't exist yet, and building it means
deciding how staff accounts get provisioned in the first place, which is
a real product/ops question, not just a schema change.

## Decision

Gate the verification-approval routes (`GET /organizations/pending`,
`POST /organizations/:id/verify`) behind `requireDevAuth` — the same
Development/Ops login surface already documented as isolated and
dev-only — rather than either (a) leaving the routes unprotected, or (b)
building a throwaway parallel "temp admin" auth system just for this.

## Consequences

- The admin approval flow is real and testable today, not blocked on
  designing staff provisioning.
- The frontend `Admin` page deliberately does not go through the shared
  `AuthContext` — its session is local to the page, consistent with
  dev-login's existing isolation.
- This is explicitly interim. When a real `Platform Staff` role is built,
  swapping `requireDevAuth` for `requirePlatformStaffAuth` in
  `routes/organizations.ts` is a one-line change per route — the
  verification *logic* doesn't move, just which middleware gates it.

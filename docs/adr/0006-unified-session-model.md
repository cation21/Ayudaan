# ADR 0006: One session, individual XOR org, not both at once

**Status:** Accepted

## Context

The frontend needed to support Organizational Login (previously only
usable via curl) alongside the existing individual login. A person could
in principle hold both an individual account and organization
membership — the question is whether a single browser session should be
able to represent both simultaneously.

## Decision

`lib/auth.ts` stores one `StoredSession`, a discriminated union of
`{ type: "individual", ... }` or `{ type: "org", ... }` — never both.
Logging in one way replaces whatever session was previously stored.

## Consequences

- Matches how most real login systems behave (you're logged in as one
  identity at a time; switching means logging in again), so the mental
  model needed no new UI concept beyond the existing login form gaining
  an Individual/Organization toggle.
- `AuthContext` stays a single `session` field rather than two parallel
  ones, which is what let `PostCard`'s author-check and `AppShell`'s
  profile-link logic stay simple `session?.type === "..."` checks.
- If a genuine need for simultaneous dual identity emerges later (e.g., a
  reviewer wanting to donate personally without logging out of their org
  session), this needs revisiting — noted here rather than solved
  speculatively now.

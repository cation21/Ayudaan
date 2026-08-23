# ADR 0007: Likes and comments are real ₹1 contributions, not decorative UI

**Status:** Accepted

## Context

Spec section 4.3 specifies a "minimum ₹1 pay-to-interact gate for
comments/reactions on a post... every interaction is itself a
micro-donation." Earlier rounds shipped a "₹1 to interact" label in the
UI with no like button, no comment box, and nothing charged — the label
described a mechanic that didn't exist.

## Decision

Implement likes and comments as real calls into the same contribution
pipeline a donation uses: `PaymentService.charge` → `LedgerService`
entry → `posts.raisedAmount` bump → funded-status check. Extracted that
shared pipeline into `ContributionService` so donate/like/comment don't
each duplicate it. A like is one-time per (post, user), enforced by a
unique database index — it's a real donation, not a toggleable social
reaction, so "unliking" isn't a refund and isn't offered. Comments
require Default Login specifically, since an anonymous comment doesn't
fit a social feed the way an anonymous donation does.

## Consequences

- Every like and comment is a real, auditable ledger entry
  (`likes`/`comments` rows both carry a `ledgerEntryId`) — verified
  end-to-end: a donate + like + comment on one post produced exactly
  three ledger entries summing correctly into `raisedAmount`.
- A post can reach "funded" status from accumulated ₹1 interactions
  alone, not just direct donations — an accurate consequence of taking
  the spec's own wording literally, not an edge case to special-case
  around.
- Because `MockPaymentProvider` is still in place, no real money moves
  yet — this becomes meaningfully more consequential (a real charge on
  every like) once a real `PaymentProvider` is wired in, which is worth
  remembering before that swap: the UX should make the ₹1 charge
  unmistakable at that point, not just labeled in small print.

# @ayudaan/fraud-heuristics

Intentionally minimal in this repo.

Per spec section 13: fraud-detection heuristics and verification-partner
specifics are kept in their own package precisely so this one package can
stay private or stubbed when the rest of the codebase eventually opens up
(section 11, Phase 6), without anything else needing to change. Real
heuristics live outside this public scaffold — only the interface below is
public.

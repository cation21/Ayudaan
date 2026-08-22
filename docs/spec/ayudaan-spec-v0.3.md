# Ayudaan — Product & Technical Specification

**Version:** 0.3 (supersedes v0.2)
**Status:** Pre-build planning — ready for scaffolding

## Changelog from v0.2

- **Polygon confirmed** as the on-chain anchoring network — replaces the "low-fee L2, TBD" language (§3, §9, §11).
- **Authentication architecture defined**: three distinct login surfaces — Default (individual users), Organizational (NGOs/Companies, with Reviewers distinguished by role rather than a separate endpoint), and Development/Ops (env-file-based, dev-only, structurally isolated). This also updates §7, which previously described a standalone `/reviewer-login` (§9).
- **§13 expanded** into "Open-Source Strategy & Repository Structure" with a concrete monorepo layout, ADR convention, and module boundaries chosen so contributor-readability doesn't conflict with keeping fraud-detection logic private.

---

## 1. Vision

**V1 — what we're building first:** An India-first platform where verified individuals, NGOs, and companies post funding needs, and donors give directly through regulated fiat rails (UPI/Razorpay), with every transaction recorded on a public, tamper-evident ledger. Core promise: *"You don't have to trust the platform — you can see the money move, and see it was used as claimed."*

**The actual wedge is institutional, not viral:** due-diligence-as-a-service for CSR-linked NGO funding (automated Darpan/12A/80G/CSR-1 verification) and structured, mandatory proof-of-use tracking — both are named, evidenced gaps no Indian platform currently closes. The individual-post social feed is the **on-ramp**: it's what makes the platform feel alive and produces the "here's exactly what happened to the last ₹X donated" case studies the CSR pitch depends on (§11). This is deliberately not an attempt to out-compete Ketto/Milaap on viral individual crowdfunding.

**Long-term (explicitly Phase 4+, not v1):** A global platform where people in conflict zones or under political risk can request help while staying personally safe and anonymous.

## 2. Problem Statement

**Donor-side:** Companies with CSR obligations (India's mandatory CSR pool is roughly ₹26,000 crore/year under Companies Act §135) and individual donors don't trust that money reaches the right hands or gets used as claimed — late disbursement, weak NGO due diligence, and no post-disbursement visibility are the recurring, named failure modes.

**Requester-side:** Verified NGOs, NPOs, and individuals in genuine need struggle to get discovered and trusted — especially smaller or newer organizations without a multi-year track record.

| Platform | Gap |
|---|---|
| Ketto / Milaap | Social-signal-driven trust; no structured post-disbursement proof-of-use |
| GiveIndia (Give.do) | Gatekeeping vetting model; closed to individual need-based requests |
| ImpactGuru | Same structural gap — virality substitutes for verifiable proof |
| Giveth / Gitcoin / BitGive-GiveTrack | Proves on-chain donation ledgers work technically, but anchors the *donation itself* on-chain — crypto-native, which is why none reached mainstream India adoption |

## 3. Strategic Architecture Decision: Decouple Money Rail from Proof Rail

Every blockchain-donation project studied anchors the donation itself on-chain — donors pay in crypto. That's why none reached mainstream India adoption: it adds an on-ramp step neither donors nor NGOs have reason to take on, and it collides with Indian regulation (§10).

**Decision:** money moves through UPI/regulated fiat rails. The ledger is a separate, append-only, cryptographically hash-chained record of *decisions and disbursements* (approval timestamps, disbursement records, proof-of-use document hashes) — publicly queryable, and **anchored to Polygon at scheduled intervals** for independent, public tamper-evidence (mechanism in §9). Nobody needs a wallet to donate, and nobody needs one to verify a donation history — the platform, not the donor, bears the (minimal) on-chain cost.

## 4. Target Users

| User type | Description | Key needs |
|---|---|---|
| Verified Individual | Person directly in need, or a trusted representative | Safety/anonymity, ease of posting, fast payout access |
| Registered NGO | Verified nonprofit organization | Bulk campaign posting, credibility signaling, reporting tools |
| Company / CSR Donor | Businesses donating as part of CSR | Public recognition, receipts, tax documentation |
| Individual Donor | General public | Trust signals, low-friction micro-donations, transparency |
| Org Reviewer / Company Auditor | Company-internal, scoped to one org | Grant application review tools, approval audit trail |
| Moderator / Trust & Safety | Platform-side | Verification workflows, fraud detection, takedown tools |

## 5. Verification Model (Tiered Trust)

| Tier | Who | Verification method | Platform limits |
|---|---|---|---|
| Unverified | New individual accounts | Email/phone only | Lower donation cap, no proof-of-use required |
| Community-Verified | Individual vouched for by a verified NGO partner | Partner NGO confirms identity/need out-of-band | Standard donation cap |
| ID-Verified | Individual with government ID | Aadhaar eKYC (OTP) + DigiLocker pull of a government-issued document | Full donation cap |
| Document-Verified | NGO/Company | Darpan ID checked against NITI Aayog registry + 12A/80G confirmed + manual document review | Full features, campaign tools |
| CSR-Eligible *(additive to Document-Verified)* | NGO applying to the Grant Program | All of Document-Verified, plus CSR-1 registration confirmed | Eligible for Application-Based Grants; Direct Grants at a company's discretion |
| Anonymous-but-Verified *(Phase 4+)* | At-risk individual (conflict zone, etc.) | Identity verified privately by a trusted partner org; public handle stays pseudonymous | Full donation cap, identity never exposed publicly |

**Why CSR-Eligible is separate from Document-Verified:** CSR-1 registration is what makes a company's disbursement legally count as CSR spend — it isn't the same thing as general nonprofit legitimacy (12A/80G).

## 6. Core Features (v1 scope)

Retained from v0.1 — Accounts & Profiles, Posts (need requests, budget-commitment posts), Interactions, Payments, Moderation & Reporting — with two corrections:

- **Anonymity & Safety Layer moves to Phase 4** (pseudonymous handles, no-IP-logging, Tor mirror). EXIF stripping on media uploads is cheap enough to build early and stays in v1.
- **The ₹1 pay-to-interact gate needs an explicit rate limit**, not just a price floor — see §9.

## 7. CSR & Grant Program

Two funding modes:
- **Direct Grant** — company selects a specific CSR-Eligible NGO, commits a budget, no application process.
- **Application-Based Grant** — company publishes criteria; any CSR-Eligible NGO may apply; the company's internal reviewers approve, reject, or partially fund.

Org Admins invite/revoke Reviewer access, scoped to one company. **Reviewers authenticate through the Organizational Login (§9)**, not a separate endpoint — role (Org Admin vs. Reviewer) is distinguished after login via RBAC (§8's Interface Segregation), not by which door they walked through.

**Reuse, not duplication:** once a grant is awarded, it becomes a standard Post with a standard Donation ledger entry — same hash-chain transparency, proof-of-use flow, phased payout release, and Trust panel apply automatically. *This depends on the data model in `core-logic.md`, which hasn't been provided — treat as carried over, not independently verified (§12).*

## 8. Software Architecture & Design Principles

**Single Responsibility** — each service owns exactly one concern:
- `VerificationService` — tier assignment and re-verification only.
- `LedgerService` — append-only hash-chain writes and public queries only; doesn't know about payments or chain anchoring directly.
- `PaymentService` — charge/refund/webhook handling only.
- `GrantService` — application/review/approval workflow only; produces a Post + Ledger entry via the services above rather than writing to either directly.
- `ChainAnchorService` — batches ledger entries into a Merkle root and submits it to Polygon on schedule; nothing else touches the chain.

**Open/Closed** — new rails, verifiers, and anchor chains are addable without editing existing logic:
- `PaymentProvider` interface (`charge`, `refund`, `verify`) — `RazorpayProvider`, `UPIProvider`, later `CryptoProvider`.
- `IdentityVerifier` interface — `AadhaarDigiLockerVerifier`, `NGOVouchVerifier`, `ManualDocumentVerifier`.
- **`IChainAnchor` interface — `PolygonAnchorAdapter` is the only implementation today, but `ChainAnchorService` never talks to a Polygon SDK directly.** If the anchor chain ever changes, it's a new adapter, not a rewrite of ledger logic.

**Liskov Substitution** — any `PaymentProvider`, `IdentityVerifier`, or `IChainAnchor` implementation honors the same contract regardless of concrete backend, so the calling service never needs to know which one it's holding.

**Interface Segregation** — permission interfaces are narrow: `CanApproveGrant`, `CanFreezePayout`, `CanVerifyOrg` are separate, so a Reviewer role (§9) implements only what it needs and can't reach Org-Admin-only or platform-wide actions through a shared interface.

**Dependency Inversion** — services depend on abstractions: `LedgerService` → `ILedgerRepository`, not Drizzle/Postgres directly; `ChainAnchorService` → `IChainAnchor`, not a Polygon SDK directly; `VerificationService` → `IIdentityVerifier`, not the DigiLocker SDK directly.

**Practical effect:** every module named above is also a natural contribution boundary for open-source contributors (§13) — someone can add a `CryptoProvider` or review `ChainAnchorService` without reading the verification or grant code at all.

## 9. Security Architecture

**Authentication & Authorization — three distinct surfaces**
- **Default Login** (`/login`) — individual users: Verified Individual, Individual Donor, Unverified. Standard session/JWT auth.
- **Organizational Login** (`/org-login`) — NGOs and Companies. Org Admins and their invited Reviewers both authenticate here and land in role-scoped dashboards; underneath, `CanApproveGrant`/`CanFreezePayout`/etc. (§8) keep a Reviewer session from ever reaching Org-Admin-only or platform-wide actions, even though the login surface is shared. One org-auth module is easier for a new contributor to read than two near-duplicate ones.
- **Development/Ops Login** — env-file-based credentials (e.g. `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD_HASH`), for local development and internal debug tooling **only**. This must never be the access path for anything in production — an env var isn't an audited, per-person, revocable credential. Elevated production access (e.g. unfreezing a payout) goes through a `Platform Staff` role inside the same identity system as everyone else — logged, scoped, MFA-gated — not a parallel login. Keep this module in its own file/package (§13) so it's trivial to strip out of, or disable in, any production or public build.

**On-chain anchoring (Polygon)**
- A platform-owned hot wallet, holding a small, replenished balance of POL (Polygon's gas token, formerly MATIC), signs and submits anchoring transactions. Donors and NGOs never touch a wallet or pay gas — this is an internal operational cost, not a donor-facing feature, and is unrelated to the optional crypto *donation* rail in Phase 5.
- Anchor a **Merkle root of a batch of ledger entries** on a schedule (e.g. hourly/daily) rather than one transaction per donation — a changed row anywhere in the batch changes the root, so tampering is still detectable, at a fraction of the cost and rate of anchoring every row.
- Hot wallet private key lives in a secrets manager/KMS, never in the repo or a plaintext `.env` outside local dev; rotate periodically; alert if the balance drops below a threshold (a silently empty wallet quietly stops anchoring, which is worse than a loud failure).
- Anyone can independently verify a batch's Merkle root against Polygon via a public RPC or block explorer — that's the actual trust property this buys, and it holds even if Ayudaan's own servers are compromised.

**Payment security**
- No card or bank data touches Ayudaan's servers — Razorpay/Stripe hosted checkout only (PCI-DSS scope stays at SAQ-A).
- Webhooks signature-verified before processing; every donation write is idempotent (keyed on provider transaction ID).

**Ledger integrity (database layer)**
- Ledger table is append-only at the DB role level — app credentials for ledger writes have `INSERT` only, no `UPDATE`/`DELETE`.
- Each record's hash includes the previous record's hash, independent of the Polygon anchoring layer above — two overlapping tamper-evidence mechanisms, not one.

**Data protection**
- KYC documents (Aadhaar/PAN via DigiLocker) encrypted at rest, field-level encryption for identifiers, access logged per-view.
- TLS in transit everywhere; uploads pass through EXIF/GPS stripping before storage.
- Retention policy for verification documents remains an open question (§12).

**Abuse & fraud resistance**
- The ₹1 gate is necessary but not sufficient against spam — rate-limit per account per post in addition to the payment floor.
- ID-Verified tier (§5) is the platform's real Sybil-resistance mechanism for financial actions (Gitcoin's "Human Passport" lesson: the payment rail alone doesn't prove uniqueness).
- Payout-freeze and verification-override actions logged immutably with actor, timestamp, and reason.

**Secure development baseline**
- Drizzle's parameterized queries as the primary injection defense.
- Secrets in environment/secret-manager only, never committed — enforced by `.env.example` convention (§13).
- Dependency scanning in CI before the Phase 6 open-source release.

## 10. Regulatory Considerations

- Crypto is legal to hold/transact in India but **not legal tender**; RBI has signaled interest in tighter restriction, not looser.
- **Crypto donations aren't tax-deductible** — treated as disposal of an asset, taxed at 30% (plus 1% TDS on VDA transfers), removing the donor incentive. The Polygon anchoring above is unaffected by this — it's the platform anchoring hashes with its own operational wallet, not a donor transacting in crypto — but the optional donor-facing crypto rail (Phase 5) must stay clearly optional and carry this caveat in-product.
- **FCRA has no accommodation for crypto** — foreign contributions must route through a designated FCRA bank account.
- Cross-border transfers generally may trigger money-transmission/AML-KYC obligations depending on jurisdiction — flagged for legal review before Phase 7.
- Recommend legal consultation before enabling real-money transactions at meaningful scale.

## 11. Roadmap (Reconciled)

**Phase 0 — Pre-incorporation pilot**
- Unincorporated; no Section 8 status required. Manual/semi-automated rails only (UPI collect links + manual reconciliation).
- Seed cohort: 10–20 orgs, Hyderabad (T-Hub + dense NGO ecosystem), recruited via personal network + college E-cells + local NGO meetups; prioritize orgs already holding Darpan/12A/80G.
- Goal: 2–3 complete request → approval → disbursement → proof-of-use cycles, published, before opening wider.

**Phase 1 — MVP (post-incorporation)**
- Core social feed, posts, real fiat payments (Razorpay/Stripe merchant integration), basic profile/verification.
- ID-Verified tier live alongside Community-Verified and Document-Verified. No chain anchoring yet.
- Go-to-market: individual donors before corporates.

**Phase 2 — Verification & moderation pipeline**
- Full tiered verification, admin review dashboard, fraud flagging. CSR-Eligible tier and CSR-1 checks live.

**Phase 3 — Transparency ledger + Corporate/CSR onboarding**
- Hash-chained public transaction log, batched and **anchored to Polygon** on a scheduled interval (§9).
- Approach CSR teams only once orgs hold verified Darpan/12A/80G/CSR-1, and at least one full cycle is live and public. Pitch leads with compliance-readiness. Target mid-size companies first.

**Phase 4 — Privacy/anonymity hardening**
- Tor mirror, IP-logging exclusions, EXIF stripping hardened platform-wide, pseudonymous-but-verified tier.

**Phase 5 — Optional crypto donation rail**
- Secondary payment option for donors once fiat flow is stable, with §10's caveats surfaced in-product. Distinct from the Polygon anchoring in Phase 3, which donors never interact with directly.

**Phase 6 — Open-source release**
- Published once verification/fraud-prevention logic is reasoned through, using the module boundaries in §13 to keep fraud heuristics private while the rest opens up.

**Phase 7 — Global scale-out**
- Region-specific compliance review, partner-NGO network expansion.

## 12. Open Questions

Resolved since v0.1:
- ~~Which region to launch first~~ → Hyderabad.
- ~~Initial partner NGOs~~ → seed cohort via personal network + college E-cells + local NGO meetups.
- ~~Anchor chain choice~~ → Polygon (§3, §9).
- ~~Login architecture~~ → Default / Organizational / Development-Ops (§9).

Still open:
- Fraud-review SLA before a post goes live.
- Refund mechanism for funds raised on a post later found fraudulent.
- Data retention policy for verification documents.
- Open-source license choice (MIT/Apache-2.0/other) — needed before Phase 6.
- Whether `core-logic.md`'s grant-to-post reuse model needs revision given CSR-1 gating (§5) — needs review once that file is available.

## 13. Open-Source Strategy & Repository Structure

Contributor-readability is a stated goal, not just a Phase 6 checkbox — the codebase should be structured for it from the start, even though public release timing stays Phase 6.

**Suggested monorepo layout:**
```
/apps
  /web              — Vite + React frontend
  /api              — Express + Drizzle backend
/packages
  /shared-types     — types shared between web and api
  /chain-anchor     — IChainAnchor + PolygonAnchorAdapter, isolated so it can be swapped or mocked independently
  /fraud-heuristics — kept private / stubbed in the public repo (see below); rest of the repo doesn't depend on its internals, only its interface
/docs
  ARCHITECTURE.md    — the SOLID mapping in §8, kept in sync with code
  /adr               — one short file per major decision (Postgres over Mongo, Polygon as anchor chain, hash-chain-plus-anchor over full on-chain, three-surface auth) — §3/§8/§9/§10 of this doc are effectively the first ADRs, worth splitting out as the project grows
.env.example         — every required variable named with a placeholder value, committed; the real .env is gitignored
CONTRIBUTING.md       — setup steps, coding conventions, how to run migrations/tests locally
```

- Every interface named in §8 (`PaymentProvider`, `IdentityVerifier`, `IChainAnchor`, `ILedgerRepository`) gets a short doc-comment on the contract itself, not just the implementation — that's what lets a contributor add a new provider without reading the whole codebase.
- Fraud-detection heuristics and verification-partner specifics stay in their own package (`/packages/fraud-heuristics`) — a direct application of the Single-Responsibility boundary in §8 — so that one package can be kept private or stubbed in the public repo without disturbing anything else. This resolves the "open source, but don't publish the fraud playbook" tension structurally instead of by convention.
- The Development/Ops login module (§9) lives in its own file/package for the same reason — easy to exclude entirely from a public or production build.
- License: not yet chosen — tracked in §12; needed before Phase 6 since it defines what "contribute" means legally for outside participants.

## Appendix A: UI Reference

Screenshots referenced in v0.1 are placeholder inspiration art branded "HelpChain" — not a naming candidate. Pattern worth preserving in the data model: the "Trust & Transparency" panel (trust score + compliance checklist + ledger link) recurs across org, individual, and post views — one reusable component fed by the verification data model (§5), not three separate implementations. Post types: standard need-request, funded/proof-of-work (dual-state: pending upload / uploaded, community verify-or-flag), and org budget-commitment ("Budget to Donate").

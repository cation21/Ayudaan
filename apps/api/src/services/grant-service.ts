import { LedgerService } from "./ledger-service.js";
// TODO: import a PostRepository once posts have a repository interface too.

// Single Responsibility (spec section 8): application/review/approval
// workflow only. A grant becomes a normal Post + Ledger entry (spec
// section 7) via the services below, rather than writing to either
// directly.
export class GrantService {
  constructor(private readonly ledgerService: LedgerService) {}

  async awardGrant(_grantApplicationId: number): Promise<void> {
    // TODO:
    // 1. Verify the applicant organization holds the csr_eligible tier
    //    (spec section 5) — do NOT rely on document_verified alone.
    // 2. Create a standard Post for the awarded amount.
    // 3. Record the disbursement via this.ledgerService.recordDonation(...).
    throw new Error("Not implemented — scaffold only.");
  }
}

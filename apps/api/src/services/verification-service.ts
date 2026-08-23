import type {
  IdentityVerifier,
  VerificationTier,
} from "../interfaces/identity-verifier.js";

// Single Responsibility (spec section 8): tier assignment and
// re-verification only. Does not know about payments, ledger, or grants.
export class VerificationService {
  constructor(private readonly verifiers: Record<string, IdentityVerifier>) {}

  async assignTier(subjectId: string, method: string): Promise<VerificationTier> {
    const verifier = this.verifiers[method];
    if (!verifier) {
      throw new Error(`No verifier registered for method: ${method}`);
    }
    const result = await verifier.verify(subjectId);
    // TODO: persist result.tier + result.verifiedAt on the user/organization row.
    return result.tier;
  }
}

export type VerificationTier =
  | "unverified"
  | "community_verified"
  | "id_verified"
  | "document_verified"
  | "csr_eligible"
  | "anonymous_but_verified";

// spec section 8 — Open/Closed: AadhaarDigiLockerVerifier, NGOVouchVerifier,
// ManualDocumentVerifier all implement this; a future region-specific
// verifier is a new implementation, not a rewrite of VerificationService.
export interface IdentityVerifier {
  verify(subjectId: string): Promise<{ tier: VerificationTier; verifiedAt: Date }>;
}

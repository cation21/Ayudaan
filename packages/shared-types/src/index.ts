export type VerificationTier =
  | "unverified"
  | "community_verified"
  | "id_verified"
  | "document_verified"
  | "csr_eligible"
  | "anonymous_but_verified";

export type OrgRole = "admin" | "reviewer";

export interface PublicAuthor {
  displayName: string;
  kind: "individual" | "organization";
  verificationTier: VerificationTier;
}

export interface PublicPost {
  id: number;
  author: PublicAuthor;
  authorUserId: number | null;
  authorOrganizationId: number | null;
  title: string;
  description: string;
  category: string | null;
  requestedAmount: string;
  raisedAmount: string;
  status: "draft" | "active" | "funded" | "closed" | "flagged";
  daysLeft?: number;
}

export interface PublicLedgerEntry {
  id: number;
  postId: number;
  donorDisplayName: string | null; // null = anonymous
  amount: string;
  hash: string;
  prevHash: string | null;
  createdAt: string;
}

export interface ProofEntry {
  id: number;
  postId: number;
  documentUrl: string;
  documentHash: string;
  verifiedByCommunity: boolean;
  uploadedAt: string;
}

export interface LikeStatus {
  count: number;
  likedByMe: boolean;
}

export interface PostComment {
  id: number;
  postId: number;
  body: string;
  authorDisplayName: string;
  createdAt: string;
}

export interface TrustCheck {
  label: string;
  passed: boolean;
}

export interface TrustPanelData {
  trustScore: number; // 0-100
  verificationTier: VerificationTier;
  checks: TrustCheck[];
  ledgerUrl?: string;
}

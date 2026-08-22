export type VerificationTier =
  | "unverified"
  | "community_verified"
  | "id_verified"
  | "document_verified"
  | "csr_eligible"
  | "anonymous_but_verified";

export type OrgRole = "admin" | "reviewer";

export interface PublicLedgerEntry {
  id: number;
  postId: number;
  amount: string;
  hash: string;
  prevHash: string | null;
  createdAt: string;
}

export interface PublicPost {
  id: number;
  title: string;
  description: string;
  category: string | null;
  requestedAmount: string;
  raisedAmount: string;
  status: "draft" | "active" | "funded" | "closed" | "flagged";
}

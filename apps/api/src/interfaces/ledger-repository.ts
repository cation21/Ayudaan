export interface LedgerEntryInput {
  postId: number;
  donorUserId: number | null;
  amount: string;
  providerTransactionId: string;
}

export interface LedgerEntryRecord {
  id: number;
  postId: number;
  donorUserId: number | null;
  amount: string;
  hash: string;
  prevHash: string | null;
  createdAt: Date;
}

// spec section 8 — Dependency Inversion: LedgerService depends on this,
// not on Drizzle/Postgres directly.
export interface ILedgerRepository {
  append(entry: LedgerEntryInput): Promise<{ id: number; hash: string }>;
  getChainForPost(postId: number): Promise<LedgerEntryRecord[]>;
}

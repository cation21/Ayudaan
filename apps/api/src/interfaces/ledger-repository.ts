export interface LedgerEntryInput {
  postId: number;
  donorUserId: number | null;
  amount: string;
  providerTransactionId: string;
}

export interface LedgerEntryRecord {
  id: number;
  hash: string;
  prevHash: string | null;
}

// spec section 8 — Dependency Inversion: LedgerService depends on this,
// not on Drizzle/Postgres directly.
export interface ILedgerRepository {
  append(entry: LedgerEntryInput): Promise<{ id: number; hash: string }>;
  getChainForPost(postId: number): Promise<LedgerEntryRecord[]>;
}

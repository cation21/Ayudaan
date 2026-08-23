import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../client.js";
import { ledgerEntries } from "../schema.js";
import type {
  ILedgerRepository,
  LedgerEntryInput,
  LedgerEntryRecord,
} from "../../interfaces/ledger-repository.js";

function computeHash(payload: {
  postId: number;
  donorUserId: number | null;
  amount: string;
  providerTransactionId: string;
  prevHash: string | null;
}): string {
  // Canonical JSON of the fields that make this entry unique, chained to
  // the previous entry's hash — the actual tamper-evidence mechanism
  // described in spec section 9, independent of the later Polygon
  // anchoring layer.
  const canonical = JSON.stringify(payload);
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Concrete ILedgerRepository (spec section 8 — Dependency Inversion).
 * LedgerService depends on the interface, not on this class or on Drizzle
 * directly, so the backing store can change without touching
 * LedgerService.
 *
 * The chain is global across the whole table (ordered by id), not
 * fragmented per post — a single linear chain is what makes the ledger's
 * integrity a property of the entire audit log, not of each post in
 * isolation.
 */
export class DrizzleLedgerRepository implements ILedgerRepository {
  async append(entry: LedgerEntryInput): Promise<{ id: number; hash: string }> {
    return db.transaction(async (tx) => {
      const [last] = await tx
        .select({ hash: ledgerEntries.hash })
        .from(ledgerEntries)
        .orderBy(desc(ledgerEntries.id))
        .limit(1);

      const prevHash = last?.hash ?? null;
      const hash = computeHash({ ...entry, prevHash });

      const [inserted] = await tx
        .insert(ledgerEntries)
        .values({
          postId: entry.postId,
          donorUserId: entry.donorUserId,
          amount: entry.amount,
          providerTransactionId: entry.providerTransactionId,
          prevHash,
          hash,
        })
        .returning({ id: ledgerEntries.id, hash: ledgerEntries.hash });

      return { id: inserted.id, hash: inserted.hash };
    });
  }

  async getChainForPost(postId: number): Promise<LedgerEntryRecord[]> {
    return db
      .select({
        id: ledgerEntries.id,
        postId: ledgerEntries.postId,
        donorUserId: ledgerEntries.donorUserId,
        amount: ledgerEntries.amount,
        hash: ledgerEntries.hash,
        prevHash: ledgerEntries.prevHash,
        createdAt: ledgerEntries.createdAt,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.postId, postId))
      .orderBy(ledgerEntries.id);
  }
}

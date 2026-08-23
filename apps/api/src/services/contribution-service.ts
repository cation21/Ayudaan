import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { posts } from "../db/schema.js";
import { LedgerService } from "./ledger-service.js";
import { PaymentService } from "./payment-service.js";

export interface ContributionResult {
  ledgerEntryId: number;
  hash: string;
}

/**
 * Orchestrates the shared "charge -> ledger -> raisedAmount -> funded
 * check" workflow that donations, likes, and comments all reduce to —
 * spec section 4.3: "every interaction is itself a micro-donation."
 * Composes PaymentService + LedgerService rather than duplicating this
 * pipeline in every route that can move money. Extracted from the
 * donate handler when likes/comments needed the exact same flow.
 */
export class ContributionService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly ledgerService: LedgerService
  ) {}

  async contribute(
    postId: number,
    donorUserId: number | null,
    amountInPaise: number
  ): Promise<ContributionResult> {
    const { providerTransactionId } = await this.paymentService.charge(amountInPaise, { postId });
    const amountRupees = (amountInPaise / 100).toFixed(2);

    const entry = await this.ledgerService.recordDonation({
      postId,
      donorUserId,
      amount: amountRupees,
      providerTransactionId,
    });

    await db
      .update(posts)
      .set({ raisedAmount: sql`${posts.raisedAmount} + ${amountRupees}` })
      .where(eq(posts.id, postId));

    const [updatedPost] = await db
      .select({ raisedAmount: posts.raisedAmount, requestedAmount: posts.requestedAmount, status: posts.status })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (
      updatedPost &&
      updatedPost.status === "active" &&
      Number(updatedPost.raisedAmount) >= Number(updatedPost.requestedAmount)
    ) {
      await db.update(posts).set({ status: "funded" }).where(eq(posts.id, postId));
    }

    return { ledgerEntryId: entry.id, hash: entry.hash };
  }
}

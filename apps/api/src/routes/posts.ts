import { eq, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import type { PublicLedgerEntry } from "@ayudaan/shared-types";
import { attachIndividualIfPresent, requireAnyAuth } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { posts, users } from "../db/schema.js";
import { DrizzleLedgerRepository } from "../db/repositories/ledger-repository.js";
import { MockPaymentProvider } from "../payments/mock-payment-provider.js";
import { LedgerService } from "../services/ledger-service.js";
import { PaymentService } from "../services/payment-service.js";
import { PostQueryService } from "../services/post-query-service.js";

export const postsRouter = Router();

// Composition root for this route module — real implementations wired to
// the interfaces from spec section 8. Swapping MockPaymentProvider for
// RazorpayProvider later is a one-line change here, nowhere else.
const postQueryService = new PostQueryService();
const ledgerService = new LedgerService(new DrizzleLedgerRepository());
const paymentService = new PaymentService(new MockPaymentProvider());

postsRouter.get("/posts", async (_req, res) => {
  const list = await postQueryService.listActive();
  res.json(list);
});

// Either a logged-in individual or a logged-in organization can post a
// need — requireAnyAuth (spec section 8) accepts either login surface,
// and whichever one succeeded determines the author fields below.
postsRouter.post("/posts", requireAnyAuth, async (req, res) => {
  const { title, description, category, requestedAmount } = req.body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ message: "title is required." });
    return;
  }
  if (typeof description !== "string" || !description.trim()) {
    res.status(400).json({ message: "description is required." });
    return;
  }
  const amount = Number(requestedAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "requestedAmount must be a positive number." });
    return;
  }

  const [post] = await db
    .insert(posts)
    .values({
      authorUserId: req.user?.userId ?? null,
      authorOrganizationId: req.orgSession?.organizationId ?? null,
      title: title.trim(),
      description: description.trim(),
      category: typeof category === "string" && category.trim() ? category.trim() : null,
      requestedAmount: amount.toFixed(2),
      raisedAmount: "0",
      status: "active",
    })
    .returning({ id: posts.id });

  res.status(201).json({ id: post.id });
});

postsRouter.get("/posts/:id/ledger", async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }

  const entries = await ledgerService.getPublicHistory(postId);

  // Resolve donorUserId -> display name here, not in LedgerService/the
  // repository — the ledger's own responsibility is the chain's
  // integrity, not knowing how a user's name is displayed (spec
  // section 8, Single Responsibility).
  const donorIds = [...new Set(entries.map((e) => e.donorUserId).filter((id): id is number => id !== null))];
  const donors = donorIds.length
    ? await db
        .select({ id: users.id, displayName: users.displayName, email: users.email })
        .from(users)
        .where(inArray(users.id, donorIds))
    : [];
  const donorNameById = new Map(donors.map((d) => [d.id, d.displayName ?? d.email ?? "Donor"]));

  const publicEntries: PublicLedgerEntry[] = entries.map((e) => ({
    id: e.id,
    postId: e.postId,
    donorDisplayName: e.donorUserId ? donorNameById.get(e.donorUserId) ?? "Donor" : null,
    amount: e.amount,
    hash: e.hash,
    prevHash: e.prevHash,
    createdAt: e.createdAt.toISOString(),
  }));

  res.json(publicEntries);
});

// attachIndividualIfPresent: donating doesn't require a login, but if a
// valid Default Login token IS present, the donation is attributed to
// that user instead of staying anonymous.
postsRouter.post("/posts/:id/donate", attachIndividualIfPresent, async (req, res) => {
  const postId = Number(req.params.id);
  const { amountInPaise } = req.body ?? {};

  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }
  if (typeof amountInPaise !== "number" || amountInPaise <= 0) {
    res.status(400).json({ message: "amountInPaise must be a positive number." });
    return;
  }

  // NOTE (spec section 9): MockPaymentProvider always succeeds so this
  // path is demoable locally without real Razorpay keys. A real
  // PaymentProvider should be confirmed via a signature-verified,
  // idempotent webhook rather than trusting this response directly.
  const { providerTransactionId } = await paymentService.charge(amountInPaise, { postId });

  const amountRupees = (amountInPaise / 100).toFixed(2);

  const entry = await ledgerService.recordDonation({
    postId,
    donorUserId: req.user?.userId ?? null,
    amount: amountRupees,
    providerTransactionId,
  });

  await db
    .update(posts)
    .set({ raisedAmount: sql`${posts.raisedAmount} + ${amountRupees}` })
    .where(eq(posts.id, postId));

  // Bug fix: nothing previously set status to "funded", even though the
  // frontend PostCard already renders a "Fully funded" state for it —
  // that state was unreachable before this.
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

  res.status(201).json({ ledgerEntryId: entry.id, hash: entry.hash });
});

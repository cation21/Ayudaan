import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { attachIndividualIfPresent, requireIndividualAuth } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { comments, likes, users } from "../db/schema.js";
import { DrizzleLedgerRepository } from "../db/repositories/ledger-repository.js";
import { MockPaymentProvider } from "../payments/mock-payment-provider.js";
import { ContributionService } from "../services/contribution-service.js";
import { LedgerService } from "../services/ledger-service.js";
import { PaymentService } from "../services/payment-service.js";

export const interactionsRouter = Router();

// Same composition-root pattern as posts.ts — a separate instance, not a
// shared import, so each route module stays independently readable
// (spec section 13: one module, one thing to understand).
const contributionService = new ContributionService(
  new PaymentService(new MockPaymentProvider()),
  new LedgerService(new DrizzleLedgerRepository())
);

// ₹1 — spec section 4.3's "pay to interact" gate, made real. Every like
// and comment is a genuine ContributionService.contribute() call: a
// mocked charge, a real ledger entry, and a real bump to the post's
// raisedAmount — not a cosmetic label next to a free button.
const INTERACTION_FEE_PAISE = 100;

interactionsRouter.get("/posts/:id/likes", attachIndividualIfPresent, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }

  const rows = await db.select().from(likes).where(eq(likes.postId, postId));
  const likedByMe = req.user ? rows.some((r) => r.userId === req.user!.userId) : false;
  res.json({ count: rows.length, likedByMe });
});

// A like can't be un-given once made — it's a real ₹1 donation, not a
// toggleable reaction. Double-clicking (or a retried request) is
// idempotent: an existing like just returns the current state rather
// than charging twice.
interactionsRouter.post("/posts/:id/like", requireIndividualAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }

  const [existing] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, req.user!.userId)))
    .limit(1);

  if (existing) {
    res.json({ liked: true, alreadyLiked: true });
    return;
  }

  const contribution = await contributionService.contribute(postId, req.user!.userId, INTERACTION_FEE_PAISE);
  await db.insert(likes).values({ postId, userId: req.user!.userId, ledgerEntryId: contribution.ledgerEntryId });

  res.status(201).json({ liked: true, alreadyLiked: false });
});

interactionsRouter.get("/posts/:id/comments", async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }

  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      body: comments.body,
      createdAt: comments.createdAt,
      authorDisplayName: users.displayName,
      authorEmail: users.email,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);

  res.json(
    rows.map((r) => ({
      id: r.id,
      postId: r.postId,
      body: r.body,
      authorDisplayName: r.authorDisplayName ?? r.authorEmail ?? "Someone",
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

// Comments require a real Default Login session (not attach-if-present)
// — unlike donations, an anonymous comment doesn't fit the "social feed"
// this round is building toward: a comment is only meaningful attached
// to a visible identity.
interactionsRouter.post("/posts/:id/comments", requireIndividualAuth, async (req, res) => {
  const postId = Number(req.params.id);
  const { body } = req.body ?? {};

  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }
  if (typeof body !== "string" || !body.trim()) {
    res.status(400).json({ message: "body is required." });
    return;
  }

  const contribution = await contributionService.contribute(postId, req.user!.userId, INTERACTION_FEE_PAISE);

  const [comment] = await db
    .insert(comments)
    .values({ postId, userId: req.user!.userId, ledgerEntryId: contribution.ledgerEntryId, body: body.trim() })
    .returning();

  res.status(201).json({
    id: comment.id,
    postId: comment.postId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  });
});

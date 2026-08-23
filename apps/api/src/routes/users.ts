import { desc, eq, inArray } from "drizzle-orm";
import { Router } from "express";
import { requireOrgAuth } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { ledgerEntries, organizations, posts, users, vouches } from "../db/schema.js";
import { PostQueryService } from "../services/post-query-service.js";

export const usersRouter = Router();

const postQueryService = new PostQueryService();

async function getUser(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

// Public profile — deliberately narrow: no email, no passwordHash.
usersRouter.get("/users/:id", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ message: "Invalid user id." });
    return;
  }

  const user = await getUser(userId);
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  res.json({
    id: user.id,
    displayName: user.displayName,
    verificationTier: user.verificationTier,
    createdAt: user.createdAt.toISOString(),
  });
});

usersRouter.get("/users/:id/posts", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ message: "Invalid user id." });
    return;
  }
  res.json(await postQueryService.listByUser(userId));
});

// Donations this user has made (ledger entries where they were the
// donor) — only ever includes non-anonymous donations by construction,
// since an anonymous donation is recorded with donorUserId = null and
// therefore can never be attributed back to a user, by anyone.
usersRouter.get("/users/:id/donations-made", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ message: "Invalid user id." });
    return;
  }

  const rows = await db
    .select({
      id: ledgerEntries.id,
      postId: ledgerEntries.postId,
      postTitle: posts.title,
      amount: ledgerEntries.amount,
      createdAt: ledgerEntries.createdAt,
    })
    .from(ledgerEntries)
    .innerJoin(posts, eq(ledgerEntries.postId, posts.id))
    .where(eq(ledgerEntries.donorUserId, userId))
    .orderBy(desc(ledgerEntries.createdAt));

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

// Donations received across all of this user's posts — joins through
// posts rather than assuming a single post, since a profile aggregates
// across everything they've posted.
usersRouter.get("/users/:id/donations-received", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ message: "Invalid user id." });
    return;
  }

  const rows = await db
    .select({
      id: ledgerEntries.id,
      postId: ledgerEntries.postId,
      postTitle: posts.title,
      donorUserId: ledgerEntries.donorUserId,
      amount: ledgerEntries.amount,
      createdAt: ledgerEntries.createdAt,
    })
    .from(ledgerEntries)
    .innerJoin(posts, eq(ledgerEntries.postId, posts.id))
    .where(eq(posts.authorUserId, userId))
    .orderBy(desc(ledgerEntries.createdAt));

  const donorIds = [...new Set(rows.map((r) => r.donorUserId).filter((id): id is number => id !== null))];
  const donors = donorIds.length
    ? await db
        .select({ id: users.id, displayName: users.displayName, email: users.email })
        .from(users)
        .where(inArray(users.id, donorIds))
    : [];
  const donorNameById = new Map(donors.map((d) => [d.id, d.displayName ?? d.email ?? "Donor"]));

  res.json(
    rows.map((r) => ({
      id: r.id,
      postId: r.postId,
      postTitle: r.postTitle,
      donorDisplayName: r.donorUserId ? donorNameById.get(r.donorUserId) ?? "Donor" : null,
      amount: r.amount,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

// Community-Verified vouching (spec section 5) — a Document-Verified (or
// higher) org vouches for an individual, promoting them from unverified
// to community_verified. Requires org auth so the vouching organization
// is unambiguous, and only promotes — never downgrades someone who
// already holds a higher tier.
usersRouter.post("/users/:id/vouch", requireOrgAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ message: "Invalid user id." });
    return;
  }

  const [voucherOrg] = await db
    .select({ verificationTier: organizations.verificationTier })
    .from(organizations)
    .where(eq(organizations.id, req.orgSession!.organizationId))
    .limit(1);

  if (!voucherOrg || voucherOrg.verificationTier === "unverified") {
    res.status(403).json({ message: "Only a Document-Verified (or higher) organization can vouch." });
    return;
  }

  const user = await getUser(userId);
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }
  if (user.verificationTier !== "unverified") {
    res.status(409).json({ message: `User already holds tier "${user.verificationTier}".` });
    return;
  }

  await db.insert(vouches).values({
    voucherOrganizationId: req.orgSession!.organizationId,
    vouchedUserId: userId,
  });

  const [updated] = await db
    .update(users)
    .set({ verificationTier: "community_verified" })
    .where(eq(users.id, userId))
    .returning({ id: users.id, verificationTier: users.verificationTier });

  res.json(updated);
});

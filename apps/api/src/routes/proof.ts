import { eq } from "drizzle-orm";
import type { Request } from "express";
import { Router } from "express";
import multer from "multer";
import { requireAnyAuth, requireIndividualAuth } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { posts, proofOfUse } from "../db/schema.js";
import { LocalDiskStorage } from "../storage/local-disk-storage.js";

export const proofRouter = Router();

// In-memory buffer, then handed to IDocumentStorage — keeps the storage
// swap (local disk -> S3/R2 later) independent of how multer is wired.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const documentStorage = new LocalDiskStorage();

async function getPost(postId: number) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  return post ?? null;
}

function isPostAuthor(
  post: { authorUserId: number | null; authorOrganizationId: number | null },
  req: Request
): boolean {
  if (req.user && post.authorUserId === req.user.userId) return true;
  if (req.orgSession && post.authorOrganizationId === req.orgSession.organizationId) return true;
  return false;
}

proofRouter.get("/posts/:id/proof", async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }

  const entries = await db
    .select()
    .from(proofOfUse)
    .where(eq(proofOfUse.postId, postId))
    .orderBy(proofOfUse.uploadedAt);

  res.json(
    entries.map((e) => ({
      id: e.id,
      postId: e.postId,
      documentUrl: e.documentUrl,
      documentHash: e.documentHash,
      verifiedByCommunity: e.verifiedByCommunity,
      uploadedAt: e.uploadedAt.toISOString(),
    }))
  );
});

// Only the post's own author (individual or org) can upload proof —
// requireAnyAuth just gets us a session; we separately check it actually
// matches this post's author, not just "someone is logged in."
proofRouter.post("/posts/:id/proof", requireAnyAuth, upload.single("file"), async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }
  if (!req.file) {
    res.status(400).json({ message: 'file is required (multipart/form-data field "file").' });
    return;
  }

  const post = await getPost(postId);
  if (!post) {
    res.status(404).json({ message: "Post not found." });
    return;
  }
  if (!isPostAuthor(post, req)) {
    res.status(403).json({ message: "Only this post's author can upload proof of use." });
    return;
  }

  const stored = await documentStorage.save(req.file.buffer, req.file.originalname);

  const [entry] = await db
    .insert(proofOfUse)
    .values({
      postId,
      documentUrl: stored.url,
      documentHash: stored.hash,
      verifiedByCommunity: false,
    })
    .returning();

  res.status(201).json({
    id: entry.id,
    postId: entry.postId,
    documentUrl: entry.documentUrl,
    documentHash: entry.documentHash,
    verifiedByCommunity: entry.verifiedByCommunity,
    uploadedAt: entry.uploadedAt.toISOString(),
  });
});

// NOTE (simplification, flagged honestly): a single logged-in individual
// flipping this is not the threshold/voting model real community
// verification needs — one person can currently confirm it alone. Fine
// for demonstrating the mechanic end-to-end; needs a votes table +
// threshold before this is trustworthy at real scale.
proofRouter.post("/posts/:id/proof/:proofId/verify", requireIndividualAuth, async (req, res) => {
  const proofId = Number(req.params.proofId);
  if (!Number.isInteger(proofId)) {
    res.status(400).json({ message: "Invalid proof id." });
    return;
  }

  const [updated] = await db
    .update(proofOfUse)
    .set({ verifiedByCommunity: true })
    .where(eq(proofOfUse.id, proofId))
    .returning();

  if (!updated) {
    res.status(404).json({ message: "Proof entry not found." });
    return;
  }

  res.json({ id: updated.id, verifiedByCommunity: updated.verifiedByCommunity });
});

// NOTE (simplification, flagged honestly): flags the whole post for
// review. There is no moderation queue/admin UI yet (spec section 6,
// still deferred) — this just sets status and waits for someone with
// direct DB access to review it.
proofRouter.post("/posts/:id/flag", requireIndividualAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) {
    res.status(400).json({ message: "Invalid post id." });
    return;
  }

  const [updated] = await db
    .update(posts)
    .set({ status: "flagged" })
    .where(eq(posts.id, postId))
    .returning({ id: posts.id, status: posts.status });

  if (!updated) {
    res.status(404).json({ message: "Post not found." });
    return;
  }

  res.json(updated);
});

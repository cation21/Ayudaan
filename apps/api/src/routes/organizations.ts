import { eq, notInArray } from "drizzle-orm";
import { Router } from "express";
import { requireDevAuth } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { organizations } from "../db/schema.js";
import { PostQueryService } from "../services/post-query-service.js";

export const organizationsRouter = Router();

const postQueryService = new PostQueryService();

async function getOrganization(organizationId: number) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  return org ?? null;
}

// Manual-admin-approves Document-Verified workflow (as scoped in this
// round) — gated behind requireDevAuth as a stand-in for a real
// Platform Staff role (see docs/ARCHITECTURE.md). This does NOT check
// Darpan/12A/80G against any real registry — it records that a human
// (you, via dev credentials) reviewed the org's stated registration
// numbers and is vouching they're legitimate. CSR-1 / csr_eligible
// promotion is out of scope here — that's the Grant program's concern.
//
// Registered before /organizations/:id on purpose — otherwise Express
// would try to parse "pending" as a numeric id and 400 before this
// handler is ever reached.
organizationsRouter.get("/organizations/pending", requireDevAuth, async (_req, res) => {
  // Bug fix, caught while testing: filtering on "not document_verified"
  // put csr_eligible orgs (a HIGHER tier) into the pending queue forever,
  // since their tier is also technically "not document_verified."
  const pending = await db
    .select()
    .from(organizations)
    .where(notInArray(organizations.verificationTier, ["document_verified", "csr_eligible"]));
  res.json(
    pending.map((o) => ({
      id: o.id,
      name: o.name,
      orgType: o.orgType,
      darpanId: o.darpanId,
      reg12a80g: o.reg12a80g,
      csr1Registered: o.csr1Registered,
      verificationTier: o.verificationTier,
      createdAt: o.createdAt.toISOString(),
    }))
  );
});

// Public profile — the compliance fields (Darpan/12A-80G/CSR-1) are
// deliberately public; that's the whole point of the Trust panel (spec
// Appendix A).
organizationsRouter.get("/organizations/:id", async (req, res) => {
  const organizationId = Number(req.params.id);
  if (!Number.isInteger(organizationId)) {
    res.status(400).json({ message: "Invalid organization id." });
    return;
  }

  const org = await getOrganization(organizationId);
  if (!org) {
    res.status(404).json({ message: "Organization not found." });
    return;
  }

  res.json({
    id: org.id,
    name: org.name,
    orgType: org.orgType,
    darpanId: org.darpanId,
    reg12a80g: org.reg12a80g,
    csr1Registered: org.csr1Registered,
    verificationTier: org.verificationTier,
    createdAt: org.createdAt.toISOString(),
  });
});

organizationsRouter.get("/organizations/:id/posts", async (req, res) => {
  const organizationId = Number(req.params.id);
  if (!Number.isInteger(organizationId)) {
    res.status(400).json({ message: "Invalid organization id." });
    return;
  }
  res.json(await postQueryService.listByOrganization(organizationId));
});

organizationsRouter.post("/organizations/:id/verify", requireDevAuth, async (req, res) => {
  const organizationId = Number(req.params.id);
  if (!Number.isInteger(organizationId)) {
    res.status(400).json({ message: "Invalid organization id." });
    return;
  }

  const [updated] = await db
    .update(organizations)
    .set({ verificationTier: "document_verified" })
    .where(eq(organizations.id, organizationId))
    .returning({ id: organizations.id, verificationTier: organizations.verificationTier });

  if (!updated) {
    res.status(404).json({ message: "Organization not found." });
    return;
  }

  res.json(updated);
});

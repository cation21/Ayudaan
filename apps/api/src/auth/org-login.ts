import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { orgMemberships, organizations, users } from "../db/schema.js";
import { verifyPassword } from "./password.js";
import { signOrgToken } from "./jwt.js";

// Organizational Login surface (spec section 9) — NGOs and Companies.
// Org Admins and their invited Reviewers both authenticate here; role
// (admin vs reviewer) is resolved via org_memberships AFTER login, not by
// which endpoint was used (spec section 7, section 8 Interface
// Segregation).
export const orgLoginRouter = Router();

orgLoginRouter.post("/org-login", async (req, res) => {
  const { email, password, organizationId } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ message: "email and password are required." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const memberships = await db
    .select({
      organizationId: orgMemberships.organizationId,
      role: orgMemberships.role,
      organizationName: organizations.name,
    })
    .from(orgMemberships)
    .innerJoin(organizations, eq(orgMemberships.organizationId, organizations.id))
    .where(eq(orgMemberships.userId, user.id));

  if (memberships.length === 0) {
    res.status(403).json({ message: "This account is not a member of any organization." });
    return;
  }

  let membership = memberships[0];
  if (organizationId) {
    const match = memberships.find((m) => m.organizationId === organizationId);
    if (!match) {
      res.status(403).json({ message: "Not a member of the requested organization." });
      return;
    }
    membership = match;
  } else if (memberships.length > 1) {
    // Multiple orgs and none specified — let the client choose rather
    // than silently picking one.
    res.status(300).json({
      message: "Multiple organizations found — specify organizationId.",
      organizations: memberships.map((m) => ({
        id: m.organizationId,
        name: m.organizationName,
        role: m.role,
      })),
    });
    return;
  }

  const token = signOrgToken({
    userId: user.id,
    organizationId: membership.organizationId,
    role: membership.role,
  });
  res.json({
    token,
    organization: { id: membership.organizationId, name: membership.organizationName, role: membership.role },
  });
});

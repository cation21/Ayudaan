import { Router } from "express";

// Organizational Login surface (spec section 9) — NGOs and Companies.
// Org Admins and their invited Reviewers both authenticate here; role
// (admin vs reviewer) is resolved via org_memberships AFTER login, not by
// which endpoint was used (spec section 7, section 8 Interface
// Segregation).
export const orgLoginRouter = Router();

orgLoginRouter.post("/org-login", async (_req, res) => {
  // TODO: look up the org_memberships row by email, verify password, issue
  // a JWT signed with ORG_JWT_SECRET carrying { organizationId, role }.
  res.status(501).json({ message: "Not implemented — scaffold only." });
});

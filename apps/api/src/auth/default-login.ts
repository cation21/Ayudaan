import { Router } from "express";

// Default Login surface (spec section 9) — individual users only:
// Verified Individual, Individual Donor, Unverified.
export const defaultLoginRouter = Router();

defaultLoginRouter.post("/login", async (_req, res) => {
  // TODO: look up user by email/phone, verify password, issue a JWT signed
  // with JWT_SECRET (see .env.example).
  res.status(501).json({ message: "Not implemented — scaffold only." });
});

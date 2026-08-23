import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "./password.js";
import { signIndividualToken } from "./jwt.js";

// Default Login surface (spec section 9) — individual users only:
// Verified Individual, Individual Donor, Unverified.
export const defaultLoginRouter = Router();

defaultLoginRouter.post("/register", async (req, res) => {
  const { email, password, displayName } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ message: "email and password are required." });
    return;
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ message: "An account with this email already exists." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, displayName: displayName ?? null, passwordHash })
    .returning();

  const token = signIndividualToken({ userId: user.id });
  res.status(201).json({
    token,
    user: { id: user.id, displayName: user.displayName, verificationTier: user.verificationTier },
  });
});

defaultLoginRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ message: "email and password are required." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const token = signIndividualToken({ userId: user.id });
  res.json({
    token,
    user: { id: user.id, displayName: user.displayName, verificationTier: user.verificationTier },
  });
});

import { Router } from "express";
import { verifyPassword } from "./password.js";
import { signDevToken } from "./jwt.js";

// Development/Ops Login surface (spec section 9) — LOCAL DEVELOPMENT ONLY.
//
// This module is intentionally isolated in its own file so it can be
// excluded from any production or public build with a single import
// removed (see routes/index.ts). It must never be the access path for
// anything in a deployed environment — production elevated access goes
// through a `Platform Staff` role inside the normal identity system
// instead, not this router. Today it's the stand-in that gates the
// manual-admin-approves Document-Verified workflow (routes/organizations.ts)
// until that real role exists.
export const devLoginRouter = Router();

devLoginRouter.post("/dev-login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).end();
    return;
  }

  const { email, password } = req.body ?? {};
  if (email !== process.env.DEV_ADMIN_EMAIL) {
    res.status(401).json({ message: "Invalid credentials." });
    return;
  }

  const storedHash = process.env.DEV_ADMIN_PASSWORD_HASH;
  if (!storedHash || !(await verifyPassword(password ?? "", storedHash))) {
    res.status(401).json({ message: "Invalid credentials." });
    return;
  }

  const token = signDevToken({ email });
  res.json({ token });
});

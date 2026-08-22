import { Router } from "express";

// Development/Ops Login surface (spec section 9) — LOCAL DEVELOPMENT ONLY.
//
// This module is intentionally isolated in its own file so it can be
// excluded from any production or public build with a single import
// removed (see routes/index.ts). It must never be the access path for
// anything in a deployed environment — production elevated access goes
// through a `Platform Staff` role inside the normal identity system
// instead, not this router.
export const devLoginRouter = Router();

devLoginRouter.post("/dev-login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).end();
    return;
  }

  const { email } = req.body ?? {};
  if (email !== process.env.DEV_ADMIN_EMAIL) {
    res.status(401).json({ message: "Invalid credentials." });
    return;
  }

  // TODO: compare the submitted password against DEV_ADMIN_PASSWORD_HASH
  // with bcrypt, then issue a short-lived dev-only token. Left
  // unimplemented in this scaffold on purpose.
  res.status(501).json({ message: "Not implemented — scaffold only." });
});

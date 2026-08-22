import { Router } from "express";
import { defaultLoginRouter } from "../auth/default-login.js";
import { orgLoginRouter } from "../auth/org-login.js";
import { devLoginRouter } from "../auth/dev-login.js";

export const rootRouter = Router();

rootRouter.use(defaultLoginRouter);
rootRouter.use(orgLoginRouter);

// Isolated on purpose (spec section 9/13) — comment out or remove this one
// line to strip dev-only auth from a production or public build entirely.
rootRouter.use(devLoginRouter);

rootRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

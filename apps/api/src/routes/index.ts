import { Router } from "express";
import { defaultLoginRouter } from "../auth/default-login.js";
import { orgLoginRouter } from "../auth/org-login.js";
import { devLoginRouter } from "../auth/dev-login.js";
import { postsRouter } from "./posts.js";
import { proofRouter } from "./proof.js";
import { usersRouter } from "./users.js";
import { organizationsRouter } from "./organizations.js";
import { interactionsRouter } from "./interactions.js";

export const rootRouter = Router();

rootRouter.use(defaultLoginRouter);
rootRouter.use(orgLoginRouter);
rootRouter.use(postsRouter);
rootRouter.use(proofRouter);
rootRouter.use(usersRouter);
rootRouter.use(organizationsRouter);
rootRouter.use(interactionsRouter);

// Isolated on purpose (spec section 9/13) — comment out or remove this one
// line to strip dev-only auth from a production or public build entirely.
rootRouter.use(devLoginRouter);

rootRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

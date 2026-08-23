import { config } from "dotenv";

// Every script in this package runs with cwd = apps/api (npm workspaces
// convention), but there is a single .env at the repo root (see
// CONTRIBUTING.md) — load that explicitly rather than relying on dotenv's
// cwd-relative default, which would otherwise silently look for (and not
// find) apps/api/.env.
config({ path: "../../.env" });

// Fail fast: these three secrets must all differ pairwise, or the
// "try each secret in turn" logic (auth/middleware.ts requireAnyAuth,
// and anywhere a token could plausibly be presented to the wrong
// surface) can't tell token types apart on signature alone. Originally
// caught this with JWT_SECRET/ORG_JWT_SECRET (see git history / ADR
// 0004) — extended here now that DEV_JWT_SECRET exists too.
const secretPairs: [string, string][] = [
  ["JWT_SECRET", "ORG_JWT_SECRET"],
  ["JWT_SECRET", "DEV_JWT_SECRET"],
  ["ORG_JWT_SECRET", "DEV_JWT_SECRET"],
];
for (const [a, b] of secretPairs) {
  const valueA = process.env[a];
  const valueB = process.env[b];
  if (valueA && valueB && valueA === valueB) {
    throw new Error(`${a} and ${b} must be different values — see .env.example.`);
  }
}

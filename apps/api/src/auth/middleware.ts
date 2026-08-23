import type { NextFunction, Request, Response } from "express";
import {
  verifyDevToken,
  verifyIndividualToken,
  verifyOrgToken,
  type DevTokenPayload,
  type IndividualTokenPayload,
  type OrgTokenPayload,
} from "./jwt.js";

function extractBearerToken(req: Request): string | null {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

/**
 * Attaches req.user if a valid Default Login token is present, but does
 * NOT reject the request when absent. Routes that allow anonymous access
 * (donating) use this and check `req.user` afterwards; routes that
 * require a login use requireIndividualAuth instead.
 */
export function attachIndividualIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (token) {
    try {
      req.user = verifyIndividualToken(token);
    } catch {
      // invalid/expired — treat as not logged in rather than failing an
      // otherwise-anonymous-allowed request
    }
  }
  next();
}

export function requireIndividualAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ message: "Login required." });
    return;
  }
  try {
    req.user = verifyIndividualToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

/**
 * spec section 8 — Interface Segregation: this only ever grants a session
 * scoped to the organizationId embedded in the token itself, never
 * platform-wide access, regardless of role.
 */
export function requireOrgAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ message: "Login required." });
    return;
  }
  try {
    req.orgSession = verifyOrgToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

/**
 * For routes either an individual OR an organization can call (e.g.
 * creating a post) — tries the token against both secrets rather than
 * requiring a specific login surface. Whichever one verifies wins;
 * neither verifying is a 401.
 */
export function requireAnyAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ message: "Login required." });
    return;
  }
  try {
    req.user = verifyIndividualToken(token);
    next();
    return;
  } catch {
    // not a Default Login token — fall through and try Organizational Login
  }
  try {
    req.orgSession = verifyOrgToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

/**
 * Gates the manual-admin-approval routes (spec section 9/13 — isolated,
 * strippable module). This is a stand-in for a real `Platform Staff` role
 * inside the normal identity system — see docs/ARCHITECTURE.md for why
 * that distinction matters and hasn't been built yet.
 */
export function requireDevAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ message: "Login required." });
    return;
  }
  try {
    req.devSession = verifyDevToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IndividualTokenPayload;
      orgSession?: OrgTokenPayload;
      devSession?: DevTokenPayload;
    }
  }
}

import jwt from "jsonwebtoken";
import type { OrgRole } from "@ayudaan/shared-types";

export interface IndividualTokenPayload {
  typ: "individual";
  userId: number;
}

export interface OrgTokenPayload {
  typ: "org";
  userId: number;
  organizationId: number;
  role: OrgRole;
}

export interface DevTokenPayload {
  typ: "dev";
  email: string;
}

function requireSecret(name: "JWT_SECRET" | "ORG_JWT_SECRET" | "DEV_JWT_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

export function signIndividualToken(payload: Omit<IndividualTokenPayload, "typ">): string {
  return jwt.sign({ ...payload, typ: "individual" }, requireSecret("JWT_SECRET"), { expiresIn: "7d" });
}

/**
 * Verifies against JWT_SECRET AND checks the `typ` discriminator — not
 * just the signature. If the three secrets were ever misconfigured to
 * match, a signature check alone would let the wrong token type silently
 * "verify" here too; the typ check catches that and throws instead of
 * returning a wrongly-shaped payload.
 */
export function verifyIndividualToken(token: string): IndividualTokenPayload {
  const decoded = jwt.verify(token, requireSecret("JWT_SECRET")) as IndividualTokenPayload;
  if (decoded.typ !== "individual") {
    throw new Error("Not a Default Login token.");
  }
  return decoded;
}

export function signOrgToken(payload: Omit<OrgTokenPayload, "typ">): string {
  return jwt.sign({ ...payload, typ: "org" }, requireSecret("ORG_JWT_SECRET"), { expiresIn: "7d" });
}

export function verifyOrgToken(token: string): OrgTokenPayload {
  const decoded = jwt.verify(token, requireSecret("ORG_JWT_SECRET")) as OrgTokenPayload;
  if (decoded.typ !== "org") {
    throw new Error("Not an Organizational Login token.");
  }
  return decoded;
}

// Development/Ops token (spec section 9) — short-lived on purpose, since
// this is a local-dev/manual-admin stand-in, not a real Platform Staff
// role yet (see docs/ARCHITECTURE.md).
export function signDevToken(payload: Omit<DevTokenPayload, "typ">): string {
  return jwt.sign({ ...payload, typ: "dev" }, requireSecret("DEV_JWT_SECRET"), { expiresIn: "2h" });
}

export function verifyDevToken(token: string): DevTokenPayload {
  const decoded = jwt.verify(token, requireSecret("DEV_JWT_SECRET")) as DevTokenPayload;
  if (decoded.typ !== "dev") {
    throw new Error("Not a Development/Ops token.");
  }
  return decoded;
}

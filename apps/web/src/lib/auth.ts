import type { AuthedOrganization, AuthedUser } from "./api";

const SESSION_KEY = "ayudaan_session";

export type StoredSession =
  | { type: "individual"; token: string; user: AuthedUser }
  | { type: "org"; token: string; organization: AuthedOrganization };

// A browser session is either logged in as an individual OR as an
// organization, not both at once — matches how the two login surfaces
// are genuinely separate identities (spec section 9), even though a
// person could in principle hold both kinds of account.
export function getStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function storeSession(session: StoredSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getToken(): string | null {
  return getStoredSession()?.token ?? null;
}

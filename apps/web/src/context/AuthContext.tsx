import { createContext, useContext, useState, type ReactNode } from "react";
import * as api from "../lib/api";
import type { OrgOption } from "../lib/api";
import { clearSession, getStoredSession, storeSession, type StoredSession } from "../lib/auth";

interface AuthContextValue {
  session: StoredSession | null;
  isAuthenticated: boolean;
  loginIndividual: (email: string, password: string) => Promise<void>;
  registerIndividual: (email: string, password: string, displayName?: string) => Promise<void>;
  // Returns a list of orgs to choose from if the account belongs to more
  // than one and none was specified — null means login succeeded outright.
  loginOrg: (email: string, password: string, organizationId?: number) => Promise<OrgOption[] | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => getStoredSession());

  async function loginIndividual(email: string, password: string) {
    const result = await api.login(email, password);
    const next: StoredSession = { type: "individual", token: result.token, user: result.user };
    storeSession(next);
    setSession(next);
  }

  async function registerIndividual(email: string, password: string, displayName?: string) {
    const result = await api.register(email, password, displayName);
    const next: StoredSession = { type: "individual", token: result.token, user: result.user };
    storeSession(next);
    setSession(next);
  }

  async function loginOrg(email: string, password: string, organizationId?: number) {
    const result = await api.loginOrg(email, password, organizationId);
    if (result.kind === "needsSelection") {
      return result.options;
    }
    const next: StoredSession = { type: "org", token: result.token, organization: result.organization };
    storeSession(next);
    setSession(next);
    return null;
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{ session, isAuthenticated: session !== null, loginIndividual, registerIndividual, loginOrg, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../../components/AppShell/AppShell";
import { devLogin, fetchPendingOrganizations, verifyOrganization, type PublicOrgProfile } from "../../lib/api";
import styles from "./Admin.module.css";

const DEV_TOKEN_KEY = "ayudaan_dev_token";

/**
 * Deliberately does NOT use AuthContext/lib/auth's session storage — kept
 * entirely local to this page, consistent with dev-login being an
 * isolated, strippable module (spec section 9/13, docs/ARCHITECTURE.md).
 * This whole page is the manual-admin-approves stand-in for a real
 * Platform Staff role, which doesn't exist yet.
 */
export function Admin() {
  const [devToken, setDevToken] = useState<string | null>(() => sessionStorage.getItem(DEV_TOKEN_KEY));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [pending, setPending] = useState<PublicOrgProfile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const loadPending = useCallback(async (token: string) => {
    try {
      setPending(await fetchPendingOrganizations(token));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    if (devToken) loadPending(devToken);
  }, [devToken, loadPending]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const { token } = await devLogin(email, password);
      sessionStorage.setItem(DEV_TOKEN_KEY, token);
      setDevToken(token);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleApprove(orgId: number) {
    if (!devToken) return;
    setApprovingId(orgId);
    try {
      await verifyOrganization(orgId, devToken);
      await loadPending(devToken);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setApprovingId(null);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(DEV_TOKEN_KEY);
    setDevToken(null);
    setPending(null);
  }

  if (!devToken) {
    return (
      <AppShell>
        <div className={styles.loginWrap}>
          <h1>Admin</h1>
          <p className={styles.note}>
            Development/Ops login only — see <code className="mono">docs/spec/ayudaan-spec-v0.3.md</code> section 9.
            Not a real Platform Staff role yet.
          </p>
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <input
              className={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {loginError && <span className={styles.error}>{loginError}</span>}
            <button type="submit" className={styles.submit} disabled={loggingIn}>
              {loggingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={styles.panel}>
        <header className={styles.header}>
          <h1>Pending organization verification</h1>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Log out of Admin
          </button>
        </header>

        {loadError && <div className={styles.error}>{loadError}</div>}

        {pending && pending.length === 0 && <p className={styles.empty}>Nothing pending — every org is Document-Verified or higher.</p>}

        {pending && pending.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Darpan ID</th>
                <th>12A / 80G</th>
                <th>Current tier</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((org) => (
                <tr key={org.id}>
                  <td>{org.name}</td>
                  <td className="mono">{org.darpanId ?? "—"}</td>
                  <td className="mono">{org.reg12a80g ?? "—"}</td>
                  <td>{org.verificationTier}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.approveButton}
                      disabled={approvingId === org.id}
                      onClick={() => handleApprove(org.id)}
                    >
                      {approvingId === org.id ? "Approving…" : "Mark Document-Verified"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

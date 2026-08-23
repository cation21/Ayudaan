import { useState, type FormEvent } from "react";
import type { OrgOption } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../Avatar/Avatar";
import styles from "./AuthPanel.module.css";

type AccountKind = "individual" | "org";
type IndividualMode = "login" | "register";

export function AuthPanel() {
  const { session, isAuthenticated, loginIndividual, registerIndividual, loginOrg, logout } = useAuth();

  const [accountKind, setAccountKind] = useState<AccountKind>("individual");
  const [individualMode, setIndividualMode] = useState<IndividualMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orgOptions, setOrgOptions] = useState<OrgOption[] | null>(null);

  if (isAuthenticated && session) {
    const label =
      session.type === "individual" ? session.user.displayName ?? "you" : `${session.organization.name} (org)`;
    return (
      <div className={styles.panel}>
        <div className={styles.signedInRow}>
          <Avatar name={label} size="sm" />
          <span className={styles.signedIn}>Signed in as {label}</span>
        </div>
        <button type="button" className={styles.linkButton} onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (accountKind === "individual") {
        if (individualMode === "login") {
          await loginIndividual(email, password);
        } else {
          await registerIndividual(email, password, displayName || undefined);
        }
      } else {
        const needsSelection = await loginOrg(email, password);
        if (needsSelection) {
          setOrgOptions(needsSelection);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSelectOrg(orgId: number) {
    setSubmitting(true);
    setError(null);
    try {
      await loginOrg(email, password, orgId);
      setOrgOptions(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (orgOptions) {
    return (
      <div className={styles.panel}>
        <span className={styles.signedIn}>Multiple organizations found — pick one:</span>
        {orgOptions.map((org) => (
          <button
            key={org.id}
            type="button"
            className={styles.orgOption}
            disabled={submitting}
            onClick={() => handleSelectOrg(org.id)}
          >
            {org.name} <span className={styles.orgRole}>({org.role})</span>
          </button>
        ))}
        <button type="button" className={styles.linkButton} onClick={() => setOrgOptions(null)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={accountKind === "individual" ? styles.tabActive : styles.tab}
          onClick={() => setAccountKind("individual")}
        >
          Individual
        </button>
        <button
          type="button"
          className={accountKind === "org" ? styles.tabActive : styles.tab}
          onClick={() => setAccountKind("org")}
        >
          Organization
        </button>
      </div>

      {accountKind === "individual" && (
        <div className={styles.tabs}>
          <button
            type="button"
            className={individualMode === "login" ? styles.tabActive : styles.tab}
            onClick={() => setIndividualMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={individualMode === "register" ? styles.tabActive : styles.tab}
            onClick={() => setIndividualMode("register")}
          >
            Register
          </button>
        </div>
      )}

      {accountKind === "individual" && individualMode === "register" && (
        <input
          className={styles.input}
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      )}

      {accountKind === "org" && (
        <span className={styles.orgNote}>Organization accounts are provisioned during onboarding — no self-signup yet.</span>
      )}

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

      {error && <span className={styles.error}>{error}</span>}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting
          ? "Please wait…"
          : accountKind === "org"
            ? "Log in as organization"
            : individualMode === "login"
              ? "Log in"
              : "Create account"}
      </button>
    </form>
  );
}

import type { ReactNode } from "react";
import { Bell, Compass, Home, Landmark, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AuthPanel } from "../AuthPanel/AuthPanel";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  const profileHref =
    session?.type === "individual"
      ? `/profile/${session.user.id}`
      : session?.type === "org"
        ? `/organizations/${session.organization.id}`
        : null;

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>A</span>
          <span>Ayudaan</span>
        </div>

        <ul>
          <li>
            <Link to="/">
              <Home size={18} strokeWidth={1.75} />
              Home
            </Link>
          </li>
          <li>
            <a href="#" aria-disabled="true" className={styles.disabled}>
              <Compass size={18} strokeWidth={1.75} />
              Explore
            </a>
          </li>
          <li>
            <a href="#" aria-disabled="true" className={styles.disabled}>
              <Bell size={18} strokeWidth={1.75} />
              Notifications
            </a>
          </li>
          <li>
            <a href="#" aria-disabled="true" className={styles.disabled}>
              <Landmark size={18} strokeWidth={1.75} />
              Organizations
            </a>
          </li>
          <li>
            {profileHref ? (
              <Link to={profileHref}>
                <User size={18} strokeWidth={1.75} />
                Profile
              </Link>
            ) : (
              <a href="#" aria-disabled="true" className={styles.disabled}>
                <User size={18} strokeWidth={1.75} />
                Profile
              </a>
            )}
          </li>
        </ul>

        <AuthPanel />
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
}

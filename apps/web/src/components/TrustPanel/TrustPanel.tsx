import type { TrustPanelData } from "@ayudaan/shared-types";
import { VerifiedStamp } from "../VerifiedStamp/VerifiedStamp";
import styles from "./TrustPanel.module.css";

interface TrustPanelProps {
  data: TrustPanelData;
}

/**
 * One reusable component fed by the verification data model, used across
 * org, individual, and post views (see spec Appendix A) — not three
 * separate implementations.
 */
export function TrustPanel({ data }: TrustPanelProps) {
  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3>Trust &amp; Transparency</h3>
        <span className={`${styles.score} mono`}>{data.trustScore}%</span>
      </div>

      <VerifiedStamp tier={data.verificationTier} size="md" />

      <ul className={styles.checks}>
        {data.checks.map((check) => (
          <li key={check.label} className={check.passed ? styles.pass : styles.pending}>
            <span className={styles.dot} aria-hidden="true" />
            {check.label}
          </li>
        ))}
      </ul>

      {data.ledgerUrl && (
        <a href={data.ledgerUrl} className={styles.ledgerLink}>
          View full transaction ledger →
        </a>
      )}
    </aside>
  );
}

import type { VerificationTier } from "@ayudaan/shared-types";
import styles from "./VerifiedStamp.module.css";

const TIER_LABEL: Record<VerificationTier, string> = {
  unverified: "Unverified",
  community_verified: "Community Verified",
  id_verified: "ID Verified",
  document_verified: "Document Verified",
  csr_eligible: "CSR Eligible",
  anonymous_but_verified: "Verified · Identity Protected",
};

const TIER_TONE: Record<VerificationTier, "muted" | "verified" | "csr"> = {
  unverified: "muted",
  community_verified: "verified",
  id_verified: "verified",
  document_verified: "verified",
  csr_eligible: "csr",
  anonymous_but_verified: "verified",
};

interface VerifiedStampProps {
  tier: VerificationTier;
  size?: "sm" | "md";
}

/**
 * The product's one signature visual element (docs/ARCHITECTURE.md /
 * frontend design notes). Every "verified" signal in the UI is this
 * rotated ink-stamp ring — never a generic checkmark badge — as a direct
 * visual echo of the platform's actual claim: trust here is audited, not
 * asserted.
 */
export function VerifiedStamp({ tier, size = "sm" }: VerifiedStampProps) {
  if (tier === "unverified") return null;
  const tone = TIER_TONE[tier];

  return (
    <span className={`${styles.badge} ${styles[tone]} ${styles[size]}`} title={TIER_LABEL[tier]}>
      <svg viewBox="0 0 40 40" className={styles.ring} aria-hidden="true">
        <circle cx="20" cy="20" r="17" fill="none" strokeWidth="1.5" strokeDasharray="2.6 2.2" />
      </svg>
      <span className={styles.label}>{TIER_LABEL[tier]}</span>
    </span>
  );
}

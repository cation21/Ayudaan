import { useState } from "react";
import type { ProofEntry, PublicLedgerEntry, PublicPost } from "@ayudaan/shared-types";
import { useAuth } from "../../context/AuthContext";
import { ProofOfWork } from "../ProofOfWork/ProofOfWork";
import { VerifiedStamp } from "../VerifiedStamp/VerifiedStamp";
import styles from "./PostCard.module.css";

interface PostCardProps {
  post: PublicPost;
  recentDonations?: PublicLedgerEntry[];
  proofEntries?: ProofEntry[];
  onDonate?: (amountInRupees: number) => Promise<void> | void;
  onUploadProof?: (file: File) => Promise<void> | void;
  onVerifyProof?: (proofId: number) => Promise<void> | void;
  onFlag?: () => Promise<void> | void;
}

function formatRupees(amount: string) {
  const n = Number(amount);
  return `₹${n.toLocaleString("en-IN")}`;
}

/**
 * The core "need" post — styled as a ledger stub rather than a generic
 * social card: a dashed tear-line separates the claim (top) from the
 * audited record (bottom), and the progress indicator is a tally of
 * ticks rather than a gradient bar, echoing how the amount is actually
 * counted on the ledger (see LedgerService, apps/api).
 */
export function PostCard({
  post,
  recentDonations = [],
  proofEntries = [],
  onDonate,
  onUploadProof,
  onVerifyProof,
  onFlag,
}: PostCardProps) {
  const { session, isAuthenticated } = useAuth();
  const [amount, setAmount] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const requested = Number(post.requestedAmount);
  const raised = Number(post.raisedAmount);
  const percent = requested > 0 ? Math.min(100, Math.round((raised / requested) * 100)) : 0;
  const tickCount = 20;
  const filledTicks = Math.round((percent / 100) * tickCount);

  // Either kind of author can upload proof now that org login exists —
  // matches the backend's isPostAuthor check (requireAnyAuth).
  const canUploadProof =
    (session?.type === "individual" && post.authorUserId === session.user.id) ||
    (session?.type === "org" && post.authorOrganizationId === session.organization.id);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.author}>
          <span className={styles.category}>{post.category ?? "General"}</span>
          <VerifiedStamp tier={post.author.verificationTier} />
        </div>
        <span className={styles.authorName}>{post.author.displayName}</span>
      </header>

      <h3 className={styles.title}>{post.title}</h3>
      <p className={styles.description}>{post.description}</p>

      <div className={styles.tearLine} aria-hidden="true" />

      <div className={styles.amountRow}>
        <div>
          <span className={styles.amountLabel}>
            {post.status === "funded" ? "Fully funded" : "Requesting"}
          </span>
          <span className={`${styles.amount} mono`}>{formatRupees(post.requestedAmount)}</span>
        </div>
        {typeof post.daysLeft === "number" && post.status !== "funded" && (
          <span className={styles.daysLeft}>{post.daysLeft} days left</span>
        )}
      </div>

      <div
        className={styles.tally}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: tickCount }).map((_, i) => (
          <span key={i} className={i < filledTicks ? styles.tickFilled : styles.tick} />
        ))}
      </div>

      <div className={styles.raisedRow}>
        <span className={`${styles.raised} mono`}>{formatRupees(post.raisedAmount)} raised</span>
        <span className={styles.percent}>{percent}%</span>
      </div>

      {recentDonations.length > 0 && (
        <ul className={styles.donorList}>
          {recentDonations.slice(0, 3).map((entry) => (
            <li key={entry.id}>
              <span>{entry.donorDisplayName ?? "Anonymous Donor"}</span>
              <span className="mono">{formatRupees(entry.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.donateRow}>
        <label className={styles.amountInput}>
          ₹
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="Donation amount in rupees"
          />
        </label>
        <button
          className={styles.cta}
          type="button"
          disabled={submitting || !onDonate || amount <= 0}
          onClick={async () => {
            if (!onDonate) return;
            setSubmitting(true);
            try {
              await onDonate(amount);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? "Processing…" : "Donate Now"}
        </button>
      </div>

      {(proofEntries.length > 0 || canUploadProof) && (
        <ProofOfWork
          entries={proofEntries}
          canUpload={canUploadProof}
          canVerify={isAuthenticated}
          uploading={uploadingProof}
          onUpload={async (file) => {
            if (!onUploadProof) return;
            setUploadingProof(true);
            try {
              await onUploadProof(file);
            } finally {
              setUploadingProof(false);
            }
          }}
          onVerify={(proofId) => onVerifyProof?.(proofId)}
        />
      )}

      <footer className={styles.footer}>
        <span>₹1 to interact</span>
        {isAuthenticated && onFlag && (
          <button
            type="button"
            className={styles.reportLink}
            disabled={flagged}
            onClick={async () => {
              await onFlag();
              setFlagged(true);
            }}
          >
            {flagged ? "Reported" : "Report this post"}
          </button>
        )}
      </footer>
    </article>
  );
}

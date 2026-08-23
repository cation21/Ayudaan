import type { ChangeEvent } from "react";
import type { ProofEntry } from "@ayudaan/shared-types";
import styles from "./ProofOfWork.module.css";

interface EntryProps {
  entry: ProofEntry;
  canVerify: boolean;
  onVerify: () => void;
}

function ProofEntryRow({ entry, canVerify, onVerify }: EntryProps) {
  return (
    <div className={styles.entry}>
      <img src={entry.documentUrl} alt="Proof of use" className={styles.thumb} />
      <div className={styles.entryMeta}>
        <span className={entry.verifiedByCommunity ? styles.verified : styles.unverified}>
          {entry.verifiedByCommunity ? "Verified by community" : "Awaiting community review"}
        </span>
        <span className={styles.uploadedAt}>{new Date(entry.uploadedAt).toLocaleDateString()}</span>
      </div>
      {!entry.verifiedByCommunity && canVerify && (
        <button type="button" className={styles.verifyButton} onClick={onVerify}>
          Confirm this looks right
        </button>
      )}
    </div>
  );
}

interface ProofOfWorkProps {
  entries: ProofEntry[];
  canUpload: boolean;
  canVerify: boolean;
  uploading: boolean;
  onUpload: (file: File) => void;
  onVerify: (proofId: number) => void;
}

/**
 * Dual-state proof-of-use module (spec Appendix A) — now data-driven:
 * empty state shows an upload control to the post's author only; each
 * uploaded entry gets its own verify action. See spec section 9 for the
 * known simplification (single-confirm, not a threshold/voting model).
 */
export function ProofOfWork({ entries, canUpload, canVerify, uploading, onUpload, onVerify }: ProofOfWorkProps) {
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  }

  return (
    <section className={styles.module}>
      <header className={styles.header}>
        <span>Proof of Work</span>
        <span className={styles.tag}>Transparency you can trust</span>
      </header>

      {entries.length === 0 ? (
        <div className={styles.pending}>
          <span>Awaiting proof from recipient.</span>
          {canUpload && (
            <label className={styles.uploadLabel}>
              {uploading ? "Uploading…" : "Upload proof"}
              <input type="file" accept="image/*,application/pdf" hidden disabled={uploading} onChange={handleFileChange} />
            </label>
          )}
        </div>
      ) : (
        <div className={styles.entries}>
          {entries.map((entry) => (
            <ProofEntryRow key={entry.id} entry={entry} canVerify={canVerify} onVerify={() => onVerify(entry.id)} />
          ))}
          {canUpload && (
            <label className={styles.uploadLabel}>
              {uploading ? "Uploading…" : "Upload another"}
              <input type="file" accept="image/*,application/pdf" hidden disabled={uploading} onChange={handleFileChange} />
            </label>
          )}
        </div>
      )}
    </section>
  );
}

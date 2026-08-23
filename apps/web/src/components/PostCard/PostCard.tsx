import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { LikeStatus, PostComment, ProofEntry, PublicLedgerEntry, PublicPost } from "@ayudaan/shared-types";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../Avatar/Avatar";
import { CommentSection } from "../CommentSection/CommentSection";
import { ProofOfWork } from "../ProofOfWork/ProofOfWork";
import { VerifiedStamp } from "../VerifiedStamp/VerifiedStamp";
import styles from "./PostCard.module.css";

interface PostCardProps {
  post: PublicPost;
  recentDonations?: PublicLedgerEntry[];
  proofEntries?: ProofEntry[];
  likeStatus?: LikeStatus;
  onDonate?: (amountInRupees: number) => Promise<void> | void;
  onUploadProof?: (file: File) => Promise<void> | void;
  onVerifyProof?: (proofId: number) => Promise<void> | void;
  onFlag?: () => Promise<void> | void;
  onLike?: () => Promise<void> | void;
  fetchComments?: (postId: number) => Promise<PostComment[]>;
  onComment?: (postId: number, body: string) => Promise<void>;
}

function formatRupees(amount: string) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

/**
 * The core "need" post — an Instagram/WhatsApp-style social card (spec
 * section 12 UI Inspo), not a receipt: author avatar up top, donor
 * avatars inline under the progress bar, and a real like/comment/share
 * row where the ₹1-to-interact gate is an actual mechanic (spec section
 * 4.3), not a caption.
 */
export function PostCard({
  post,
  recentDonations = [],
  proofEntries = [],
  likeStatus,
  onDonate,
  onUploadProof,
  onVerifyProof,
  onFlag,
  onLike,
  fetchComments,
  onComment,
}: PostCardProps) {
  const { session, isAuthenticated } = useAuth();
  const [amount, setAmount] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [liking, setLiking] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  const requested = Number(post.requestedAmount);
  const raised = Number(post.raisedAmount);
  const percent = requested > 0 ? Math.min(100, Math.round((raised / requested) * 100)) : 0;

  const canUploadProof =
    (session?.type === "individual" && post.authorUserId === session.user.id) ||
    (session?.type === "org" && post.authorOrganizationId === session.organization.id);

  useEffect(() => {
    if (commentsOpen && comments === null && fetchComments) {
      fetchComments(post.id).then(setComments);
    }
  }, [commentsOpen, comments, fetchComments, post.id]);

  async function handleLike() {
    if (!onLike || liking) return;
    setLiking(true);
    try {
      await onLike();
    } finally {
      setLiking(false);
    }
  }

  async function handleToggleComments() {
    setCommentsOpen((open) => !open);
  }

  async function handleSubmitComment(body: string) {
    if (!onComment) return;
    setPostingComment(true);
    try {
      await onComment(post.id, body);
      // Refresh just this card's local comment list — the parent's
      // reload also refreshes raisedAmount/likes since a comment is a
      // ₹1 contribution too (spec section 4.3).
      if (fetchComments) setComments(await fetchComments(post.id));
    } finally {
      setPostingComment(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
  }

  const donorNames = recentDonations
    .map((d) => d.donorDisplayName)
    .filter((name): name is string => Boolean(name));

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <Avatar name={post.author.displayName} size="md" />
        <div className={styles.headerText}>
          <div className={styles.nameRow}>
            <span className={styles.authorName}>{post.author.displayName}</span>
            <VerifiedStamp tier={post.author.verificationTier} />
          </div>
          <span className={styles.category}>{post.category ?? "General"}</span>
        </div>
      </header>

      <h3 className={styles.title}>{post.title}</h3>
      <p className={styles.description}>{post.description}</p>

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

      <div className={styles.progressTrack} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.raisedRow}>
        <div className={styles.raisedWithAvatars}>
          <span className={`${styles.raised} mono`}>{formatRupees(post.raisedAmount)} raised</span>
          {donorNames.length > 0 && (
            <div className={styles.donorStack}>
              {donorNames.slice(0, 4).map((name, i) => (
                <div key={i} className={styles.donorStackItem}>
                  <Avatar name={name} size="xs" />
                </div>
              ))}
              {donorNames.length > 4 && <span className={styles.donorMore}>+{donorNames.length - 4}</span>}
            </div>
          )}
        </div>
        <span className={styles.percent}>{percent}%</span>
      </div>

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

      <div className={styles.actionRow}>
        <button
          type="button"
          className={`${styles.actionButton} ${likeStatus?.likedByMe ? styles.actionButtonLiked : ""}`}
          disabled={liking || !isAuthenticated || likeStatus?.likedByMe}
          onClick={handleLike}
          title={isAuthenticated ? "₹1 — a like is a micro-donation" : "Log in to like"}
        >
          <Heart size={17} strokeWidth={2} fill={likeStatus?.likedByMe ? "currentColor" : "none"} />
          <span>{likeStatus?.count ?? 0}</span>
        </button>

        <button type="button" className={styles.actionButton} onClick={handleToggleComments}>
          <MessageCircle size={17} strokeWidth={2} />
          <span>{comments?.length ?? ""}</span>
        </button>

        <button type="button" className={styles.actionButton} onClick={handleShare} title="Copy link">
          <Share2 size={17} strokeWidth={2} />
        </button>

        <span className={styles.interactFee}>₹1 to like or comment</span>

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
            {flagged ? "Reported" : "Report"}
          </button>
        )}
      </div>

      {commentsOpen && (
        <CommentSection
          comments={comments ?? []}
          canComment={isAuthenticated && session?.type === "individual"}
          submitting={postingComment}
          onSubmit={handleSubmitComment}
        />
      )}
    </article>
  );
}

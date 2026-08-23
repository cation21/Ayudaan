import { useState, type FormEvent } from "react";
import type { PostComment } from "@ayudaan/shared-types";
import { Avatar } from "../Avatar/Avatar";
import styles from "./CommentSection.module.css";

interface CommentSectionProps {
  comments: PostComment[];
  canComment: boolean;
  submitting: boolean;
  onSubmit: (body: string) => Promise<void>;
}

export function CommentSection({ comments, canComment, submitting, onSubmit }: CommentSectionProps) {
  const [body, setBody] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await onSubmit(body.trim());
    setBody("");
  }

  return (
    <div className={styles.section}>
      {comments.length === 0 && <p className={styles.empty}>No comments yet.</p>}

      <ul className={styles.list}>
        {comments.map((c) => (
          <li key={c.id} className={styles.item}>
            <Avatar name={c.authorDisplayName} size="sm" />
            <div className={styles.body}>
              <span className={styles.author}>{c.authorDisplayName}</span>
              <span className={styles.text}>{c.body}</span>
            </div>
          </li>
        ))}
      </ul>

      {canComment ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={submitting}
          />
          <button type="submit" className={styles.submit} disabled={submitting || !body.trim()}>
            {submitting ? "…" : "₹1 · Post"}
          </button>
        </form>
      ) : (
        <p className={styles.loginPrompt}>Log in to comment — every comment is a ₹1 micro-donation to this post.</p>
      )}
    </div>
  );
}

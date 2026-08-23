import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { createPost } from "../../lib/api";
import styles from "./PostComposer.module.css";

interface PostComposerProps {
  onCreated: () => void;
}

export function PostComposer({ onCreated }: PostComposerProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [requestedAmount, setRequestedAmount] = useState(1000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <div className={styles.prompt}>Log in to post a need.</div>;
  }

  if (!open) {
    return (
      <button type="button" className={styles.prompt} onClick={() => setOpen(true)}>
        What cause matters today?
      </button>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPost({ title, description, category: category || undefined, requestedAmount });
      setTitle("");
      setDescription("");
      setCategory("");
      setRequestedAmount(1000);
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="Title — what do you need help with?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className={styles.textarea}
        placeholder="Describe the need in a few sentences."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        required
      />
      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <label className={styles.amount}>
          ₹
          <input
            type="number"
            min={1}
            value={requestedAmount}
            onChange={(e) => setRequestedAmount(Number(e.target.value))}
            required
          />
        </label>
      </div>

      {error && <span className={styles.error}>{error}</span>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}

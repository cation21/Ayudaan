import styles from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}

// Deterministic color + initials from a name — no image upload/storage
// needed for this to look like a real social app avatar. Same palette
// family as the rest of the design tokens, just picked by hash so every
// person/org gets a stable, distinct color across the whole app.
const PALETTE = ["#c97a22", "#2e6b4e", "#a6362c", "#4b5b68", "#8a5a44", "#3d6b8a", "#6b5b95"];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md" }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${styles[size]}`}
      style={{ backgroundColor: colorForName(name) }}
      title={name}
      aria-hidden="true"
    >
      {initialsForName(name)}
    </span>
  );
}

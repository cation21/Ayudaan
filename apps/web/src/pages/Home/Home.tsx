import { useCallback, useEffect, useState } from "react";
import type { PublicPost } from "@ayudaan/shared-types";
import { AppShell } from "../../components/AppShell/AppShell";
import { PostCard } from "../../components/PostCard/PostCard";
import { PostComposer } from "../../components/PostComposer/PostComposer";
import { TrustPanel } from "../../components/TrustPanel/TrustPanel";
import { usePostInteractions } from "../../hooks/usePostInteractions";
import { MOCK_VERIFIED_ORGS } from "../../data/mock";
import { fetchPosts } from "../../lib/api";
import styles from "./Home.module.css";

export function Home() {
  const [posts, setPosts] = useState<PublicPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const list = await fetchPosts();
      setPosts(list);
      setError(null);
      await loadAuxData(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { loadAuxData, postCardProps } = usePostInteractions(loadFeed);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <AppShell>
      <div className={styles.layout}>
        <div className={styles.feed}>
          <PostComposer onCreated={loadFeed} />

          {error && (
            <div className={styles.error}>
              Couldn&apos;t reach the API ({error}). Is <code className="mono">npm run dev:api</code> running,
              and has <code className="mono">npm run db:seed --workspace=apps/api</code> been run at least
              once?
            </div>
          )}

          {!error && !posts && <div className={styles.loading}>Loading posts…</div>}

          {posts?.map((post) => (
            <PostCard key={post.id} post={post} {...postCardProps(post)} />
          ))}
        </div>

        <div className={styles.sidebar}>
          <TrustPanel
            data={{
              trustScore: 91,
              verificationTier: "document_verified",
              checks: [
                { label: "NGO Darpan registered", passed: true },
                { label: "12A / 80G verified", passed: true },
                { label: "CSR-1 registered", passed: false },
                { label: "Regular compliance", passed: true },
              ],
              ledgerUrl: "#",
            }}
          />

          <section className={styles.orgList}>
            <h3>Verified Organizations</h3>
            <ul>
              {MOCK_VERIFIED_ORGS.map((org) => (
                <li key={org.name}>
                  <span>{org.name}</span>
                  <span className="mono">{org.trustScore}%</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

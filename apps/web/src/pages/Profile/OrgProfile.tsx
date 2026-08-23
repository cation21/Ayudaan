import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { PublicPost } from "@ayudaan/shared-types";
import { AppShell } from "../../components/AppShell/AppShell";
import { PostCard } from "../../components/PostCard/PostCard";
import { TrustPanel } from "../../components/TrustPanel/TrustPanel";
import {
  donate,
  fetchLedger,
  fetchOrgPosts,
  fetchOrgProfile,
  fetchProof,
  flagPost,
  uploadProof,
  verifyProof,
  type PublicOrgProfile,
} from "../../lib/api";
import styles from "./Profile.module.css";

// Trust score is a simple heuristic here, not a real scoring model —
// counts how many of the compliance checks pass. A real version would
// weight these and probably live server-side; flagged as a
// simplification, same honesty as elsewhere in this codebase.
function computeTrustScore(org: PublicOrgProfile): number {
  const checks = [org.darpanId !== null, org.reg12a80g !== null, org.csr1Registered, org.verificationTier !== "unverified"];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export function OrgProfile() {
  const { orgId } = useParams<{ orgId: string }>();
  const id = Number(orgId);

  const [org, setOrg] = useState<PublicOrgProfile | null>(null);
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [ledgerByPost, setLedgerByPost] = useState<Record<number, Awaited<ReturnType<typeof fetchLedger>>>>({});
  const [proofByPost, setProofByPost] = useState<Record<number, Awaited<ReturnType<typeof fetchProof>>>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(id)) return;
    try {
      const [orgData, postList] = await Promise.all([fetchOrgProfile(id), fetchOrgPosts(id)]);
      setOrg(orgData);
      setPosts(postList);
      setError(null);

      const [ledgerResults, proofResults] = await Promise.all([
        Promise.all(postList.map((p) => fetchLedger(p.id))),
        Promise.all(postList.map((p) => fetchProof(p.id))),
      ]);
      const ledgerMap: typeof ledgerByPost = {};
      const proofMap: typeof proofByPost = {};
      postList.forEach((p, i) => {
        ledgerMap[p.id] = ledgerResults[i];
        proofMap[p.id] = proofResults[i];
      });
      setLedgerByPost(ledgerMap);
      setProofByPost(proofMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <AppShell>
        <div className={styles.error}>Couldn&apos;t load this organization ({error}).</div>
      </AppShell>
    );
  }

  if (!org) {
    return (
      <AppShell>
        <div className={styles.loading}>Loading organization…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={styles.layout}>
        <div className={styles.main}>
          <header className={styles.header}>
            <h1>{org.name}</h1>
            <span className={styles.joined}>Registered {new Date(org.createdAt).toLocaleDateString()}</span>
          </header>

          <div className={styles.postList}>
            {posts.length === 0 && <p className={styles.empty}>No posts yet.</p>}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                recentDonations={ledgerByPost[post.id] ?? []}
                proofEntries={proofByPost[post.id] ?? []}
                onDonate={async (amountInRupees) => {
                  await donate(post.id, amountInRupees * 100);
                  await load();
                }}
                onUploadProof={async (file) => {
                  await uploadProof(post.id, file);
                  await load();
                }}
                onVerifyProof={async (proofId) => {
                  await verifyProof(post.id, proofId);
                  await load();
                }}
                onFlag={async () => {
                  await flagPost(post.id);
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          <TrustPanel
            data={{
              trustScore: computeTrustScore(org),
              verificationTier: org.verificationTier,
              checks: [
                { label: "NGO Darpan registered", passed: org.darpanId !== null },
                { label: "12A / 80G verified", passed: org.reg12a80g !== null },
                { label: "CSR-1 registered", passed: org.csr1Registered },
                { label: "Document-Verified", passed: org.verificationTier !== "unverified" },
              ],
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}

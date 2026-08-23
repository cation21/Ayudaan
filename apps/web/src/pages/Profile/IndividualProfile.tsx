import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { PublicPost } from "@ayudaan/shared-types";
import { AppShell } from "../../components/AppShell/AppShell";
import { Avatar } from "../../components/Avatar/Avatar";
import { PostCard } from "../../components/PostCard/PostCard";
import { TrustPanel } from "../../components/TrustPanel/TrustPanel";
import { useAuth } from "../../context/AuthContext";
import { usePostInteractions } from "../../hooks/usePostInteractions";
import {
  fetchUserDonationsMade,
  fetchUserDonationsReceived,
  fetchUserPosts,
  fetchUserProfile,
  vouchForUser,
  type DonationMade,
  type DonationReceived,
  type PublicUserProfile,
} from "../../lib/api";
import styles from "./Profile.module.css";

type Tab = "posts" | "donations-made" | "donations-received";

function formatRupees(amount: string) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function IndividualProfile() {
  const { userId } = useParams<{ userId: string }>();
  const id = Number(userId);
  const { session } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [donationsMade, setDonationsMade] = useState<DonationMade[]>([]);
  const [donationsReceived, setDonationsReceived] = useState<DonationReceived[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [error, setError] = useState<string | null>(null);
  const [vouching, setVouching] = useState(false);
  const [vouchMessage, setVouchMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(id)) return;
    try {
      const [profileData, postList, madeList, receivedList] = await Promise.all([
        fetchUserProfile(id),
        fetchUserPosts(id),
        fetchUserDonationsMade(id),
        fetchUserDonationsReceived(id),
      ]);
      setProfile(profileData);
      setPosts(postList);
      setDonationsMade(madeList);
      setDonationsReceived(receivedList);
      setError(null);
      await loadAuxData(postList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { loadAuxData, postCardProps } = usePostInteractions(load);

  useEffect(() => {
    load();
  }, [load]);

  // A Document-Verified+ org, viewing an unverified individual, can
  // vouch for them (spec section 5) — the button only appears when both
  // conditions genuinely hold; the backend enforces the same checks
  // independently either way.
  const canVouch = session?.type === "org" && profile?.verificationTier === "unverified";

  async function handleVouch() {
    if (!profile) return;
    setVouching(true);
    setVouchMessage(null);
    try {
      await vouchForUser(profile.id);
      setVouchMessage("Vouched — this person is now Community Verified.");
      await load();
    } catch (err) {
      setVouchMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setVouching(false);
    }
  }

  if (error) {
    return (
      <AppShell>
        <div className={styles.error}>Couldn&apos;t load this profile ({error}).</div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className={styles.loading}>Loading profile…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={styles.layout}>
        <div className={styles.main}>
          <header className={styles.header}>
            <Avatar name={profile.displayName ?? "Unnamed"} size="lg" />
            <div className={styles.headerText}>
              <h1>{profile.displayName ?? "Unnamed"}</h1>
              <span className={styles.joined}>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </header>

          <div className={styles.tabs}>
            <button type="button" className={tab === "posts" ? styles.tabActive : styles.tab} onClick={() => setTab("posts")}>
              Posts ({posts.length})
            </button>
            <button
              type="button"
              className={tab === "donations-made" ? styles.tabActive : styles.tab}
              onClick={() => setTab("donations-made")}
            >
              Donations Made ({donationsMade.length})
            </button>
            <button
              type="button"
              className={tab === "donations-received" ? styles.tabActive : styles.tab}
              onClick={() => setTab("donations-received")}
            >
              Donations Received ({donationsReceived.length})
            </button>
          </div>

          {tab === "posts" && (
            <div className={styles.postList}>
              {posts.length === 0 && <p className={styles.empty}>No posts yet.</p>}
              {posts.map((post) => (
                <PostCard key={post.id} post={post} {...postCardProps(post)} />
              ))}
            </div>
          )}

          {tab === "donations-made" && (
            <ul className={styles.donationList}>
              {donationsMade.length === 0 && <p className={styles.empty}>No donations made yet.</p>}
              {donationsMade.map((d) => (
                <li key={d.id}>
                  <span>{d.postTitle}</span>
                  <span className="mono">{formatRupees(d.amount)}</span>
                </li>
              ))}
            </ul>
          )}

          {tab === "donations-received" && (
            <ul className={styles.donationList}>
              {donationsReceived.length === 0 && <p className={styles.empty}>No donations received yet.</p>}
              {donationsReceived.map((d) => (
                <li key={d.id}>
                  <span>
                    {d.donorDisplayName ?? "Anonymous Donor"} → {d.postTitle}
                  </span>
                  <span className="mono">{formatRupees(d.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.sidebar}>
          <TrustPanel
            data={{
              trustScore: profile.verificationTier === "unverified" ? 20 : 75,
              verificationTier: profile.verificationTier,
              checks: [
                { label: "Identity verified", passed: profile.verificationTier !== "unverified" },
                {
                  label: "ID-Verified (Aadhaar/DigiLocker)",
                  passed: profile.verificationTier === "id_verified",
                },
              ],
            }}
          />

          {canVouch && (
            <div className={styles.vouchBox}>
              <button type="button" className={styles.vouchButton} disabled={vouching} onClick={handleVouch}>
                {vouching ? "Vouching…" : "Vouch for this person"}
              </button>
              <p className={styles.vouchHint}>
                As a Document-Verified organization, you can vouch that you know this person and their need is
                genuine.
              </p>
            </div>
          )}
          {vouchMessage && <p className={styles.vouchMessage}>{vouchMessage}</p>}
        </div>
      </div>
    </AppShell>
  );
}

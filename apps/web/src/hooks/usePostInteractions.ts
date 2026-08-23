import { useCallback, useState } from "react";
import type { LikeStatus, ProofEntry, PublicLedgerEntry, PublicPost } from "@ayudaan/shared-types";
import {
  donate,
  fetchComments,
  fetchLedger,
  fetchLikeStatus,
  fetchProof,
  flagPost,
  likePost,
  postComment,
  uploadProof,
  verifyProof,
} from "../lib/api";

/**
 * Shared between every page that renders a PostCard feed (Home,
 * IndividualProfile, OrgProfile) — each one used to duplicate the same
 * "fetch ledger+proof+likes per post, wire the same five callbacks"
 * block. Extracted here for the same reason ContributionService was
 * extracted on the backend: three copies of identical logic is a
 * maintenance trap waiting to diverge.
 */
export function usePostInteractions(reload: () => Promise<void>) {
  const [ledgerByPost, setLedgerByPost] = useState<Record<number, PublicLedgerEntry[]>>({});
  const [proofByPost, setProofByPost] = useState<Record<number, ProofEntry[]>>({});
  const [likeByPost, setLikeByPost] = useState<Record<number, LikeStatus>>({});

  const loadAuxData = useCallback(async (list: PublicPost[]) => {
    const [ledgerResults, proofResults, likeResults] = await Promise.all([
      Promise.all(list.map((p) => fetchLedger(p.id))),
      Promise.all(list.map((p) => fetchProof(p.id))),
      Promise.all(list.map((p) => fetchLikeStatus(p.id))),
    ]);

    const ledgerMap: Record<number, PublicLedgerEntry[]> = {};
    const proofMap: Record<number, ProofEntry[]> = {};
    const likeMap: Record<number, LikeStatus> = {};
    list.forEach((p, i) => {
      ledgerMap[p.id] = ledgerResults[i];
      proofMap[p.id] = proofResults[i];
      likeMap[p.id] = likeResults[i];
    });
    setLedgerByPost(ledgerMap);
    setProofByPost(proofMap);
    setLikeByPost(likeMap);
  }, []);

  const postCardProps = useCallback(
    (post: PublicPost) => ({
      recentDonations: ledgerByPost[post.id] ?? [],
      proofEntries: proofByPost[post.id] ?? [],
      likeStatus: likeByPost[post.id],
      onDonate: async (amountInRupees: number) => {
        await donate(post.id, amountInRupees * 100);
        await reload();
      },
      onUploadProof: async (file: File) => {
        await uploadProof(post.id, file);
        await reload();
      },
      onVerifyProof: async (proofId: number) => {
        await verifyProof(post.id, proofId);
        await reload();
      },
      onFlag: async () => {
        await flagPost(post.id);
      },
      onLike: async () => {
        await likePost(post.id);
        await reload();
      },
      fetchComments,
      onComment: async (postId: number, body: string) => {
        await postComment(postId, body);
        await reload();
      },
    }),
    [ledgerByPost, proofByPost, likeByPost, reload]
  );

  return { loadAuxData, postCardProps };
}

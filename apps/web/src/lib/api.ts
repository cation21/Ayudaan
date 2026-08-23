import type {
  LikeStatus,
  OrgRole,
  PostComment,
  ProofEntry,
  PublicLedgerEntry,
  PublicPost,
  VerificationTier,
} from "@ayudaan/shared-types";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.message === "string" ? body.message : fallback;
  } catch {
    return fallback;
  }
}

// --- Posts / ledger / donations ------------------------------------

export async function fetchPosts(): Promise<PublicPost[]> {
  const res = await fetch(`${API_URL}/posts`);
  if (!res.ok) throw new Error(`GET /posts failed: ${res.status}`);
  return res.json();
}

export async function fetchLedger(postId: number): Promise<PublicLedgerEntry[]> {
  const res = await fetch(`${API_URL}/posts/${postId}/ledger`);
  if (!res.ok) throw new Error(`GET /posts/${postId}/ledger failed: ${res.status}`);
  return res.json();
}

export async function donate(
  postId: number,
  amountInPaise: number
): Promise<{ ledgerEntryId: number; hash: string }> {
  const res = await fetch(`${API_URL}/posts/${postId}/donate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ amountInPaise }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /posts/${postId}/donate failed: ${res.status}`));
  return res.json();
}

export interface CreatePostInput {
  title: string;
  description: string;
  category?: string;
  requestedAmount: number;
}

export async function createPost(input: CreatePostInput): Promise<{ id: number }> {
  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /posts failed: ${res.status}`));
  return res.json();
}

// --- Proof of work ---------------------------------------------------

export async function fetchProof(postId: number): Promise<ProofEntry[]> {
  const res = await fetch(`${API_URL}/posts/${postId}/proof`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET /posts/${postId}/proof failed: ${res.status}`));
  return res.json();
}

export async function uploadProof(postId: number, file: File): Promise<ProofEntry> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/posts/${postId}/proof`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /posts/${postId}/proof failed: ${res.status}`));
  return res.json();
}

export async function verifyProof(
  postId: number,
  proofId: number
): Promise<{ id: number; verifiedByCommunity: boolean }> {
  const res = await fetch(`${API_URL}/posts/${postId}/proof/${proofId}/verify`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST verify failed: ${res.status}`));
  return res.json();
}

export async function flagPost(postId: number): Promise<{ id: number; status: string }> {
  const res = await fetch(`${API_URL}/posts/${postId}/flag`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /posts/${postId}/flag failed: ${res.status}`));
  return res.json();
}

// --- Likes / comments ("₹1 to interact", spec section 4.3) -----------

export async function fetchLikeStatus(postId: number): Promise<LikeStatus> {
  const res = await fetch(`${API_URL}/posts/${postId}/likes`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET /posts/${postId}/likes failed: ${res.status}`));
  return res.json();
}

export async function likePost(postId: number): Promise<{ liked: boolean; alreadyLiked: boolean }> {
  const res = await fetch(`${API_URL}/posts/${postId}/like`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /posts/${postId}/like failed: ${res.status}`));
  return res.json();
}

export async function fetchComments(postId: number): Promise<PostComment[]> {
  const res = await fetch(`${API_URL}/posts/${postId}/comments`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET /posts/${postId}/comments failed: ${res.status}`));
  return res.json();
}

export async function postComment(postId: number, body: string): Promise<PostComment> {
  const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /posts/${postId}/comments failed: ${res.status}`));
  return res.json();
}

// --- Default Login (individuals) --------------------------------------

export interface AuthedUser {
  id: number;
  displayName: string | null;
  verificationTier: VerificationTier;
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<{ token: string; user: AuthedUser }> {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /register failed: ${res.status}`));
  return res.json();
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthedUser }> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /login failed: ${res.status}`));
  return res.json();
}

// --- Organizational Login ----------------------------------------------

export interface AuthedOrganization {
  id: number;
  name: string;
  role: OrgRole;
}

export interface OrgOption {
  id: number;
  name: string;
  role: OrgRole;
}

export type LoginOrgResult =
  | { kind: "success"; token: string; organization: AuthedOrganization }
  | { kind: "needsSelection"; options: OrgOption[] };

export async function loginOrg(
  email: string,
  password: string,
  organizationId?: number
): Promise<LoginOrgResult> {
  const res = await fetch(`${API_URL}/org-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, organizationId }),
  });

  if (res.status === 300) {
    const body = await res.json();
    return { kind: "needsSelection", options: body.organizations };
  }
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /org-login failed: ${res.status}`));

  const body = await res.json();
  return { kind: "success", token: body.token, organization: body.organization };
}

// --- Public profiles -----------------------------------------------

export interface PublicUserProfile {
  id: number;
  displayName: string | null;
  verificationTier: VerificationTier;
  createdAt: string;
}

export async function fetchUserProfile(userId: number): Promise<PublicUserProfile> {
  const res = await fetch(`${API_URL}/users/${userId}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET /users/${userId} failed: ${res.status}`));
  return res.json();
}

export async function fetchUserPosts(userId: number): Promise<PublicPost[]> {
  const res = await fetch(`${API_URL}/users/${userId}/posts`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET /users/${userId}/posts failed: ${res.status}`));
  return res.json();
}

export interface DonationMade {
  id: number;
  postId: number;
  postTitle: string;
  amount: string;
  createdAt: string;
}

export async function fetchUserDonationsMade(userId: number): Promise<DonationMade[]> {
  const res = await fetch(`${API_URL}/users/${userId}/donations-made`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET donations-made failed: ${res.status}`));
  return res.json();
}

export interface DonationReceived {
  id: number;
  postId: number;
  postTitle: string;
  donorDisplayName: string | null;
  amount: string;
  createdAt: string;
}

export async function fetchUserDonationsReceived(userId: number): Promise<DonationReceived[]> {
  const res = await fetch(`${API_URL}/users/${userId}/donations-received`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET donations-received failed: ${res.status}`));
  return res.json();
}

export async function vouchForUser(userId: number): Promise<{ id: number; verificationTier: VerificationTier }> {
  const res = await fetch(`${API_URL}/users/${userId}/vouch`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST vouch failed: ${res.status}`));
  return res.json();
}

export interface PublicOrgProfile {
  id: number;
  name: string;
  orgType: "ngo" | "company";
  darpanId: string | null;
  reg12a80g: string | null;
  csr1Registered: boolean;
  verificationTier: VerificationTier;
  createdAt: string;
}

export async function fetchOrgProfile(orgId: number): Promise<PublicOrgProfile> {
  const res = await fetch(`${API_URL}/organizations/${orgId}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET /organizations/${orgId} failed: ${res.status}`));
  return res.json();
}

export async function fetchOrgPosts(orgId: number): Promise<PublicPost[]> {
  const res = await fetch(`${API_URL}/organizations/${orgId}/posts`);
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET org posts failed: ${res.status}`));
  return res.json();
}

// --- Development/Ops (manual-admin-approves workflow) -----------------
// Deliberately NOT wired into the shared session/AuthContext — kept
// local to the Admin page's own state, consistent with dev-login being
// an isolated, strippable module (see docs/ARCHITECTURE.md).

export async function devLogin(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/dev-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST /dev-login failed: ${res.status}`));
  return res.json();
}

export async function fetchPendingOrganizations(devToken: string): Promise<PublicOrgProfile[]> {
  const res = await fetch(`${API_URL}/organizations/pending`, {
    headers: { Authorization: `Bearer ${devToken}` },
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `GET /organizations/pending failed: ${res.status}`));
  return res.json();
}

export async function verifyOrganization(
  orgId: number,
  devToken: string
): Promise<{ id: number; verificationTier: VerificationTier }> {
  const res = await fetch(`${API_URL}/organizations/${orgId}/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${devToken}` },
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, `POST verify org failed: ${res.status}`));
  return res.json();
}

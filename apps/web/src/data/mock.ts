import type { PublicLedgerEntry, PublicPost } from "@ayudaan/shared-types";

// Dev-only sample data so the feed renders before apps/api is wired up.
// Replace with real fetches once GET /posts and GET /posts/:id/ledger exist.

export const MOCK_POSTS: PublicPost[] = [
  {
    id: 1,
    authorUserId: 1,
    authorOrganizationId: null,
    author: {
      displayName: "Arjun Kumar",
      kind: "individual",
      verificationTier: "community_verified",
    },
    title: "Emergency heart surgery for my father",
    description:
      "My father needs urgent bypass surgery. Any support gets him back to his tea stall and back to us.",
    category: "Medical Emergency",
    requestedAmount: "25000",
    raisedAmount: "8200",
    status: "active",
    daysLeft: 12,
  },
  {
    authorUserId: null,
    authorOrganizationId: 1,
    id: 2,
    author: {
      displayName: "Relief Warriors",
      kind: "organization",
      verificationTier: "document_verified",
    },
    title: "Flood relief for families in Assam",
    description:
      "Distributing food, clean water, and temporary shelter kits to families displaced by this week's floods.",
    category: "Disaster Relief",
    requestedAmount: "100000",
    raisedAmount: "62300",
    status: "active",
    daysLeft: 5,
  },
  {
    authorUserId: null,
    authorOrganizationId: 2,
    id: 3,
    author: {
      displayName: "Helping Hands Foundation",
      kind: "organization",
      verificationTier: "csr_eligible",
    },
    title: "School supplies for 80 children, rural Telangana",
    description:
      "Notebooks, uniforms, and a full term of supplies for the government school in Vikarabad district.",
    category: "Education",
    requestedAmount: "40000",
    raisedAmount: "40000",
    status: "funded",
  },
];

export const MOCK_LEDGER_BY_POST: Record<number, PublicLedgerEntry[]> = {
  1: [
    {
      id: 101,
      postId: 1,
      donorDisplayName: "Priya Singh",
      amount: "2000",
      hash: "a1b2c3",
      prevHash: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 102,
      postId: 1,
      donorDisplayName: null,
      amount: "500",
      hash: "d4e5f6",
      prevHash: "a1b2c3",
      createdAt: new Date().toISOString(),
    },
  ],
  2: [
    {
      id: 201,
      postId: 2,
      donorDisplayName: "Rohit Sharma",
      amount: "1000",
      hash: "g7h8i9",
      prevHash: null,
      createdAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_VERIFIED_ORGS = [
  { name: "CRY India", trustScore: 98 },
  { name: "Goonj", trustScore: 96 },
  { name: "Akshaya Patra", trustScore: 94 },
];

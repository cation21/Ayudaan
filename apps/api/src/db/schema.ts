import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// --- Enums (mirror spec section 5 verification tiers, section 7 grants) ---

export const orgTypeEnum = pgEnum("org_type", ["ngo", "company"]);

export const verificationTierEnum = pgEnum("verification_tier", [
  "unverified",
  "community_verified",
  "id_verified",
  "document_verified",
  "csr_eligible",
  "anonymous_but_verified",
]);

export const orgRoleEnum = pgEnum("org_role", ["admin", "reviewer"]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "active",
  "funded",
  "closed",
  "flagged",
]);

export const grantModeEnum = pgEnum("grant_mode", ["direct", "application"]);

export const grantApplicationStatusEnum = pgEnum("grant_application_status", [
  "submitted",
  "approved",
  "rejected",
  "partially_funded",
]);

// --- Core tables ------------------------------------------------------

// Default Login surface (spec section 9) — individual users only.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 32 }),
  displayName: varchar("display_name", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  verificationTier: verificationTierEnum("verification_tier")
    .notNull()
    .default("unverified"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Organizational Login surface (spec section 9) — NGOs and Companies.
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  orgType: orgTypeEnum("org_type").notNull(),
  darpanId: varchar("darpan_id", { length: 64 }),
  reg12a80g: varchar("reg_12a_80g", { length: 64 }),
  csr1Registered: boolean("csr1_registered").notNull().default(false),
  verificationTier: verificationTierEnum("verification_tier")
    .notNull()
    .default("unverified"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Scoped role within one organization — Reviewer vs Org Admin (spec
// section 7, section 8 Interface Segregation). Role is resolved here,
// AFTER auth, not by which login endpoint was used.
export const orgMemberships = pgTable("org_memberships", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  role: orgRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorUserId: integer("author_user_id").references(() => users.id),
  authorOrganizationId: integer("author_organization_id").references(
    () => organizations.id
  ),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }),
  requestedAmount: numeric("requested_amount", {
    precision: 14,
    scale: 2,
  }).notNull(),
  raisedAmount: numeric("raised_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  status: postStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Append-only. See spec section 9 — the DB role used by LedgerService for
// writes should have INSERT only on this table (no UPDATE/DELETE grant).
export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id),
  donorUserId: integer("donor_user_id").references(() => users.id), // null = anonymous
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  // Idempotency key (spec section 9) — a retried payment webhook can't
  // double-count a donation.
  providerTransactionId: varchar("provider_transaction_id", { length: 255 })
    .notNull()
    .unique(),
  prevHash: varchar("prev_hash", { length: 64 }),
  hash: varchar("hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const proofOfUse = pgTable("proof_of_use", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id),
  documentUrl: text("document_url").notNull(),
  documentHash: varchar("document_hash", { length: 64 }).notNull(),
  verifiedByCommunity: boolean("verified_by_community").notNull().default(false),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const grants = pgTable("grants", {
  id: serial("id").primaryKey(),
  companyOrganizationId: integer("company_organization_id")
    .notNull()
    .references(() => organizations.id),
  mode: grantModeEnum("mode").notNull(),
  criteria: jsonb("criteria"),
  budget: numeric("budget", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const grantApplications = pgTable("grant_applications", {
  id: serial("id").primaryKey(),
  grantId: integer("grant_id")
    .notNull()
    .references(() => grants.id),
  // Must hold the csr_eligible tier — enforced in GrantService (spec
  // section 5), not as a DB constraint, since tier is itself mutable state.
  applicantOrganizationId: integer("applicant_organization_id")
    .notNull()
    .references(() => organizations.id),
  status: grantApplicationStatusEnum("status").notNull().default("submitted"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// "₹1 to interact" (spec section 4.3) made real: a like is a ₹1
// micro-donation, one per (post, user) — can't be un-given once made,
// consistent with it being a real ledger entry, not a toggleable social
// reaction. ledgerEntryId makes the connection auditable.
export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    ledgerEntryId: integer("ledger_entry_id").references(() => ledgerEntries.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    onePerPostPerUser: uniqueIndex("likes_post_user_unique").on(table.postId, table.userId),
  })
);

// Same "₹1 to interact" mechanic as likes — a comment is also a ₹1
// micro-donation (spec section 4.3), not a free-form free action.
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  ledgerEntryId: integer("ledger_entry_id").references(() => ledgerEntries.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit trail for Community-Verified vouching (spec section 5) — an org
// vouches for an individual, promoting unverified -> community_verified.
// Kept as its own table (not just a boolean flip) so there's a record of
// who vouched for whom, consistent with the platform's whole
// audit-everything ethos.
export const vouches = pgTable("vouches", {
  id: serial("id").primaryKey(),
  voucherOrganizationId: integer("voucher_organization_id")
    .notNull()
    .references(() => organizations.id),
  vouchedUserId: integer("vouched_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One row per scheduled Polygon anchor batch (spec section 9 —
// ChainAnchorService).
export const chainAnchors = pgTable("chain_anchors", {
  id: serial("id").primaryKey(),
  merkleRoot: varchar("merkle_root", { length: 66 }).notNull(),
  txHash: varchar("tx_hash", { length: 66 }),
  batchStartLedgerId: integer("batch_start_ledger_id").notNull(),
  batchEndLedgerId: integer("batch_end_ledger_id").notNull(),
  anchoredAt: timestamp("anchored_at"),
});

import "../env.js";
import { db } from "./client.js";
import { orgMemberships, organizations, posts, users } from "./schema.js";
import { hashPassword } from "../auth/password.js";

// Dev-only seed data — mirrors what the frontend previously rendered from
// apps/web/src/data/mock.ts, now persisted for real so GET /posts has
// something to return. Safe to re-run against a fresh database; not
// idempotent against a non-empty one (will insert duplicates).
//
// Demo credentials (password for both: "password123"):
//   POST /login      { "email": "arjun@example.com", "password": "password123" }
//   POST /org-login  { "email": "priya@reliefwarriors.org", "password": "password123" }
async function main() {
  const demoPasswordHash = await hashPassword("password123");

  const [arjun] = await db
    .insert(users)
    .values({
      email: "arjun@example.com",
      displayName: "Arjun Kumar",
      passwordHash: demoPasswordHash,
      verificationTier: "community_verified",
    })
    .returning();

  const [priya] = await db
    .insert(users)
    .values({
      email: "priya@reliefwarriors.org",
      displayName: "Priya Singh",
      passwordHash: demoPasswordHash,
      verificationTier: "unverified",
    })
    .returning();

  const [reliefWarriors] = await db
    .insert(organizations)
    .values({
      name: "Relief Warriors",
      orgType: "ngo",
      darpanId: "MH/2021/0001",
      reg12a80g: "AAAAA0000A",
      csr1Registered: false,
      verificationTier: "document_verified",
    })
    .returning();

  await db.insert(orgMemberships).values({
    organizationId: reliefWarriors.id,
    userId: priya.id,
    role: "admin",
  });

  const [helpingHands] = await db
    .insert(organizations)
    .values({
      name: "Helping Hands Foundation",
      orgType: "ngo",
      darpanId: "MH/2020/0287",
      reg12a80g: "AAAAA1111A",
      csr1Registered: true,
      verificationTier: "csr_eligible",
    })
    .returning();

  await db.insert(posts).values([
    {
      authorUserId: arjun.id,
      title: "Emergency heart surgery for my father",
      description:
        "My father needs urgent bypass surgery. Any support gets him back to his tea stall and back to us.",
      category: "Medical Emergency",
      requestedAmount: "25000",
      raisedAmount: "0",
      status: "active",
    },
    {
      authorOrganizationId: reliefWarriors.id,
      title: "Flood relief for families in Assam",
      description:
        "Distributing food, clean water, and temporary shelter kits to families displaced by this week's floods.",
      category: "Disaster Relief",
      requestedAmount: "100000",
      raisedAmount: "0",
      status: "active",
    },
    {
      authorOrganizationId: helpingHands.id,
      title: "School supplies for 80 children, rural Telangana",
      description:
        "Notebooks, uniforms, and a full term of supplies for the government school in Vikarabad district.",
      category: "Education",
      requestedAmount: "40000",
      raisedAmount: "0",
      status: "active",
    },
  ]);

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

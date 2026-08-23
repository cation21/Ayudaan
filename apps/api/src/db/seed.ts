import "../env.js";
import { and, eq } from "drizzle-orm";
import { db } from "./client.js";
import { orgMemberships, organizations, posts, users } from "./schema.js";
import { hashPassword } from "../auth/password.js";

// Dev-only seed data — mirrors what the frontend previously rendered from
// apps/web/src/data/mock.ts, now persisted for real so GET /posts has
// something to return. Safe to re-run against a non-empty database.
//
// Demo credentials (password for both: "password123"):
//   POST /login      { "email": "arjun@example.com", "password": "password123" }
//   POST /org-login  { "email": "priya@reliefwarriors.org", "password": "password123" }
async function main() {
  const demoPasswordHash = await hashPassword("password123");

  const [existingArjun] = await db
    .select()
    .from(users)
    .where(eq(users.email, "arjun@example.com"));
  const [arjun] = existingArjun
    ? [existingArjun]
    : await db
        .insert(users)
        .values({
          email: "arjun@example.com",
          displayName: "Arjun Kumar",
          passwordHash: demoPasswordHash,
          verificationTier: "community_verified",
        })
        .returning();

  const [existingPriya] = await db
    .select()
    .from(users)
    .where(eq(users.email, "priya@reliefwarriors.org"));
  const [priya] = existingPriya
    ? [existingPriya]
    : await db
        .insert(users)
        .values({
          email: "priya@reliefwarriors.org",
          displayName: "Priya Singh",
          passwordHash: demoPasswordHash,
          verificationTier: "unverified",
        })
        .returning();

  const [existingReliefWarriors] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, "Relief Warriors"));
  const [reliefWarriors] = existingReliefWarriors
    ? [existingReliefWarriors]
    : await db
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

  const [existingMembership] = await db
    .select()
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.organizationId, reliefWarriors.id),
        eq(orgMemberships.userId, priya.id)
      )
    );
  if (!existingMembership) {
    await db.insert(orgMemberships).values({
      organizationId: reliefWarriors.id,
      userId: priya.id,
      role: "admin",
    });
  }

  const [existingHelpingHands] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, "Helping Hands Foundation"));
  const [helpingHands] = existingHelpingHands
    ? [existingHelpingHands]
    : await db
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

  const demoPosts = [
    {
      authorUserId: arjun.id,
      title: "Emergency heart surgery for my father",
      description:
        "My father needs urgent bypass surgery. Any support gets him back to his tea stall and back to us.",
      category: "Medical Emergency",
      requestedAmount: "25000",
      raisedAmount: "0",
      status: "active" as const,
    },
    {
      authorOrganizationId: reliefWarriors.id,
      title: "Flood relief for families in Assam",
      description:
        "Distributing food, clean water, and temporary shelter kits to families displaced by this week's floods.",
      category: "Disaster Relief",
      requestedAmount: "100000",
      raisedAmount: "0",
      status: "active" as const,
    },
    {
      authorOrganizationId: helpingHands.id,
      title: "School supplies for 80 children, rural Telangana",
      description:
        "Notebooks, uniforms, and a full term of supplies for the government school in Vikarabad district.",
      category: "Education",
      requestedAmount: "40000",
      raisedAmount: "0",
      status: "active" as const,
    },
  ];

  for (const demoPost of demoPosts) {
    const authorCondition = demoPost.authorUserId
      ? eq(posts.authorUserId, demoPost.authorUserId)
      : eq(posts.authorOrganizationId, demoPost.authorOrganizationId!);
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(and(authorCondition, eq(posts.title, demoPost.title)));
    if (!existingPost) {
      await db.insert(posts).values(demoPost);
    }
  }

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

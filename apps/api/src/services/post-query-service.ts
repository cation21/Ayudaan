import { and, eq, inArray } from "drizzle-orm";
import type { PublicPost } from "@ayudaan/shared-types";
import { db } from "../db/client.js";
import { organizations, posts, users } from "../db/schema.js";

const VISIBLE_STATUSES: Array<PublicPost["status"]> = ["active", "funded"];

/**
 * Single Responsibility (spec section 8): builds public-facing Post DTOs
 * (joins author info from users/organizations) for API responses. Does
 * not write anything.
 */
export class PostQueryService {
  private toPublicPost(row: {
    id: number;
    authorUserId: number | null;
    authorOrganizationId: number | null;
    title: string;
    description: string;
    category: string | null;
    requestedAmount: string;
    raisedAmount: string;
    status: PublicPost["status"];
    authorUserDisplayName: string | null;
    authorUserEmail: string | null;
    authorUserTier: PublicPost["author"]["verificationTier"] | null;
    authorOrgName: string | null;
    authorOrgTier: PublicPost["author"]["verificationTier"] | null;
  }): PublicPost {
    return {
      id: row.id,
      authorUserId: row.authorUserId,
      authorOrganizationId: row.authorOrganizationId,
      author: row.authorOrgName
        ? {
            displayName: row.authorOrgName,
            kind: "organization",
            verificationTier: row.authorOrgTier ?? "unverified",
          }
        : {
            displayName: row.authorUserDisplayName ?? row.authorUserEmail ?? "Anonymous",
            kind: "individual",
            verificationTier: row.authorUserTier ?? "unverified",
          },
      title: row.title,
      description: row.description,
      category: row.category,
      requestedAmount: row.requestedAmount,
      raisedAmount: row.raisedAmount,
      status: row.status,
    };
  }

  private baseSelect() {
    return db
      .select({
        id: posts.id,
        authorUserId: posts.authorUserId,
        authorOrganizationId: posts.authorOrganizationId,
        title: posts.title,
        description: posts.description,
        category: posts.category,
        requestedAmount: posts.requestedAmount,
        raisedAmount: posts.raisedAmount,
        status: posts.status,
        authorUserDisplayName: users.displayName,
        authorUserEmail: users.email,
        authorUserTier: users.verificationTier,
        authorOrgName: organizations.name,
        authorOrgTier: organizations.verificationTier,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorUserId, users.id))
      .leftJoin(organizations, eq(posts.authorOrganizationId, organizations.id));
  }

  async listActive(): Promise<PublicPost[]> {
    // Bug fix (see docs/ARCHITECTURE.md): this method is named listActive
    // but previously had no WHERE clause at all — every post showed
    // regardless of status, including flagged ones.
    const rows = await this.baseSelect().where(inArray(posts.status, VISIBLE_STATUSES));
    return rows.map((row) => this.toPublicPost(row));
  }

  async listByUser(userId: number): Promise<PublicPost[]> {
    const rows = await this.baseSelect().where(
      and(eq(posts.authorUserId, userId), inArray(posts.status, VISIBLE_STATUSES))
    );
    return rows.map((row) => this.toPublicPost(row));
  }

  async listByOrganization(organizationId: number): Promise<PublicPost[]> {
    const rows = await this.baseSelect().where(
      and(eq(posts.authorOrganizationId, organizationId), inArray(posts.status, VISIBLE_STATUSES))
    );
    return rows.map((row) => this.toPublicPost(row));
  }
}

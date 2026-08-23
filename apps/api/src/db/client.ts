import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "../env.js";
import * as schema from "./schema.js";

// NOTE (spec section 9 — Ledger integrity): in a real deployment, the DB
// role used here for ledger writes should be INSERT-only on the
// `ledger_entries` table. This client is one shared pool for the scaffold
// stage — split into per-purpose roles (e.g. a narrower `ledgerWriterPool`)
// before anything touches production.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

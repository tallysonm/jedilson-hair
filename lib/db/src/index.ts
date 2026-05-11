import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isSupabase = !!process.env.SUPABASE_DATABASE_URL;

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool, { schema });

export * from "./schema";

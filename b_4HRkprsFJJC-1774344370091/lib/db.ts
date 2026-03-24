import { Pool } from "pg";

// Disable SSL cert verification for Supabase's self-signed chain
// This is safe for server-to-server connections where we control both ends
if (typeof process !== "undefined") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.POSTGRES_URL_NON_POOLING ||
        "postgres://postgres.kjjbrqgqjbtiejihtnvs:qXVs0cyzwnlOMGa5@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

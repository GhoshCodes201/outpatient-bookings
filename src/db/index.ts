import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { medrellaPool?: Pool };

const parsedPoolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "5", 10);
const poolMax = Number.isFinite(parsedPoolMax) && parsedPoolMax > 0 ? parsedPoolMax : 5;

const pool =
  globalForDb.medrellaPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    max: poolMax,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.medrellaPool = pool;
}

export const db = drizzle(pool, { schema });

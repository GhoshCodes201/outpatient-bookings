import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { outpatientBookingPool?: Pool };

const parsedPoolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "5", 10);
const poolMax = Number.isFinite(parsedPoolMax) && parsedPoolMax > 0 ? parsedPoolMax : 5;

const pool =
  globalForDb.outpatientBookingPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    max: poolMax,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.outpatientBookingPool = pool;
}

export const db = drizzle(pool, { schema });

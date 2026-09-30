import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
export const localDemo = () =>
  process.env.NODE_ENV === "development" &&
  process.env.LOCAL_DEMO === "true" &&
  !process.env.DATABASE_URL;
type Db = ReturnType<typeof drizzle<typeof schema>>;
const cache = globalThis as typeof globalThis & {
  terraDb?: Db;
  terraPg?: PGlite;
};
export function getDb(): Db {
  if (cache.terraDb) return cache.terraDb;
  if (process.env.DATABASE_URL) {
    cache.terraDb = drizzle(
      new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 3,
        idleTimeoutMillis: 10000,
      }),
      { schema },
    );
  } else if (localDemo()) {
    cache.terraPg = new PGlite(".local-data/postgres");
    cache.terraDb = pgliteDrizzle(cache.terraPg, { schema }) as unknown as Db;
  } else throw new Error("Falta configurar DATABASE_URL de Neon.");
  return cache.terraDb;
}

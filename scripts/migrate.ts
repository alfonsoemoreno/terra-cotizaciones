import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as localDrizzle } from "drizzle-orm/pglite";
import { migrate as localMigrate } from "drizzle-orm/pglite/migrator";
async function main() {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    });
    try {
      await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
    } finally {
      await pool.end();
    }
  } else if (process.env.LOCAL_DEMO === "true") {
    await mkdir(".local-data", { recursive: true });
    const pg = new PGlite(".local-data/postgres");
    await localMigrate(localDrizzle(pg), { migrationsFolder: "drizzle" });
    await pg.close();
  } else
    throw new Error(
      "Configura DATABASE_URL o habilita LOCAL_DEMO para la base local.",
    );
  console.log("Migraciones aplicadas.");
}
main().catch(() => {
  console.error(
    "No fue posible aplicar migraciones. Revisa la conexión y el entorno.",
  );
  process.exitCode = 1;
});

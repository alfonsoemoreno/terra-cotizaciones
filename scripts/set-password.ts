import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import { setOwnerPassword } from "../src/lib/owner-password";

async function main() {
  if (!process.env.DATABASE_URL || !process.env.TERRA_OWNER_PASSWORD)
    throw new Error(
      "Configura DATABASE_URL y TERRA_OWNER_PASSWORD en el entorno del operador.",
    );
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    await setOwnerPassword(
      drizzle(pool, { schema }),
      process.env.OWNER_EMAIL || "escobar.oceanico@hotmail.com",
      process.env.TERRA_OWNER_PASSWORD,
    );
    console.log(
      "Contraseña de Nelson configurada. Sesiones anteriores revocadas.",
    );
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error && error.message.startsWith("Configura")
      ? error.message
      : "No fue posible configurar la contraseña. Revisa el entorno, las migraciones y su longitud.",
  );
  process.exitCode = 1;
});

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";

export async function setOwnerPassword(
  db: NodePgDatabase<typeof schema>,
  email: string,
  password: string,
) {
  if (password.length < 12 || password.length > 128)
    throw new Error("Usa una contraseña de 12 a 128 caracteres.");
  const normalized = email.trim().toLowerCase();
  const hashed = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx
      .insert(schema.user)
      .values({
        id: randomUUID(),
        name: "Nelson Escobar Belmar",
        email: normalized,
      })
      .onConflictDoNothing({ target: schema.user.email });
    const [owner] = await tx
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, normalized));
    const filter = and(
      eq(schema.account.userId, owner.id),
      eq(schema.account.providerId, "credential"),
    );
    const [existing] = await tx.select().from(schema.account).where(filter);
    if (existing)
      await tx
        .update(schema.account)
        .set({ password: hashed, updatedAt: new Date() })
        .where(filter);
    else
      await tx
        .insert(schema.account)
        .values({
          id: randomUUID(),
          userId: owner.id,
          accountId: owner.id,
          providerId: "credential",
          password: hashed,
        });
    await tx.delete(schema.session).where(eq(schema.session.userId, owner.id));
  });
}

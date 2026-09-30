import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/db/schema";
const state = vi.hoisted(() => ({
  db: null as unknown,
  cookie: "",
}));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => state.db, localDemo: () => false }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: state.cookie }),
}));
import { setOwnerPassword } from "../src/lib/owner-password";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getAuth, requireOwner } from "../src/lib/auth";
const pg = new PGlite();
beforeAll(async () => {
  vi.stubEnv("NODE_ENV", "development");
  const db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  state.db = db;
  process.env.DATABASE_URL = "postgres://example.invalid/terra";
  process.env.BETTER_AUTH_SECRET =
    "a-test-secret-of-at-least-32-characters-long";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.OWNER_EMAIL = "escobar.oceanico@hotmail.com";
  await setOwnerPassword(
    db as unknown as NodePgDatabase<typeof schema>,
    process.env.OWNER_EMAIL,
    "test-password-terra-123",
  );
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await pg.close();
});
function login(
  email: string,
  password = "test-password-terra-123",
  origin = "http://localhost:3000",
) {
  return getAuth().handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin,
      },
      body: JSON.stringify({
        email,
        password,
        callbackURL: "/",
        errorCallbackURL: "/login",
      }),
    }),
  );
}
describe("Acceso privado", () => {
  it("rechaza usuarios distintos a Nelson sin enviar correo", async () => {
    const r = await login("otro@example.com");
    expect(r.status).toBe(403);
    await expect(requireOwner()).rejects.toThrow("Inicia sesión");
  });
  it("permite contraseña válida y rechaza una incorrecta", async () => {
    expect(
      (await login("escobar.oceanico@hotmail.com", "incorrect-password"))
        .status,
    ).toBe(401);
    const response = await login(
      "escobar.oceanico@hotmail.com",
      "test-password-terra-123",
      "http://127.0.0.1:3000",
    );
    expect(response.status).toBe(200);
    state.cookie = response.headers
      .getSetCookie()
      .map((v) => v.split(";")[0])
      .join("; ");
    expect((await requireOwner()).email).toBe("escobar.oceanico@hotmail.com");
  });
  it("no ofrece enlaces por correo ni registro público y revoca sesiones al cambiar contraseña", async () => {
    expect(
      (
        await getAuth().handler(
          new Request("http://localhost:3000/api/auth/sign-in/magic-link", {
            method: "POST",
            headers: {
              origin: "http://localhost:3000",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: "escobar.oceanico@hotmail.com" }),
          }),
        )
      ).status,
    ).toBe(404);
    const signup = await getAuth().handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Nelson",
          email: "escobar.oceanico@hotmail.com",
          password: "test-password-terra-123",
        }),
      }),
    );
    expect(signup.status).toBe(400);
    await setOwnerPassword(
      state.db as NodePgDatabase<typeof schema>,
      "escobar.oceanico@hotmail.com",
      "replacement-password-123",
    );
    await expect(requireOwner()).rejects.toThrow();
  });
  it("rechaza sesiones sin cookie y orígenes externos", async () => {
    state.cookie = "";
    await expect(requireOwner()).rejects.toThrow();
    // Los intentos anteriores ya alcanzaron el límite de tres por minuto.
    expect((await login("escobar.oceanico@hotmail.com")).status).toBe(429);
    await (state.db as NodePgDatabase<typeof schema>).delete(schema.rateLimit);
    const response = await getAuth().handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "https://otro.example",
        },
        body: JSON.stringify({
          email: "escobar.oceanico@hotmail.com",
          callbackURL: "/",
        }),
      }),
    );
    expect(response.status).toBe(403);
  });
});

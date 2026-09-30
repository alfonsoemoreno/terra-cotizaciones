import "server-only";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { getDb, localDemo } from "@/db";
import * as schema from "@/db/schema";
import { allowedOrigins } from "@/lib/origins";
export const ownerEmail = () =>
  (process.env.OWNER_EMAIL || "escobar.oceanico@hotmail.com")
    .trim()
    .toLowerCase();
export function authConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_URL,
  );
}
function createAuth() {
  if (!authConfigured())
    throw new Error(
      "Configura la base y el acceso privado antes de iniciar sesión.",
    );
  return betterAuth({
    appName: "Terra",
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: allowedOrigins(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: { "/sign-in/email": { window: 60, max: 3 } },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (
          ctx.request?.method === "POST" &&
          !allowedOrigins().includes(ctx.request.headers.get("origin") || "")
        )
          throw new APIError("FORBIDDEN", { message: "Origen no permitido." });
        if (
          ctx.path === "/sign-in/email" &&
          String(ctx.body?.email || "")
            .trim()
            .toLowerCase() !== ownerEmail()
        )
          throw new APIError("FORBIDDEN", {
            message: "Acceso reservado a Nelson.",
          });
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (u) => {
            if (u.email.toLowerCase() !== ownerEmail())
              throw new APIError("FORBIDDEN", {
                message: "Registro no permitido.",
              });
            return { data: { ...u, name: "Nelson Escobar Belmar" } };
          },
        },
        update: {
          before: async (u) => {
            if (u.email && u.email.toLowerCase() !== ownerEmail())
              throw new APIError("FORBIDDEN", {
                message: "Cambio de correo no permitido.",
              });
            return { data: u };
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
    },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
export class UnauthorizedError extends Error {
  constructor() {
    super("Inicia sesión para continuar.");
  }
}
export async function requireOwner() {
  if (localDemo())
    return { email: ownerEmail(), name: "Nelson Escobar Belmar" };
  if (!authConfigured()) throw new UnauthorizedError();
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || session.user.email.toLowerCase() !== ownerEmail())
    throw new UnauthorizedError();
  return session.user;
}

import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  bigint,
  uuid,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type {
  ClientInput,
  Company,
  QuoteInput,
  ServiceInput,
  Totals,
  QuoteStatus,
} from "@/lib/domain";
const time = (name: string) =>
  timestamp(name, { withTimezone: true }).notNull().defaultNow();
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: time("created_at"),
  updatedAt: time("updated_at"),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: time("created_at"),
  updatedAt: time("updated_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: time("created_at"),
  updatedAt: time("updated_at"),
});
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: time("created_at"),
  updatedAt: time("updated_at"),
});
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").$type<Company>().notNull(),
  updatedAt: time("updated_at"),
});
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  data: jsonb("data").$type<ClientInput>().notNull(),
  archived: boolean("archived").notNull().default(false),
  createdAt: time("created_at"),
  updatedAt: time("updated_at"),
});
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  data: jsonb("data").$type<ServiceInput>().notNull(),
  archived: boolean("archived").notNull().default(false),
  createdAt: time("created_at"),
  updatedAt: time("updated_at"),
});
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").unique(),
  status: text("status").$type<QuoteStatus>().notNull().default("draft"),
  currentRevision: integer("current_revision").notNull().default(1),
  version: integer("version").notNull().default(1),
  createdAt: time("created_at"),
  updatedAt: time("updated_at"),
});
export const revisions = pgTable(
  "quote_revisions",
  {
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id),
    number: integer("number").notNull(),
    state: text("state").$type<"draft" | "issued">().notNull().default("draft"),
    data: jsonb("data").$type<QuoteInput>().notNull(),
    totals: jsonb("totals").$type<Totals>().notNull(),
    templateVersion: integer("template_version").notNull().default(1),
    createdAt: time("created_at"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.quoteId, t.number] }),
    uniqueIndex("one_draft_per_quote")
      .on(t.quoteId)
      .where(sql`${t.state} = 'draft'`),
  ],
);
export const counters = pgTable("folio_counters", {
  year: integer("year").primaryKey(),
  value: integer("value").notNull(),
});
export const events = pgTable("quote_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id),
  revision: integer("revision").notNull(),
  action: text("action").notNull(),
  note: text("note").notNull().default(""),
  createdAt: time("created_at"),
});
export type ClientRow = typeof clients.$inferSelect;
export type ServiceRow = typeof services.$inferSelect;

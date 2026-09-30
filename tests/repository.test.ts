import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/db/schema";
import { example } from "./fixtures";
const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("@/db", () => ({ getDb: () => state.db, localDemo: () => false }));
import {
  saveClient,
  saveCompany,
  saveQuote,
  issueQuote,
  reviseQuote,
  setQuoteStatus,
  pdfData,
  dashboard,
  ConflictError,
} from "../src/lib/repository";
const pg = new PGlite();
beforeAll(async () => {
  const db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  state.db = db;
});
afterAll(async () => {
  await pg.close();
});
describe("Persistencia y emisión", () => {
  it("congela cliente, empresa y totales; mantiene revisión histórica y respuesta", async () => {
    const c = example().client;
    const [client] = await saveClient(undefined, c);
    const q = await saveQuote(undefined, undefined, example(client.id));
    const issued = await issueQuote(q.id, q.version);
    const original = await pdfData(q.id);
    await saveClient(client.id, { ...c, name: "Cliente modificado" });
    await saveCompany({
      ...original.revision.data.company,
      name: "Empresa modificada",
    });
    expect((await pdfData(q.id)).revision.data).toEqual(original.revision.data);
    const accepted = await setQuoteStatus(
      q.id,
      issued.version,
      "accepted",
      "Aceptación por teléfono",
    );
    const pending = await reviseQuote(q.id, accepted.version);
    expect((await pdfData(q.id)).quote.status).toBe("accepted");
    const edited = await saveQuote(q.id, pending.version, {
      ...example(client.id),
      discount: "0",
    });
    const updated = await issueQuote(q.id, edited.version);
    expect(updated.folio).toBe(issued.folio);
    expect(updated.currentRevision).toBe(2);
    expect(updated.status).toBe("issued");
    expect((await pdfData(q.id, 1)).revision.data).toEqual(
      original.revision.data,
    );
    expect((await pdfData(q.id, 2)).revision.totals.total).toBe("1523200");
  });
  it("asigna folios distintos con emisiones concurrentes", async () => {
    const [c] = await saveClient(undefined, example().client);
    const one = await saveQuote(undefined, undefined, example(c.id)),
      two = await saveQuote(undefined, undefined, example(c.id));
    const results = await Promise.all([
      issueQuote(one.id, one.version),
      issueQuote(two.id, two.version),
    ]);
    expect(results[0].folio).not.toBe(results[1].folio);
  });
  it("no permite sobrescribir ni emitir dos veces con una versión antigua", async () => {
    const [c] = await saveClient(undefined, example().client);
    const q = await saveQuote(undefined, undefined, example(c.id));
    const edited = await saveQuote(q.id, q.version, example(c.id));
    await expect(
      saveQuote(q.id, q.version, example(c.id)),
    ).rejects.toBeInstanceOf(ConflictError);
    const issued = await issueQuote(q.id, edited.version);
    await expect(issueQuote(q.id, edited.version)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(
      saveQuote(q.id, issued.version, example(c.id)),
    ).rejects.toThrow("revisión");
  });
  it("rechaza clientes archivados y transiciones desde estados finales", async () => {
    const [c] = await saveClient(undefined, example().client);
    const q = await saveQuote(undefined, undefined, example(c.id));
    const issued = await issueQuote(q.id, q.version);
    const rejected = await setQuoteStatus(
      q.id,
      issued.version,
      "rejected",
      "Presupuesto",
    );
    await expect(
      setQuoteStatus(q.id, rejected.version, "accepted", ""),
    ).rejects.toThrow("permitido");
    await saveClient(c.id, c.data, true);
    await expect(
      saveQuote(undefined, undefined, example(c.id)),
    ).rejects.toThrow("activo");
    expect((await dashboard()).quotes.length).toBeGreaterThan(0);
  });
});

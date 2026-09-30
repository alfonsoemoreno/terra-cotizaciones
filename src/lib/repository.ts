import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  clients,
  counters,
  events,
  quotes,
  revisions,
  services,
  settings,
} from "@/db/schema";
import {
  calculate,
  clientSchema,
  companySchema,
  defaultCompany,
  quoteSchema,
  serviceSchema,
  type QuoteInput,
  type QuoteStatus,
} from "./domain";

export class ConflictError extends Error {
  constructor() {
    super(
      "Esta cotización cambió en otra ventana. Recarga antes de continuar.",
    );
  }
}
const stamp = () => new Date();
export async function company() {
  return (
    (await getDb().select().from(settings).where(eq(settings.id, 1)))[0]
      ?.data ?? defaultCompany
  );
}
export async function dashboard() {
  const db = getDb();
  const [c, s, q, r, co] = await Promise.all([
    db.select().from(clients).orderBy(desc(clients.createdAt)),
    db.select().from(services).orderBy(desc(services.createdAt)),
    db.select().from(quotes).orderBy(desc(quotes.updatedAt)),
    db.select().from(revisions).orderBy(desc(revisions.number)),
    company(),
  ]);
  return {
    clients: c,
    services: s,
    quotes: q.map((x) => ({
      ...x,
      revisions: r.filter((v) => v.quoteId === x.id),
    })),
    company: co,
  };
}
export async function saveClient(
  id: string | undefined,
  input: unknown,
  archive?: boolean,
) {
  const data = clientSchema.parse(input),
    db = getDb();
  if (id)
    return db
      .update(clients)
      .set({ data, archived: archive ?? false, updatedAt: stamp() })
      .where(eq(clients.id, id))
      .returning();
  return db.insert(clients).values({ data }).returning();
}
export async function saveService(
  id: string | undefined,
  input: unknown,
  archive?: boolean,
) {
  const data = serviceSchema.parse(input),
    db = getDb();
  if (id)
    return db
      .update(services)
      .set({ data, archived: archive ?? false, updatedAt: stamp() })
      .where(eq(services.id, id))
      .returning();
  return db.insert(services).values({ data }).returning();
}
export async function saveCompany(input: unknown) {
  const data = companySchema.parse(input);
  await getDb()
    .insert(settings)
    .values({ id: 1, data })
    .onConflictDoUpdate({
      target: settings.id,
      set: { data, updatedAt: stamp() },
    });
}
async function authoritative(input: unknown): Promise<QuoteInput> {
  const parsed = quoteSchema.parse(input),
    db = getDb();
  const row = (
    await db.select().from(clients).where(eq(clients.id, parsed.clientId))
  )[0];
  if (!row || row.archived) throw new Error("Selecciona un cliente activo.");
  return { ...parsed, client: row.data, company: await company() };
}
export async function saveQuote(
  id: string | undefined,
  version: number | undefined,
  input: unknown,
) {
  const data = await authoritative(input),
    totals = calculate(data);
  return getDb().transaction(async (tx) => {
    if (!id) {
      const [q] = await tx.insert(quotes).values({}).returning();
      await tx
        .insert(revisions)
        .values({ quoteId: q.id, number: 1, data, totals });
      await tx
        .insert(events)
        .values({ quoteId: q.id, revision: 1, action: "Borrador creado" });
      return q;
    }
    const [q] = await tx
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .for("update");
    if (!q) throw new Error("Cotización no encontrada.");
    if (q.version !== version) throw new ConflictError();
    const [draft] = await tx
      .select()
      .from(revisions)
      .where(and(eq(revisions.quoteId, id), eq(revisions.state, "draft")));
    if (!draft)
      throw new Error("Crea una revisión para editar una cotización emitida.");
    await tx
      .update(revisions)
      .set({ data, totals })
      .where(
        and(
          eq(revisions.quoteId, id),
          eq(revisions.number, draft.number),
          eq(revisions.state, "draft"),
        ),
      );
    const [updated] = await tx
      .update(quotes)
      .set({ version: q.version + 1, updatedAt: stamp() })
      .where(eq(quotes.id, id))
      .returning();
    return updated;
  });
}
export async function issueQuote(id: string, version: number) {
  return getDb().transaction(async (tx) => {
    const [q] = await tx
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .for("update");
    if (!q) throw new Error("Cotización no encontrada.");
    if (q.version !== version) throw new ConflictError();
    const [draft] = await tx
      .select()
      .from(revisions)
      .where(and(eq(revisions.quoteId, id), eq(revisions.state, "draft")));
    if (!draft) throw new Error("No hay un borrador para emitir.");
    const data = quoteSchema.parse(draft.data),
      totals = calculate(data);
    let folio = q.folio;
    if (!folio) {
      const year = Number(data.date.slice(0, 4));
      const [counter] = await tx
        .insert(counters)
        .values({ year, value: 1 })
        .onConflictDoUpdate({
          target: counters.year,
          set: { value: sql`${counters.value} + 1` },
        })
        .returning();
      folio = `TERR-${year}-${String(counter.value).padStart(4, "0")}`;
    }
    await tx
      .update(revisions)
      .set({ state: "issued", issuedAt: stamp(), totals })
      .where(
        and(eq(revisions.quoteId, id), eq(revisions.number, draft.number)),
      );
    const [updated] = await tx
      .update(quotes)
      .set({
        folio,
        status: "issued",
        currentRevision: draft.number,
        version: q.version + 1,
        updatedAt: stamp(),
      })
      .where(eq(quotes.id, id))
      .returning();
    await tx
      .insert(events)
      .values({
        quoteId: id,
        revision: draft.number,
        action: "Cotización emitida",
      });
    return updated;
  });
}
export async function reviseQuote(id: string, version: number) {
  return getDb().transaction(async (tx) => {
    const [q] = await tx
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .for("update");
    if (!q) throw new Error("Cotización no encontrada.");
    if (q.version !== version) throw new ConflictError();
    const all = await tx
      .select()
      .from(revisions)
      .where(eq(revisions.quoteId, id))
      .orderBy(desc(revisions.number));
    if (all.some((r) => r.state === "draft"))
      throw new Error("Ya existe una revisión en borrador.");
    const current = all.find((r) => r.number === q.currentRevision);
    if (!current) throw new Error("Revisión no encontrada.");
    const number = all[0].number + 1;
    await tx
      .insert(revisions)
      .values({
        quoteId: id,
        number,
        data: current.data,
        totals: current.totals,
      });
    const [updated] = await tx
      .update(quotes)
      .set({ version: q.version + 1, updatedAt: stamp() })
      .where(eq(quotes.id, id))
      .returning();
    await tx
      .insert(events)
      .values({
        quoteId: id,
        revision: number,
        action: "Revisión en borrador creada",
      });
    return updated;
  });
}
export async function setQuoteStatus(
  id: string,
  version: number,
  status: QuoteStatus,
  note: string,
) {
  return getDb().transaction(async (tx) => {
    const [q] = await tx
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .for("update");
    if (!q) throw new Error("Cotización no encontrada.");
    if (q.version !== version) throw new ConflictError();
    const allowed: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
      issued: ["sent", "accepted", "rejected", "cancelled"],
      sent: ["accepted", "rejected", "cancelled"],
    };
    if (!allowed[q.status]?.includes(status))
      throw new Error("Este cambio de estado no está permitido.");
    const [updated] = await tx
      .update(quotes)
      .set({ status, version: q.version + 1, updatedAt: stamp() })
      .where(eq(quotes.id, id))
      .returning();
    await tx
      .insert(events)
      .values({
        quoteId: id,
        revision: q.currentRevision,
        action: status,
        note: note.slice(0, 2000),
      });
    return updated;
  });
}
export async function quoteHistory(id: string) {
  return getDb()
    .select()
    .from(events)
    .where(eq(events.quoteId, id))
    .orderBy(desc(events.createdAt));
}
export async function pdfData(id: string, revision?: number) {
  const db = getDb();
  const [q] = await db.select().from(quotes).where(eq(quotes.id, id));
  if (!q) throw new Error("Cotización no encontrada.");
  const [r] = await db
    .select()
    .from(revisions)
    .where(
      and(
        eq(revisions.quoteId, id),
        eq(revisions.number, revision ?? q.currentRevision),
      ),
    );
  if (!r) throw new Error("Revisión no encontrada.");
  return { quote: q, revision: r };
}

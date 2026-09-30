import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as localDrizzle } from "drizzle-orm/pglite";
import {
  clients,
  settings,
  services,
  quotes,
  revisions,
  events,
  counters,
} from "../src/db/schema";
import {
  calculate,
  defaultCompany,
  today,
  type QuoteInput,
} from "../src/lib/domain";
async function main() {
  if (process.env.LOCAL_DEMO !== "true" || process.env.DATABASE_URL)
    throw new Error(
      "La carga de ejemplos solo está permitida en la base local.",
    );
  const pg = new PGlite(".local-data/postgres"),
    db = localDrizzle(pg);
  const existing = await db.select().from(clients);
  if (existing.length) {
    console.log("La base ya contiene clientes; no se agregaron ejemplos.");
    await pg.close();
    return;
  }
  const client = {
    name: "Guillermo Sepúlveda",
    type: "person" as const,
    rut: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
  };
  const [row] = await db.insert(clients).values({ data: client }).returning();
  await db
    .insert(settings)
    .values({ id: 1, data: defaultCompany })
    .onConflictDoNothing();
  const catalog = [
    {
      name: "Despeje y roce de arbustos",
      description: "Limpieza superficial de maleza y arbustos en 800 m².",
      category: "Forestal",
      unit: "m²",
      mode: "unit" as const,
      price: "850",
      kind: "service" as const,
    },
    {
      name: "Tala de árboles secos",
      description: "Corte controlado, trozado y acopio de ejemplares secos.",
      category: "Forestal",
      unit: "Global",
      mode: "global" as const,
      price: "250000",
      kind: "service" as const,
    },
    {
      name: "Operación y logística",
      description: "Mano de obra, combustible, equipos y EPP.",
      category: "Forestal",
      unit: "Día",
      mode: "time" as const,
      price: "70000",
      kind: "service" as const,
    },
  ];
  await db.insert(services).values(catalog.map((data) => ({ data })));
  const date = today(),
    year = Number(date.slice(0, 4));
  const data: QuoteInput = {
    clientId: row.id,
    client,
    company: defaultCompany,
    project: "Limpieza de terreno y tala",
    description:
      "Servicio integral de limpieza de 800 m², despeje de vegetación menor, desbroce de arbustos y tala segura de árboles secos.",
    location: "",
    date,
    validDays: 15,
    duration: "5",
    dayType: "business",
    items: catalog.map((s, n) => ({
      ...s,
      id: crypto.randomUUID(),
      quantity: ["800", "1", "5"][n],
      duration: "1",
      useProjectDuration: false,
    })),
    discountType: "percent",
    discount: "20",
    payment: defaultCompany.payment,
    conditions: defaultCompany.conditions,
    pdfDetail: "full",
  };
  const [q] = await db
    .insert(quotes)
    .values({ folio: `TERR-${year}-0001`, status: "sent" })
    .returning();
  await db
    .insert(revisions)
    .values({
      quoteId: q.id,
      number: 1,
      state: "issued",
      data,
      totals: calculate(data),
      issuedAt: new Date(),
    });
  await db.insert(counters).values({ year, value: 1 }).onConflictDoNothing();
  await db
    .insert(events)
    .values({ quoteId: q.id, revision: 1, action: "Ejemplo local cargado" });
  await pg.close();
  console.log("Ejemplo local cargado: total $1.218.560. No se modificó Neon.");
}
main().catch((e) => {
  console.error(
    e instanceof Error ? e.message : "No fue posible cargar ejemplos.",
  );
  process.exitCode = 1;
});

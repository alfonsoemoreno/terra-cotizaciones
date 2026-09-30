import { requireOwner, UnauthorizedError } from "@/lib/auth";
import {
  ConflictError,
  dashboard,
  issueQuote,
  quoteHistory,
  reviseQuote,
  saveClient,
  saveCompany,
  saveQuote,
  saveService,
  setQuoteStatus,
} from "@/lib/repository";
import { z } from "zod";
import { statuses } from "@/lib/domain";
import { allowedOrigins } from "@/lib/origins";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const command = z.object({
  action: z.enum([
    "client",
    "service",
    "settings",
    "save",
    "issue",
    "revise",
    "status",
  ]),
  id: z.string().uuid().optional(),
  version: z.number().int().positive().optional(),
  data: z.unknown().optional(),
  archived: z.boolean().optional(),
  status: z.enum(statuses).optional(),
  note: z.string().max(2000).optional(),
});
function failure(error: unknown) {
  if (error instanceof UnauthorizedError)
    return Response.json({ error: error.message }, { status: 401 });
  if (error instanceof z.ZodError)
    return Response.json(
      { error: error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  if (error instanceof ConflictError)
    return Response.json({ error: error.message }, { status: 409 });
  console.error(
    "Terra: operación de datos fallida",
    error instanceof Error ? error.name : "Unknown",
  );
  return Response.json(
    {
      error:
        error instanceof Error && !error.message.includes("query")
          ? error.message
          : "No fue posible guardar. Revisa los datos o intenta de nuevo.",
    },
    { status: 400 },
  );
}
export async function GET(request: Request) {
  try {
    await requireOwner();
    const id = new URL(request.url).searchParams.get("history");
    if (id)
      return Response.json(await quoteHistory(z.string().uuid().parse(id)), {
        headers: { "Cache-Control": "no-store" },
      });
    return Response.json(await dashboard(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const origins = process.env.BETTER_AUTH_URL
      ? allowedOrigins()
      : [`${new URL(request.url).protocol}//${request.headers.get("host")}`];
    if (!origins.includes(request.headers.get("origin") || ""))
      return Response.json({ error: "Origen no permitido." }, { status: 403 });
    await requireOwner();
    if (Number(request.headers.get("content-length") || 0) > 1_000_000)
      return Response.json(
        { error: "Solicitud demasiado grande." },
        { status: 413 },
      );
    const c = command.parse(await request.json());
    if (c.action === "client") await saveClient(c.id, c.data, c.archived);
    else if (c.action === "service")
      await saveService(c.id, c.data, c.archived);
    else if (c.action === "settings") await saveCompany(c.data);
    else if (c.action === "save") {
      const quote = await saveQuote(c.id, c.version, c.data);
      return Response.json({ id: quote.id, version: quote.version });
    } else {
      if (!c.id || !c.version)
        throw new Error("Falta identificar la cotización.");
      if (c.action === "issue") await issueQuote(c.id, c.version);
      else if (c.action === "revise") await reviseQuote(c.id, c.version);
      else if (c.action === "status") {
        if (!c.status) throw new Error("Selecciona un estado.");
        await setQuoteStatus(c.id, c.version, c.status, c.note ?? "");
      }
    }
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireOwner, UnauthorizedError } from "@/lib/auth";
import { pdfData } from "@/lib/repository";
import { QuotePdf } from "@/components/quote-pdf";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOwner();
    const { id } = await params;
    z.uuid().parse(id);
    const n = new URL(request.url).searchParams.get("revision");
    const revision = n
      ? z.coerce.number().int().positive().parse(n)
      : undefined;
    const { quote, revision: r } = await pdfData(id, revision);
    if (r.templateVersion !== 1) throw new Error("Plantilla no disponible.");
    const image = await readFile(
        path.join(process.cwd(), "public/terra-logo.png"),
      ),
      logo = "data:image/png;base64," + image.toString("base64");
    const buffer = await renderToBuffer(
      <QuotePdf
        data={r.data}
        totals={r.totals}
        folio={quote.folio ?? "Borrador"}
        revision={r.number}
        draft={r.state === "draft"}
        logo={logo}
      />,
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quote.folio ?? "Terra-borrador"}-rev-${r.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof UnauthorizedError
            ? e.message
            : "No fue posible generar este PDF.",
      },
      { status: e instanceof UnauthorizedError ? 401 : 400 },
    );
  }
}

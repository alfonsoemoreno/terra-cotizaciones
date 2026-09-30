import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const origin = process.env.TEST_URL || "http://127.0.0.1:3000";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin);
    await page
      .getByRole("heading", { name: "Cotizaciones", exact: true })
      .waitFor();
    const resp = await page.request.get(origin + "/api/data");
    assert.equal(resp.status(), 200);
    const original = await resp.json();
    assert.ok(
      original.clients.length > 0,
      "Cargar ejemplo local antes de la prueba",
    );
    const sample = original.quotes.find(
      (q) => q.folio && q.revisions.some((r) => r.totals.total === "1218560"),
    );
    const row = page.getByRole("row").filter({ hasText: sample.folio });
    await row.getByRole("button", { name: "Abrir", exact: true }).click();
    await page.getByRole("link", { name: "Descargar PDF" }).waitFor();
    const href = await page
      .getByRole("link", { name: "Descargar PDF" })
      .getAttribute("href");
    const pdf = await page.request.get(origin + href);
    assert.equal(pdf.status(), 200);
    assert.match(pdf.headers()["content-type"], /application\/pdf/);
    await fs.writeFile("design/runtime-example.pdf", await pdf.body());
    await page.getByRole("button", { name: "Duplicar", exact: true }).click();
    await page
      .getByLabel("Nombre del proyecto")
      .fill("Verificación del flujo Terra");
    await page
      .getByLabel("Descripción del requerimiento")
      .fill(
        "Cotización de prueba local para verificar emisión, PDF y aceptación.",
      );
    await page
      .getByRole("button", { name: "Guardar borrador", exact: true })
      .click();
    await page.getByText("Borrador guardado.", { exact: true }).waitFor();
    await page.reload();
    const saved = page
      .getByRole("row")
      .filter({ hasText: "Verificación del flujo Terra" })
      .first();
    await saved.getByRole("button", { name: "Abrir", exact: true }).click();
    assert.equal(
      await page.getByLabel("Nombre del proyecto").inputValue(),
      "Verificación del flujo Terra",
    );
    await page.screenshot({
      path: "design/app-editor-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 850 });
    assert.equal(
      await page
        .locator("body")
        .evaluate((e) => e.scrollWidth > window.innerWidth + 1),
      false,
    );
    await page.screenshot({
      path: "design/app-editor-mobile.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Vista previa", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Emitir cotización", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Emitir cotización", exact: true })
      .click();
    await page.getByRole("button", { name: "Aceptada", exact: true }).waitFor();
    await page.getByRole("button", { name: "Aceptada", exact: true }).click();
    await page
      .getByLabel("Nota o motivo (opcional)")
      .fill("Cliente acepta en la prueba local.");
    await page.getByRole("button", { name: "Confirmar estado" }).click();
    await page.getByText("Estado registrado.", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Crear revisión", exact: true })
      .click();
    await page
      .getByText(
        "Nueva revisión en borrador. La versión emitida permanece intacta.",
        { exact: true },
      )
      .waitFor();
    await page.getByLabel("Valor", { exact: true }).fill("0");
    await page
      .getByRole("button", { name: "Vista previa", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Emitir cotización", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Rechazada", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Rechazada", exact: true }).click();
    await page.getByRole("button", { name: "Confirmar estado" }).click();
    await page.getByText("Estado registrado.", { exact: true }).waitFor();
    const latest = await (await page.request.get(origin + "/api/data")).json();
    const candidate = latest.quotes.find((q) =>
      q.revisions.some(
        (r) => r.data.project === "Verificación del flujo Terra",
      ),
    );
    assert.equal(candidate.status, "rejected");
    assert.equal(candidate.revisions.length, 2);
    assert.equal(
      candidate.revisions.find((r) => r.number === 1).totals.total,
      "1218560",
    );
    const many = structuredClone(
      sample.revisions.find((r) => r.number === 1).data,
    );
    many.project = "Prueba de PDF extenso";
    many.items = Array.from({ length: 36 }, (_, i) => ({
      ...many.items[i % 3],
      id: crypto.randomUUID(),
      name: `Servicio de prueba ${i + 1}`,
      description:
        "Detalle del alcance: preparación, ejecución y entrega conforme del servicio descrito.",
    }));
    const command = await page.request.post(origin + "/api/data", {
      headers: { origin },
      data: { action: "save", data: many },
    });
    assert.equal(command.status(), 200);
    const id = (await command.json()).id;
    const longPdf = await page.request.get(`${origin}/api/quotes/${id}/pdf`);
    assert.equal(longPdf.status(), 200);
    await fs.writeFile("design/runtime-multipage.pdf", await longPdf.body());
    const csrf = await page.request.post(origin + "/api/data", {
      headers: { origin: "https://otro.example" },
      data: { action: "settings", data: original.company },
    });
    assert.equal(csrf.status(), 403);
    assert.deepEqual(errors, []);
    console.log(
      "Navegador verificado: guardado tras recarga, emisión, aceptación, revisión, rechazo, PDF, móvil y origen de solicitudes.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

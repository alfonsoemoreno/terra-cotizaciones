import fs from "node:fs/promises";
const origin = process.env.TEST_URL || "http://127.0.0.1:3000";
const r = await fetch(origin + "/api/data");
if (!r.ok)
  throw new Error("Iniciar servidor y ejemplo local antes de revisar PDF.");
const data = await r.json();
for (const [match, target] of [
  [
    (q) =>
      q.folio && q.revisions[0].data.project === "Limpieza de terreno y tala",
    "design/runtime-example.pdf",
  ],
  [
    (q) => q.revisions[0].data.project === "Prueba de PDF extenso",
    "design/runtime-multipage.pdf",
  ],
]) {
  const q = data.quotes.find(match);
  if (!q) throw new Error("Falta cotización de prueba.");
  const pdf = await fetch(`${origin}/api/quotes/${q.id}/pdf?revision=1`);
  if (!pdf.ok) throw new Error("Falló PDF.");
  await fs.writeFile(target, Buffer.from(await pdf.arrayBuffer()));
}
console.log("PDF de ejemplo y multipágina regenerados desde la aplicación.");

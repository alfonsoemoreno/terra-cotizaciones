/* eslint-disable jsx-a11y/alt-text -- Image belongs to React PDF, not HTML. */
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  dateLabel,
  modeLabels,
  money,
  validUntil,
  type QuoteInput,
  type Totals,
} from "@/lib/domain";
const green = "#204b39",
  ink = "#25382b",
  muted = "#617468";
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: ink,
    paddingTop: 148,
    paddingBottom: 54,
    paddingHorizontal: 34,
  },
  head: {
    position: "absolute",
    top: 32,
    left: 34,
    right: 34,
    height: 102,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderColor: green,
    marginBottom: 14,
  },
  logo: { width: 82, height: 88, objectFit: "contain" },
  title: {
    fontSize: 22,
    color: green,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  muted: { color: muted, fontSize: 8 },
  parties: {
    flexDirection: "row",
    backgroundColor: "#f0f5f0",
    padding: 12,
    marginBottom: 19,
  },
  party: { width: "50%" },
  bold: { fontFamily: "Helvetica-Bold" },
  section: {
    fontSize: 11,
    color: green,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  body: { marginBottom: 6 },
  thead: {
    flexDirection: "row",
    backgroundColor: green,
    color: "#fff",
    paddingVertical: 9,
    paddingHorizontal: 7,
    fontSize: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 7,
    borderBottomWidth: 0.5,
    borderColor: "#dde6dd",
    fontSize: 8,
  },
  description: { width: "44%", paddingRight: 8 },
  qty: { width: "14%", textAlign: "center" },
  price: { width: "20%", textAlign: "right", paddingRight: 9 },
  total: { width: "22%", textAlign: "right" },
  summary: { marginTop: 15, marginLeft: "50%", marginBottom: 12 },
  sumrow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    fontSize: 9,
  },
  final: {
    backgroundColor: green,
    color: "#fff",
    padding: 9,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  signature: {
    width: "42%",
    borderTopWidth: 0.5,
    borderColor: muted,
    paddingTop: 8,
    textAlign: "center",
    fontSize: 8,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 34,
    right: 34,
    borderTopWidth: 0.5,
    borderColor: "#dde6dd",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    color: muted,
    fontSize: 7,
  },
  label: {
    fontSize: 8,
    color: green,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
});
export function QuotePdf({
  data,
  totals,
  folio,
  revision,
  draft,
  logo,
}: {
  data: QuoteInput;
  totals: Totals;
  folio: string;
  revision: number;
  draft: boolean;
  logo: string;
}) {
  const full = data.pdfDetail === "full";
  return (
    <Document
      title={`${data.company.brand} · ${folio}`}
      author={data.company.name}
    >
      <Page size="LETTER" style={s.page}>
        <View style={s.head} fixed>
          <Image src={logo} style={s.logo} />
          <View style={{ textAlign: "right" }}>
            <Text style={s.title}>COTIZACIÓN</Text>
            <Text style={s.bold}>
              {folio} / Rev. {revision}
            </Text>
            <Text style={s.muted}>
              {data.company.brand} · Servicios & Proyectos Integrales
            </Text>
            {draft && (
              <Text style={{ ...s.muted, marginTop: 5 }}>
                BORRADOR - NO EMITIDA
              </Text>
            )}
          </View>
        </View>
        <View style={s.parties} wrap={false}>
          <View style={s.party}>
            <Text style={s.label}>PRESTADOR</Text>
            <Text style={s.bold}>{data.company.name}</Text>
            {data.company.rut && <Text>RUT: {data.company.rut}</Text>}
            <Text>{data.company.phone}</Text>
            <Text>{data.company.email}</Text>
            {data.company.address && <Text>{data.company.address}</Text>}
          </View>
          <View style={s.party}>
            <Text style={s.label}>CLIENTE</Text>
            <Text style={s.bold}>{data.client.name}</Text>
            {data.client.rut && <Text>RUT: {data.client.rut}</Text>}
            {data.client.contact && (
              <Text>Contacto: {data.client.contact}</Text>
            )}
            <Text>Emisión: {dateLabel(data.date)}</Text>
            <Text>Validez: {data.validDays} días corridos</Text>
            <Text>
              Válida hasta: {dateLabel(validUntil(data.date, data.validDays))}
            </Text>
          </View>
        </View>
        <Text style={s.section}>{data.project}</Text>
        <Text style={s.body}>{data.description}</Text>
        {data.location && <Text style={s.body}>Lugar: {data.location}</Text>}
        <Text style={s.body}>
          Plazo estimado: {data.duration} días{" "}
          {data.dayType === "business" ? "hábiles" : "corridos"}.
        </Text>
        <View>
          <Text style={s.section}>DETALLE DEL PRESUPUESTO</Text>
          <View style={s.thead} wrap={false} fixed>
            <Text style={s.description}>Servicio</Text>
            <Text style={s.qty}>Cant. / unidad</Text>
            <Text style={s.price}>{full ? "Precio neto" : "Modalidad"}</Text>
            <Text style={s.total}>Total neto</Text>
          </View>
          {data.items.map((i, n) => (
            <View key={i.id} style={s.row} wrap={false}>
              <View style={s.description}>
                <Text style={s.bold}>{i.name}</Text>
                {i.description && <Text>{i.description}</Text>}
                <Text style={s.muted}>
                  {i.category}
                  {i.mode === "resource"
                    ? ` · ${i.useProjectDuration ? data.duration : i.duration} días`
                    : ""}
                </Text>
              </View>
              <Text style={s.qty}>
                {i.mode === "global" ? "1 Global" : `${i.quantity} ${i.unit}`}
              </Text>
              <Text style={s.price}>
                {full ? money(i.price) : modeLabels[i.mode]}
                {full && i.mode === "resource" ? " / recurso / día" : ""}
              </Text>
              <Text style={s.total}>{money(totals.lines[n])}</Text>
            </View>
          ))}
        </View>
        <View style={s.summary} wrap={false}>
          {[
            ["Subtotal neto", totals.subtotal],
            [
              `Descuento (${data.discountType === "percent" ? data.discount + "%" : "monto fijo"})`,
              "-" + money(totals.discount),
            ],
            ["Neto con descuento", totals.net],
            ["IVA (19%)", totals.vat],
          ].map(([k, v]) => (
            <View key={k} style={s.sumrow}>
              <Text>{k}</Text>
              <Text>{k.startsWith("Descuento") ? v : money(v)}</Text>
            </View>
          ))}
          <View style={[s.sumrow, s.final]}>
            <Text>TOTAL CLP</Text>
            <Text>{money(totals.total)}</Text>
          </View>
        </View>
        <View minPresenceAhead={70}>
          <Text style={s.section}>CONDICIONES COMERCIALES</Text>
          <Text style={s.body}>{data.payment}</Text>
          <Text style={s.body}>{data.conditions}</Text>
        </View>
        <View style={s.signatures} wrap={false}>
          <View style={s.signature}>
            <Text style={s.bold}>{data.company.name}</Text>
            <Text>Prestador del servicio</Text>
          </View>
          <View style={s.signature}>
            <Text style={s.bold}>{data.client.name}</Text>
            <Text>Aceptación del cliente</Text>
          </View>
        </View>
        <View style={s.footer} fixed>
          <Text>{data.company.brand} · Servicios & Proyectos Integrales</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

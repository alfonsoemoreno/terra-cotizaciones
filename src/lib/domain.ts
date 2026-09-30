import Decimal from "decimal.js";
import { z } from "zod";

const text = (max = 200) => z.string().trim().max(max);
const required = (max = 200) => text(max).min(1, "Este campo es obligatorio.");
const decimal = z
  .string()
  .regex(
    /^\d{1,10}(\.\d{1,4})?$/,
    "Usa un número positivo con hasta 4 decimales.",
  );
const positive = decimal.refine((v) => {
  try {
    return new Decimal(v).gt(0);
  } catch {
    return false;
  }
}, "Debe ser mayor que cero.");
export const clientSchema = z.object({
  name: required(),
  type: z.enum(["person", "company"]),
  rut: text(20),
  contact: text(),
  email: z.union([z.literal(""), z.email()]),
  phone: text(40),
  address: text(400),
});
export type ClientInput = z.infer<typeof clientSchema>;
export const serviceSchema = z.object({
  name: required(),
  description: text(2000),
  category: required(80),
  unit: required(40),
  mode: z.enum(["unit", "time", "resource", "global"]),
  price: decimal,
  kind: z.enum([
    "service",
    "labor",
    "material",
    "equipment",
    "transport",
    "other",
  ]),
});
export type ServiceInput = z.infer<typeof serviceSchema>;
export const companySchema = z.object({
  brand: required(),
  name: required(),
  rut: text(20),
  phone: text(40),
  email: z.email(),
  address: text(400),
  validDays: z.number().int().min(1).max(365),
  payment: required(3000),
  conditions: text(5000),
  categories: z.array(required(80)).min(1).max(40),
  units: z.array(required(40)).min(1).max(40),
});
export type Company = z.infer<typeof companySchema>;
export const itemSchema = z.object({
  id: z.string().uuid(),
  name: required(300),
  description: text(2000),
  category: required(80),
  kind: serviceSchema.shape.kind,
  mode: serviceSchema.shape.mode,
  quantity: positive,
  unit: required(40),
  price: decimal,
  duration: positive,
  useProjectDuration: z.boolean(),
});
export type QuoteItem = z.infer<typeof itemSchema>;
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === v;
  }, "Fecha inválida.");
export const quoteSchema = z.object({
  clientId: z.string().uuid(),
  client: clientSchema,
  company: companySchema,
  project: required(300),
  description: required(6000),
  location: text(400),
  date,
  validDays: z.number().int().min(1).max(365),
  duration: positive,
  dayType: z.enum(["business", "calendar"]),
  items: z.array(itemSchema).min(1, "Agrega al menos un ítem.").max(200),
  discountType: z.enum(["percent", "fixed"]),
  discount: decimal,
  payment: required(3000),
  conditions: text(5000),
  pdfDetail: z.enum(["full", "summary"]),
});
export type QuoteInput = z.infer<typeof quoteSchema>;
export type Totals = {
  lines: string[];
  subtotal: string;
  discount: string;
  net: string;
  vat: string;
  total: string;
  vatRate: "19";
};
const round = (d: Decimal) => d.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
export function calculate(
  input: Pick<QuoteInput, "items" | "duration" | "discount" | "discountType">,
): Totals {
  const lines = input.items.map((i) =>
    round(
      new Decimal(i.price)
        .mul(i.mode === "global" ? 1 : i.quantity)
        .mul(
          i.mode === "resource"
            ? i.useProjectDuration
              ? input.duration
              : i.duration
            : 1,
        ),
    ),
  );
  const subtotal = lines.reduce((a, b) => a.plus(b), new Decimal(0));
  const value = new Decimal(input.discount);
  if (value.isNegative() || (input.discountType === "percent" && value.gt(100)))
    throw new Error("El descuento porcentual debe estar entre 0 y 100.");
  const discount =
    input.discountType === "percent"
      ? round(subtotal.mul(value).div(100))
      : round(value);
  if (discount.gt(subtotal))
    throw new Error("El descuento no puede superar el subtotal.");
  const net = subtotal.minus(discount),
    vat = round(net.mul("0.19")),
    total = net.plus(vat);
  if (total.gt("999999999999999"))
    throw new Error("El total supera el máximo admitido.");
  return {
    lines: lines.map((v) => v.toFixed(0)),
    subtotal: subtotal.toFixed(0),
    discount: discount.toFixed(0),
    net: net.toFixed(0),
    vat: vat.toFixed(0),
    total: total.toFixed(0),
    vatRate: "19",
  };
}
export const statuses = [
  "draft",
  "issued",
  "sent",
  "accepted",
  "rejected",
  "cancelled",
] as const;
export type QuoteStatus = (typeof statuses)[number];
export const statusLabels: Record<QuoteStatus, string> = {
  draft: "Borrador",
  issued: "Emitida",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  cancelled: "Anulada",
};
export const modeLabels = {
  unit: "Por unidad",
  time: "Por tiempo",
  resource: "Por recurso y tiempo",
  global: "Global / suma alzada",
};
export const kindLabels = {
  service: "Servicio",
  labor: "Mano de obra",
  material: "Material",
  equipment: "Equipo",
  transport: "Traslado",
  other: "Otro",
};
export function money(v: string | number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(v));
}
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function validUntil(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date + "T12:00:00Z"));
}
export function isExpired(status: QuoteStatus, date: string, days: number) {
  return (
    ["issued", "sent"].includes(status) && validUntil(date, days) < today()
  );
}
export const defaultCompany: Company = {
  brand: "Terra",
  name: "Nelson Escobar Belmar",
  rut: "",
  phone: "+56 9 7851 5073",
  email: "escobar.oceanico@hotmail.com",
  address: "",
  validDays: 15,
  payment: "50% de anticipo al inicio y 50% contra entrega conforme.",
  conditions:
    "Gestión de residuos: restos vegetales trozados y acopiados dentro de la parcela.\nSeguridad: uso de EPP y seguros correspondientes del equipo.",
  categories: ["Forestal", "Construcción", "Electricidad", "Automatización"],
  units: [
    "Ha",
    "m²",
    "m³",
    "Unidad",
    "Punto",
    "Metro",
    "Hora",
    "Día",
    "Jornada",
    "Viaje",
    "Global",
  ],
};

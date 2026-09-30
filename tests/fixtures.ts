import {
  defaultCompany,
  type QuoteInput,
  type QuoteItem,
} from "../src/lib/domain";
export function example(clientId = crypto.randomUUID()): QuoteInput {
  return {
    clientId,
    client: {
      name: "Cliente",
      type: "person",
      rut: "",
      contact: "",
      email: "",
      phone: "",
      address: "",
    },
    company: defaultCompany,
    project: "Proyecto",
    description: "Detalle del trabajo",
    location: "",
    date: "2026-09-30",
    validDays: 15,
    duration: "5",
    dayType: "business",
    items: [
      item("unit", "800", "850", "m²"),
      item("global", "1", "250000", "Global"),
      item("time", "5", "70000", "Día"),
    ],
    discountType: "percent",
    discount: "20",
    payment: defaultCompany.payment,
    conditions: defaultCompany.conditions,
    pdfDetail: "full",
  };
}
export function item(
  mode: QuoteItem["mode"],
  quantity: string,
  price: string,
  unit: string,
): QuoteItem {
  return {
    id: crypto.randomUUID(),
    name: "Servicio",
    description: "",
    category: "Forestal",
    kind: "service",
    mode,
    quantity,
    price,
    unit,
    duration: "1",
    useProjectDuration: false,
  };
}

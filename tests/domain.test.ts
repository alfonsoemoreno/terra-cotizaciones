import { describe, expect, it } from "vitest";
import { calculate, quoteSchema, validUntil } from "../src/lib/domain";
import { example, item } from "./fixtures";

describe("Cotizaciones", () => {
  it("reproduce el ejemplo y aplica descuento antes del IVA", () => {
    expect(calculate(example())).toMatchObject({
      subtotal: "1280000",
      discount: "256000",
      net: "1024000",
      vat: "194560",
      total: "1218560",
    });
  });
  it("equivale descuento fijo a porcentaje y permite 100%", () => {
    const q = example();
    expect(
      calculate({ ...q, discountType: "fixed", discount: "256000" }),
    ).toEqual(calculate(q));
    expect(calculate({ ...q, discount: "100" }).total).toBe("0");
  });
  it("no multiplica dos veces los ítems por tiempo y separa recursos", () => {
    const q = example();
    q.items = [
      item("time", "5", "70000", "Día"),
      { ...item("resource", "2", "150000", "Equipo"), duration: "3" },
    ];
    q.discount = "0";
    expect(calculate(q).lines).toEqual(["350000", "900000"]);
    q.items[1].useProjectDuration = true;
    q.duration = "4";
    expect(calculate(q).lines).toEqual(["350000", "1200000"]);
  });
  it("usa decimales y redondeo por línea que cuadra con los totales", () => {
    const q = example();
    q.items = [
      item("unit", "0.1", "0.2", "Ha"),
      item("unit", "2.5", "101", "m²"),
    ];
    q.discount = "0";
    expect(calculate(q)).toMatchObject({
      lines: ["0", "253"],
      subtotal: "253",
      vat: "48",
      total: "301",
    });
  });
  it("rechaza exceso de descuento, cantidades vacías y fechas inexistentes", () => {
    expect(() => calculate({ ...example(), discount: "101" })).toThrow();
    expect(() =>
      calculate({ ...example(), discountType: "fixed", discount: "1280001" }),
    ).toThrow();
    const q = example();
    q.items[0].quantity = "";
    expect(quoteSchema.safeParse(q).success).toBe(false);
    expect(
      quoteSchema.safeParse({ ...example(), date: "2026-02-30" }).success,
    ).toBe(false);
  });
  it("calcula vencimiento cruzando mes y año", () => {
    expect(validUntil("2026-12-25", 15)).toBe("2027-01-09");
  });
});

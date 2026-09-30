"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  ListTree,
  Settings,
  Plus,
  ArrowLeft,
  X,
  ArrowUp,
  ArrowDown,
  Download,
  LogOut,
  Copy,
} from "lucide-react";
import {
  calculate,
  defaultCompany,
  kindLabels,
  modeLabels,
  money,
  dateLabel,
  today,
  isExpired,
  statusLabels,
  type ClientInput,
  type Company,
  type QuoteInput,
  type QuoteItem,
  type QuoteStatus,
  type ServiceInput,
  type Totals,
} from "@/lib/domain";
type Client = { id: string; data: ClientInput; archived: boolean };
type Service = { id: string; data: ServiceInput; archived: boolean };
type Revision = {
  number: number;
  state: "draft" | "issued";
  data: QuoteInput;
  totals: Totals;
  issuedAt: string | null;
};
type Quote = {
  id: string;
  folio: string | null;
  status: QuoteStatus;
  currentRevision: number;
  version: number;
  revisions: Revision[];
};
type Data = {
  clients: Client[];
  services: Service[];
  quotes: Quote[];
  company: Company;
};
type Page =
  | "quotes"
  | "editor"
  | "preview"
  | "detail"
  | "clients"
  | "services"
  | "settings";
const emptyClient: ClientInput = {
  name: "",
  type: "person",
  rut: "",
  contact: "",
  email: "",
  phone: "",
  address: "",
};
const emptyService: ServiceInput = {
  name: "",
  description: "",
  category: "Forestal",
  unit: "Unidad",
  mode: "unit",
  price: "0",
  kind: "service",
};
const copy = <T,>(value: T): T => structuredClone(value);
function createQuote(company: Company, client?: Client): QuoteInput {
  return {
    clientId: client?.id ?? "",
    client: copy(client?.data ?? emptyClient),
    company: copy(company),
    project: "",
    description: "",
    location: "",
    date: today(),
    validDays: company.validDays,
    duration: "5",
    dayType: "business",
    items: [],
    discountType: "percent",
    discount: "0",
    payment: company.payment,
    conditions: company.conditions,
    pdfDetail: "full",
  };
}
function createItem(service?: ServiceInput): QuoteItem {
  return {
    id: crypto.randomUUID(),
    name: service?.name ?? "",
    description: service?.description ?? "",
    category: service?.category ?? "Forestal",
    kind: service?.kind ?? "service",
    mode: service?.mode ?? "unit",
    quantity: "1",
    unit: service?.unit ?? "Unidad",
    price: service?.price ?? "0",
    duration: "1",
    useProjectDuration: false,
  };
}
const transitions: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
  issued: ["sent", "accepted", "rejected", "cancelled"],
  sent: ["accepted", "rejected", "cancelled"],
};
function Summary({
  totals,
  discountLabel = "Descuento",
}: {
  totals: Totals;
  discountLabel?: string;
}) {
  return (
    <>
      {[
        ["Subtotal neto", totals.subtotal],
        [discountLabel, "-" + totals.discount],
        ["Neto con descuento", totals.net],
        ["IVA (19%)", totals.vat],
        ["Total CLP", totals.total],
      ].map(([label, value], i) => (
        <div
          className={`total-row ${i === 4 ? "total-final" : ""}`}
          key={label}
        >
          <span>{label}</span>
          <strong>{money(value)}</strong>
        </div>
      ))}
    </>
  );
}
function Paper({
  data,
  totals,
  folio,
  number,
  draft,
}: {
  data: QuoteInput;
  totals: Totals;
  folio?: string | null;
  number: number;
  draft?: boolean;
}) {
  return (
    <section className="surface paper">
      <div className="doc-head">
        <Image
          src="/terra-logo.png"
          alt="Terra"
          width={110}
          height={122}
          unoptimized
        />
        <div>
          <h2>Cotización</h2>
          <p>
            {folio ?? "Sin folio"} / Rev. {number}
          </p>
          {draft && <span className="badge">Borrador · No emitida</span>}
        </div>
      </div>
      <div className="doc-parties">
        <div>
          <strong>{data.company.name}</strong>
          {data.company.rut && <p>RUT: {data.company.rut}</p>}
          <p>{data.company.phone}</p>
          <p>{data.company.email}</p>
          <p>{data.company.address}</p>
        </div>
        <div>
          <strong>{data.client.name}</strong>
          {data.client.rut && <p>RUT: {data.client.rut}</p>}
          <p>Emisión: {dateLabel(data.date)}</p>
          <p>Validez: {data.validDays} días corridos</p>
        </div>
      </div>
      <h2>{data.project}</h2>
      <p className="preserve">{data.description}</p>
      {data.location && <p>Lugar: {data.location}</p>}
      <p>
        Plazo estimado: {data.duration} días{" "}
        {data.dayType === "business" ? "hábiles" : "corridos"}.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Cant. / unidad</th>
              {data.pdfDetail === "full" && (
                <th className="right">Precio neto</th>
              )}
              <th className="right">Total neto</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <small className="preserve">{item.description}</small>
                  <small>
                    {item.category} · {modeLabels[item.mode]}
                    {item.mode === "resource"
                      ? ` · ${item.useProjectDuration ? data.duration : item.duration} días`
                      : ""}
                  </small>
                </td>
                <td>
                  {item.mode === "global"
                    ? "1 Global"
                    : `${item.quantity} ${item.unit}`}
                </td>
                {data.pdfDetail === "full" && (
                  <td className="right">
                    {money(item.price)}
                    {item.mode === "resource" && <small>/ recurso / día</small>}
                  </td>
                )}
                <td className="right">{money(totals.lines[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="doc-summary">
        <Summary
          totals={totals}
          discountLabel={`Descuento (${data.discountType === "percent" ? data.discount + "%" : "monto fijo"})`}
        />
      </div>
      <h2>Condiciones comerciales</h2>
      <p className="preserve">{data.payment}</p>
      <p className="preserve">{data.conditions}</p>
      <div className="signatures">
        <div>
          {data.company.name}
          <small>Prestador del servicio</small>
        </div>
        <div>
          {data.client.name}
          <small>Aceptación del cliente</small>
        </div>
      </div>
    </section>
  );
}

export function TerraApp({ initial, demo }: { initial: Data; demo: boolean }) {
  const router = useRouter();
  const [data, setData] = useState(initial),
    [page, setPage] = useState<Page>("quotes"),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<string | null>(null),
    [revisionNumber, setRevisionNumber] = useState<number | null>(null);
  const [draft, setDraft] = useState<QuoteInput>(() =>
      createQuote(initial.company),
    ),
    [editId, setEditId] = useState<string | undefined>(),
    [editVersion, setEditVersion] = useState<number | undefined>();
  const [clientForm, setClientForm] = useState<ClientInput | null>(null),
    [clientId, setClientId] = useState<string | undefined>(),
    [serviceForm, setServiceForm] = useState<ServiceInput | null>(null),
    [serviceId, setServiceId] = useState<string | undefined>();
  const [companyForm, setCompanyForm] = useState(copy(initial.company)),
    [statusDialog, setStatusDialog] = useState<QuoteStatus | null>(null),
    [statusNote, setStatusNote] = useState(""),
    [showArchived, setShowArchived] = useState(false),
    [catalogPick, setCatalogPick] = useState("");
  const [history, setHistory] = useState<
    {
      id: string;
      revision: number;
      action: string;
      note: string;
      createdAt: string;
    }[]
  >([]);
  const quote = data.quotes.find((q) => q.id === selected),
    revision = quote?.revisions.find(
      (r) => r.number === (revisionNumber ?? quote.currentRevision),
    );
  let draftTotals: Totals | null = null,
    calculationError = "";
  try {
    draftTotals = calculate(draft);
  } catch (e) {
    calculationError = e instanceof Error ? e.message : "Revisa los importes.";
  }
  const nav = (p: Page) => {
    setPage(p);
    setNotice("");
    setError("");
  };
  async function request(command: Record<string, unknown>) {
    const response = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error ?? "No fue posible completar la operación.");
    return result as { id?: string; version?: number };
  }
  async function refresh() {
    const r = await fetch("/api/data", { cache: "no-store" });
    const result = await r.json();
    if (!r.ok) throw new Error(result.error);
    setData(result);
    return result as Data;
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No fue posible completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  }
  function newQuote() {
    setEditId(undefined);
    setEditVersion(undefined);
    setSelected(null);
    setDraft(
      createQuote(
        data.company,
        data.clients.find((c) => !c.archived),
      ),
    );
    nav("editor");
  }
  function edit(q: Quote) {
    const r = q.revisions.find((r) => r.state === "draft");
    if (!r) return;
    setEditId(q.id);
    setEditVersion(q.version);
    setSelected(q.id);
    setDraft({
      ...copy(r.data),
      company: copy(data.company),
      client: copy(
        data.clients.find((c) => c.id === r.data.clientId)?.data ??
          r.data.client,
      ),
    });
    nav("editor");
  }
  async function open(q: Quote) {
    if (q.status === "draft") {
      edit(q);
      return;
    }
    setSelected(q.id);
    setRevisionNumber(q.currentRevision);
    nav("detail");
    await run(async () => {
      const r = await fetch(`/api/data?history=${q.id}`);
      if (r.ok) setHistory(await r.json());
    });
  }
  function patch<K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function itemPatch<K extends keyof QuoteItem>(
    id: string,
    key: K,
    value: QuoteItem[K],
  ) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, [key]: value } : i)),
    }));
  }
  async function save(preview = false) {
    await run(async () => {
      const result = await request({
        action: "save",
        id: editId,
        version: editVersion,
        data: draft,
      });
      setEditId(result.id);
      setEditVersion(result.version);
      setSelected(result.id ?? null);
      const latest = await refresh();
      const q = latest.quotes.find((q) => q.id === result.id),
        r = q?.revisions.find((r) => r.state === "draft");
      if (r) setDraft(copy(r.data));
      setPage(preview ? "preview" : "editor");
      setNotice("Borrador guardado.");
    });
  }
  function duplicate() {
    if (!revision) return;
    const c =
      data.clients.find(
        (c) => c.id === revision.data.clientId && !c.archived,
      ) ?? data.clients.find((c) => !c.archived);
    setDraft({
      ...copy(revision.data),
      clientId: c?.id ?? "",
      client: copy(c?.data ?? emptyClient),
      company: copy(data.company),
      date: today(),
      items: revision.data.items.map((i) => ({
        ...i,
        id: crypto.randomUUID(),
      })),
    });
    setEditId(undefined);
    setEditVersion(undefined);
    nav("editor");
    setNotice("Copia independiente. Tendrá un nuevo folio al emitir.");
  }
  async function issue() {
    if (!editId || !editVersion) return;
    await run(async () => {
      await request({ action: "issue", id: editId, version: editVersion });
      const latest = await refresh();
      const q = latest.quotes.find((q) => q.id === editId)!;
      setSelected(q.id);
      setRevisionNumber(q.currentRevision);
      setPage("detail");
      setNotice(
        "Cotización emitida. Esta revisión conserva sus datos originales.",
      );
      const h = await fetch(`/api/data?history=${q.id}`);
      if (h.ok) setHistory(await h.json());
    });
  }
  async function revise() {
    if (!quote) return;
    await run(async () => {
      await request({ action: "revise", id: quote.id, version: quote.version });
      const latest = await refresh();
      edit(latest.quotes.find((q) => q.id === quote.id)!);
      setNotice(
        "Nueva revisión en borrador. La versión emitida permanece intacta.",
      );
    });
  }
  function addService() {
    const s = data.services.find((s) => s.id === catalogPick);
    if (s) {
      setDraft((d) => ({ ...d, items: [...d.items, createItem(s.data)] }));
      setCatalogPick("");
    }
  }
  async function logout() {
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.ok) {
      router.push("/login");
      router.refresh();
    } else setError("No fue posible cerrar la sesión. Intenta de nuevo.");
  }
  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">
          TERRA<span>Servicios & Proyectos Integrales</span>
        </div>
        {demo && <span className="demo">Desarrollo local</span>}
        <span className="user">Nelson Escobar</span>
        {!demo && (
          <button
            className="icon-button"
            onClick={logout}
            aria-label="Cerrar sesión"
          >
            <LogOut size={17} />
          </button>
        )}
      </header>
      <div className="app-shell">
        <nav aria-label="Navegación principal">
          {(
            [
              { id: "quotes", label: "Cotizaciones", icon: FileText },
              { id: "clients", label: "Clientes", icon: Users },
              { id: "services", label: "Servicios", icon: ListTree },
              { id: "settings", label: "Configuración", icon: Settings },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              className={
                n.id === page ||
                (n.id === "quotes" &&
                  ["editor", "preview", "detail"].includes(page))
                  ? "active"
                  : ""
              }
              onClick={() => nav(n.id)}
            >
              <n.icon size={17} />
              {n.label}
            </button>
          ))}
          <div className="nav-note">
            {data.company.categories.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
        </nav>
        <main>
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          {page === "quotes" && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">GESTIÓN COMERCIAL</span>
                  <h1>Cotizaciones</h1>
                  <p>Prepara propuestas y registra la respuesta del cliente.</p>
                </div>
                <button className="primary" onClick={newQuote}>
                  <Plus size={17} />
                  Nueva cotización
                </button>
              </div>
              <div className="filters">
                <label>
                  Buscar
                  <input
                    placeholder="Folio, cliente o proyecto"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label>
                  Estado
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Todos</option>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                    <option value="expired">Vencidas</option>
                  </select>
                </label>
              </div>
              <div className="surface table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cotización / proyecto</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th className="right">Total CLP</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.quotes
                      .filter((q) => {
                        const r = q.revisions.find(
                          (r) => r.number === q.currentRevision,
                        )!;
                        return (
                          `${q.folio ?? ""} ${r.data.project} ${r.data.client.name}`
                            .toLowerCase()
                            .includes(search.toLowerCase()) &&
                          (filter === "all" ||
                            q.status === filter ||
                            (filter === "expired" &&
                              isExpired(
                                q.status,
                                r.data.date,
                                r.data.validDays,
                              )))
                        );
                      })
                      .map((q) => {
                        const r = q.revisions.find(
                          (r) => r.number === q.currentRevision,
                        )!;
                        return (
                          <tr key={q.id}>
                            <td>
                              <strong>{q.folio ?? "Sin folio"}</strong>
                              <small>{r.data.project}</small>
                              {q.folio &&
                                q.revisions.some(
                                  (r) => r.state === "draft",
                                ) && <small>Revisión en preparación</small>}
                            </td>
                            <td>{r.data.client.name}</td>
                            <td>
                              {r.data.date.split("-").reverse().join("-")}
                            </td>
                            <td>
                              <span className={`badge status-${q.status}`}>
                                {isExpired(
                                  q.status,
                                  r.data.date,
                                  r.data.validDays,
                                )
                                  ? "Vencida"
                                  : statusLabels[q.status]}
                              </span>
                            </td>
                            <td className="right">{money(r.totals.total)}</td>
                            <td>
                              <button onClick={() => open(q)} disabled={busy}>
                                Abrir
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {!data.quotes.length && (
                  <div className="empty">
                    <FileText size={30} />
                    <h2>Tu primera cotización</h2>
                    <p>
                      Agrega un cliente y prepara una propuesta para comenzar.
                    </p>
                  </div>
                )}
                <div className="table-footer">
                  Importes con IVA · Las revisiones emitidas conservan sus datos
                  originales.
                </div>
              </div>
            </>
          )}
          {page === "editor" && (
            <>
              <button className="back" onClick={() => nav("quotes")}>
                <ArrowLeft size={16} />
                Cotizaciones
              </button>
              <div className="heading">
                <div>
                  <span className="eyebrow">
                    {data.quotes.find((q) => q.id === editId)?.folio ??
                      "BORRADOR"}
                  </span>
                  <h1>{editId ? "Editar borrador" : "Nueva cotización"}</h1>
                </div>
                <div className="actions">
                  <button disabled={busy} onClick={() => save()}>
                    {busy ? "Guardando…" : "Guardar borrador"}
                  </button>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => save(true)}
                  >
                    Vista previa
                  </button>
                </div>
              </div>
              {!data.clients.some((c) => !c.archived) && (
                <div className="notice">
                  Primero registra un cliente en la sección Clientes.
                </div>
              )}
              <div className="surface fields">
                <label>
                  Cliente
                  <select
                    value={draft.clientId}
                    onChange={(e) => {
                      const c = data.clients.find(
                        (c) => c.id === e.target.value,
                      );
                      if (c) {
                        patch("clientId", c.id);
                        patch("client", c.data);
                      }
                    }}
                  >
                    <option value="">Selecciona un cliente</option>
                    {data.clients
                      .filter((c) => !c.archived)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.data.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Nombre del proyecto
                  <input
                    value={draft.project}
                    onChange={(e) => patch("project", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Fecha de emisión
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) => patch("date", e.target.value)}
                  />
                </label>
                <label>
                  Vigencia (días corridos)
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={draft.validDays}
                    onChange={(e) => patch("validDays", Number(e.target.value))}
                  />
                </label>
                <label>
                  Duración estimada
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft.duration}
                    onChange={(e) => patch("duration", e.target.value)}
                  />
                </label>
                <label>
                  Tipo de días
                  <select
                    value={draft.dayType}
                    onChange={(e) =>
                      patch("dayType", e.target.value as QuoteInput["dayType"])
                    }
                  >
                    <option value="business">Días hábiles</option>
                    <option value="calendar">Días corridos</option>
                  </select>
                </label>
                <label className="span-all">
                  Lugar del trabajo
                  <input
                    value={draft.location}
                    onChange={(e) => patch("location", e.target.value)}
                    placeholder="Dirección o referencia"
                  />
                </label>
                <label className="span-all">
                  Descripción del requerimiento
                  <textarea
                    rows={3}
                    value={draft.description}
                    onChange={(e) => patch("description", e.target.value)}
                  />
                </label>
              </div>
              <div className="section-heading">
                <h2>Servicios y costos</h2>
                <button
                  onClick={() => patch("items", [...draft.items, createItem()])}
                >
                  <Plus size={16} />
                  Ítem libre
                </button>
              </div>
              <div className="catalog-picker">
                <label>
                  Agregar desde el catálogo
                  <select
                    value={catalogPick}
                    onChange={(e) => setCatalogPick(e.target.value)}
                  >
                    <option value="">Selecciona un servicio</option>
                    {data.services
                      .filter((s) => !s.archived)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.data.name} · {money(s.data.price)}
                        </option>
                      ))}
                  </select>
                </label>
                <button onClick={addService} disabled={!catalogPick}>
                  Agregar
                </button>
              </div>
              {draft.items.map((item, index) => (
                <section className="surface item" key={item.id}>
                  <div className="item-top">
                    <label>
                      Descripción del servicio
                      <input
                        value={item.name}
                        onChange={(e) =>
                          itemPatch(item.id, "name", e.target.value)
                        }
                      />
                    </label>
                    <div className="actions">
                      <button
                        className="icon-button"
                        aria-label={`Subir ítem ${index + 1}`}
                        disabled={index === 0}
                        onClick={() => {
                          const items = [...draft.items];
                          [items[index - 1], items[index]] = [
                            items[index],
                            items[index - 1],
                          ];
                          patch("items", items);
                        }}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Bajar ítem ${index + 1}`}
                        disabled={index === draft.items.length - 1}
                        onClick={() => {
                          const items = [...draft.items];
                          [items[index + 1], items[index]] = [
                            items[index],
                            items[index + 1],
                          ];
                          patch("items", items);
                        }}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Eliminar ítem ${index + 1}`}
                        onClick={() =>
                          patch(
                            "items",
                            draft.items.filter((i) => i.id !== item.id),
                          )
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="item-grid">
                    <label>
                      Modalidad
                      <select
                        value={item.mode}
                        onChange={(e) =>
                          itemPatch(
                            item.id,
                            "mode",
                            e.target.value as QuoteItem["mode"],
                          )
                        }
                      >
                        {Object.entries(modeLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {item.mode === "time" ? "Duración" : "Cantidad"}
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={item.quantity}
                        disabled={item.mode === "global"}
                        onChange={(e) =>
                          itemPatch(item.id, "quantity", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {item.mode === "resource" ? "Recurso" : "Unidad"}
                      <input
                        list="terra-units"
                        value={item.unit}
                        disabled={item.mode === "global"}
                        onChange={(e) =>
                          itemPatch(item.id, "unit", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {item.mode === "global"
                        ? "Monto neto"
                        : item.mode === "resource"
                          ? "Precio por recurso/día"
                          : "Precio neto"}
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={item.price}
                        onChange={(e) =>
                          itemPatch(item.id, "price", e.target.value)
                        }
                      />
                    </label>
                    {item.mode === "resource" && (
                      <label>
                        Días
                        <input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={
                            item.useProjectDuration
                              ? draft.duration
                              : item.duration
                          }
                          disabled={item.useProjectDuration}
                          onChange={(e) =>
                            itemPatch(item.id, "duration", e.target.value)
                          }
                        />
                      </label>
                    )}
                  </div>
                  <div className="item-meta">
                    <label>
                      Categoría
                      <input
                        list="terra-categories"
                        value={item.category}
                        onChange={(e) =>
                          itemPatch(item.id, "category", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Tipo de costo
                      <select
                        value={item.kind}
                        onChange={(e) =>
                          itemPatch(
                            item.id,
                            "kind",
                            e.target.value as QuoteItem["kind"],
                          )
                        }
                      >
                        {Object.entries(kindLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Detalle adicional
                      <input
                        value={item.description}
                        onChange={(e) =>
                          itemPatch(item.id, "description", e.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="item-total">
                    {item.mode === "resource" ? (
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={item.useProjectDuration}
                          onChange={(e) =>
                            itemPatch(
                              item.id,
                              "useProjectDuration",
                              e.target.checked,
                            )
                          }
                        />
                        Usar duración del proyecto
                      </label>
                    ) : (
                      <span>
                        {item.mode === "global"
                          ? "Importe fijo"
                          : item.mode === "time"
                            ? "Duración × tarifa"
                            : "Cantidad × precio"}
                      </span>
                    )}
                    <strong>
                      {draftTotals
                        ? money(draftTotals.lines[index])
                        : "Revisa los valores"}
                    </strong>
                  </div>
                </section>
              ))}
              <datalist id="terra-units">
                {data.company.units.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              <datalist id="terra-categories">
                {data.company.categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="editor-bottom">
                <section className="surface conditions">
                  <h2>Condiciones y presentación</h2>
                  <label>
                    Forma de pago
                    <textarea
                      value={draft.payment}
                      onChange={(e) => patch("payment", e.target.value)}
                      rows={2}
                    />
                  </label>
                  <label>
                    Otras condiciones
                    <textarea
                      value={draft.conditions}
                      onChange={(e) => patch("conditions", e.target.value)}
                      rows={4}
                    />
                  </label>
                  <label>
                    Detalle del PDF
                    <select
                      value={draft.pdfDetail}
                      onChange={(e) =>
                        patch(
                          "pdfDetail",
                          e.target.value as QuoteInput["pdfDetail"],
                        )
                      }
                    >
                      <option value="full">
                        Completo · Mostrar precios unitarios
                      </option>
                      <option value="summary">
                        Resumido · Mostrar importes por servicio
                      </option>
                    </select>
                  </label>
                </section>
                <section className="surface summary">
                  <h2>Resumen</h2>
                  <div className="discount">
                    <label>
                      Descuento
                      <select
                        value={draft.discountType}
                        onChange={(e) =>
                          patch(
                            "discountType",
                            e.target.value as QuoteInput["discountType"],
                          )
                        }
                      >
                        <option value="percent">Porcentaje (%)</option>
                        <option value="fixed">Monto (CLP)</option>
                      </select>
                    </label>
                    <label>
                      Valor
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={draft.discount}
                        onChange={(e) => patch("discount", e.target.value)}
                      />
                    </label>
                  </div>
                  <div aria-live="polite">
                    {draftTotals ? (
                      <Summary totals={draftTotals} />
                    ) : (
                      <p className="text-error">{calculationError}</p>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "preview" && draftTotals && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">REVISIÓN DEL DOCUMENTO</span>
                  <h1>Vista previa</h1>
                </div>
                <div className="actions">
                  <button onClick={() => nav("editor")} disabled={busy}>
                    Volver a editar
                  </button>
                  {editId && (
                    <a
                      className="button"
                      href={`/api/quotes/${editId}/pdf?revision=${data.quotes.find((q) => q.id === editId)?.revisions.find((r) => r.state === "draft")?.number ?? 1}`}
                    >
                      <Download size={16} />
                      PDF borrador
                    </a>
                  )}
                  <button className="primary" disabled={busy} onClick={issue}>
                    {busy ? "Emitiendo…" : "Emitir cotización"}
                  </button>
                </div>
              </div>
              <p className="before-paper">
                Al emitir se asignará el folio y esta revisión quedará protegida
                frente a cambios posteriores.
              </p>
              <Paper
                data={draft}
                totals={draftTotals}
                folio={data.quotes.find((q) => q.id === editId)?.folio}
                number={
                  data.quotes
                    .find((q) => q.id === editId)
                    ?.revisions.find((r) => r.state === "draft")?.number ?? 1
                }
                draft
              />
            </>
          )}
          {page === "detail" && quote && revision && (
            <>
              <button className="back" onClick={() => nav("quotes")}>
                <ArrowLeft size={16} />
                Cotizaciones
              </button>
              <div className="heading">
                <div>
                  <span className="eyebrow">
                    {quote.folio} / REV. {revision.number}
                  </span>
                  <h1>{revision.data.project}</h1>
                  <span className={`badge status-${quote.status}`}>
                    {isExpired(
                      quote.status,
                      revision.data.date,
                      revision.data.validDays,
                    )
                      ? "Vencida"
                      : statusLabels[quote.status]}
                  </span>
                </div>
                <div className="actions">
                  <a
                    className="button primary"
                    href={`/api/quotes/${quote.id}/pdf?revision=${revision.number}`}
                  >
                    <Download size={16} />
                    Descargar PDF
                  </a>
                  <button onClick={duplicate}>
                    <Copy size={16} />
                    Duplicar
                  </button>
                  {quote.revisions.some((r) => r.state === "draft") ? (
                    <button onClick={() => edit(quote)}>
                      Editar revisión pendiente
                    </button>
                  ) : (
                    <button disabled={busy} onClick={revise}>
                      Crear revisión
                    </button>
                  )}
                </div>
              </div>
              <div className="detail-toolbar">
                <label>
                  Revisión
                  <select
                    value={revision.number}
                    onChange={(e) => setRevisionNumber(Number(e.target.value))}
                  >
                    {quote.revisions
                      .filter((r) => r.state === "issued")
                      .map((r) => (
                        <option key={r.number} value={r.number}>
                          Rev. {r.number}
                          {r.number === quote.currentRevision
                            ? " · Actual"
                            : " · Histórica"}
                        </option>
                      ))}
                  </select>
                </label>
                {revision.number === quote.currentRevision && (
                  <div className="actions">
                    {transitions[quote.status]?.map((s) => (
                      <button
                        key={s}
                        className={s === "accepted" ? "primary" : ""}
                        disabled={busy}
                        onClick={() => {
                          setStatusDialog(s);
                          setStatusNote("");
                        }}
                      >
                        {s === "sent" ? "Marcar enviada" : statusLabels[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {revision.number !== quote.currentRevision && (
                <div className="notice">
                  Revisión histórica. El estado mostrado corresponde a la
                  revisión actual.
                </div>
              )}
              <Paper
                data={revision.data}
                totals={revision.totals}
                folio={quote.folio}
                number={revision.number}
              />
              <section className="surface history">
                <h2>Historial</h2>
                {history.map((h) => (
                  <div className="history-row" key={h.id}>
                    <strong>
                      {statusLabels[h.action as QuoteStatus] ?? h.action} · Rev.{" "}
                      {h.revision}
                    </strong>
                    <small>
                      {new Intl.DateTimeFormat("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Santiago",
                      }).format(new Date(h.createdAt))}
                    </small>
                    {h.note && <p>{h.note}</p>}
                  </div>
                ))}
              </section>
            </>
          )}
          {page === "clients" && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">CONTACTOS</span>
                  <h1>Clientes</h1>
                  <p>Personas y empresas a las que cotizas.</p>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    setClientForm(copy(emptyClient));
                    setClientId(undefined);
                  }}
                >
                  <Plus size={17} />
                  Nuevo cliente
                </button>
              </div>
              {clientForm && (
                <form
                  className="surface fields"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      await request({
                        action: "client",
                        id: clientId,
                        data: clientForm,
                      });
                      await refresh();
                      setClientForm(null);
                      setNotice("Cliente guardado.");
                    });
                  }}
                >
                  <label>
                    Nombre / razón social
                    <input
                      value={clientForm.name}
                      required
                      onChange={(e) =>
                        setClientForm({ ...clientForm, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Tipo
                    <select
                      value={clientForm.type}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          type: e.target.value as ClientInput["type"],
                        })
                      }
                    >
                      <option value="person">Persona</option>
                      <option value="company">Empresa</option>
                    </select>
                  </label>
                  {(
                    [
                      ["rut", "RUT"],
                      ["contact", "Contacto"],
                      ["email", "Correo"],
                      ["phone", "Teléfono"],
                      ["address", "Dirección"],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k}>
                      {label}
                      <input
                        type={k === "email" ? "email" : "text"}
                        value={clientForm[k]}
                        onChange={(e) =>
                          setClientForm({ ...clientForm, [k]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                  <div className="actions span-all">
                    <button className="primary" disabled={busy}>
                      Guardar cliente
                    </button>
                    <button type="button" onClick={() => setClientForm(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
              <label className="checkbox archive-toggle">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Mostrar archivados
              </label>
              <div className="surface table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo / teléfono</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients
                      .filter((c) => showArchived || !c.archived)
                      .map((c) => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.data.name}</strong>
                            <small>
                              {c.archived ? "Archivado" : c.data.rut}
                            </small>
                          </td>
                          <td>
                            {c.data.email}
                            <small>{c.data.phone}</small>
                          </td>
                          <td>
                            <div className="actions">
                              <button
                                disabled={busy}
                                onClick={() => {
                                  setClientId(c.id);
                                  setClientForm(copy(c.data));
                                }}
                              >
                                Editar
                              </button>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  run(async () => {
                                    await request({
                                      action: "client",
                                      id: c.id,
                                      data: c.data,
                                      archived: !c.archived,
                                    });
                                    await refresh();
                                  })
                                }
                              >
                                {c.archived ? "Restaurar" : "Archivar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!data.clients.length && (
                  <div className="empty">Registra tu primer cliente.</div>
                )}
              </div>
            </>
          )}
          {page === "services" && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">CATÁLOGO REUTILIZABLE</span>
                  <h1>Servicios</h1>
                  <p>Precios sugeridos, editables en cada cotización.</p>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    setServiceForm({
                      ...emptyService,
                      category: data.company.categories[0],
                      unit: data.company.units[0],
                    });
                    setServiceId(undefined);
                  }}
                >
                  <Plus size={17} />
                  Nuevo servicio
                </button>
              </div>
              {serviceForm && (
                <form
                  className="surface fields"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      await request({
                        action: "service",
                        id: serviceId,
                        data: serviceForm,
                      });
                      await refresh();
                      setServiceForm(null);
                      setNotice("Servicio guardado.");
                    });
                  }}
                >
                  <label>
                    Servicio
                    <input
                      required
                      value={serviceForm.name}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Categoría
                    <select
                      value={serviceForm.category}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          category: e.target.value,
                        })
                      }
                    >
                      {Array.from(
                        new Set([
                          ...data.company.categories,
                          serviceForm.category,
                        ]),
                      ).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Modalidad
                    <select
                      value={serviceForm.mode}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          mode: e.target.value as ServiceInput["mode"],
                        })
                      }
                    >
                      {Object.entries(modeLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Unidad
                    <input
                      required
                      value={serviceForm.unit}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, unit: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Precio neto sugerido
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.0001"
                      value={serviceForm.price}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          price: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Tipo de costo
                    <select
                      value={serviceForm.kind}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          kind: e.target.value as ServiceInput["kind"],
                        })
                      }
                    >
                      {Object.entries(kindLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="span-all">
                    Detalle
                    <textarea
                      rows={2}
                      value={serviceForm.description}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="actions span-all">
                    <button className="primary" disabled={busy}>
                      Guardar servicio
                    </button>
                    <button type="button" onClick={() => setServiceForm(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
              <label className="checkbox archive-toggle">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Mostrar archivados
              </label>
              <div className="surface table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Categoría</th>
                      <th>Modalidad</th>
                      <th className="right">Precio neto</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.services
                      .filter((s) => showArchived || !s.archived)
                      .map((s) => (
                        <tr key={s.id}>
                          <td>
                            <strong>{s.data.name}</strong>
                            <small>
                              {s.archived ? "Archivado" : s.data.unit}
                            </small>
                          </td>
                          <td>{s.data.category}</td>
                          <td>{modeLabels[s.data.mode]}</td>
                          <td className="right">{money(s.data.price)}</td>
                          <td>
                            <div className="actions">
                              <button
                                onClick={() => {
                                  setServiceId(s.id);
                                  setServiceForm(copy(s.data));
                                }}
                              >
                                Editar
                              </button>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  run(async () => {
                                    await request({
                                      action: "service",
                                      id: s.id,
                                      data: s.data,
                                      archived: !s.archived,
                                    });
                                    await refresh();
                                  })
                                }
                              >
                                {s.archived ? "Restaurar" : "Archivar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!data.services.length && (
                  <div className="empty">
                    Agrega servicios o usa ítems libres al cotizar.
                  </div>
                )}
              </div>
            </>
          )}
          {page === "settings" && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">DATOS DE TERRA</span>
                  <h1>Configuración</h1>
                  <p>Los cambios se aplican a las próximas cotizaciones.</p>
                </div>
              </div>
              <form
                className="surface fields"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await request({ action: "settings", data: companyForm });
                    await refresh();
                    setNotice("Configuración guardada.");
                  });
                }}
              >
                {(
                  [
                    ["brand", "Marca comercial"],
                    ["name", "Prestador"],
                    ["rut", "RUT"],
                    ["phone", "Teléfono"],
                    ["email", "Correo"],
                    ["address", "Dirección"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k}>
                    {label}
                    <input
                      required={["brand", "name", "email"].includes(k)}
                      type={k === "email" ? "email" : "text"}
                      value={companyForm[k]}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, [k]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <label>
                  Vigencia por defecto (días)
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={companyForm.validDays}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        validDays: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  IVA
                  <input value="19% · Todas las cotizaciones" disabled />
                </label>
                <label className="span-all">
                  Forma de pago por defecto
                  <textarea
                    rows={2}
                    value={companyForm.payment}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        payment: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="span-all">
                  Otras condiciones por defecto
                  <textarea
                    rows={4}
                    value={companyForm.conditions}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        conditions: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Categorías (una por línea)
                  <textarea
                    rows={5}
                    value={companyForm.categories.join("\n")}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        categories: e.target.value.split("\n"),
                      })
                    }
                  />
                </label>
                <label>
                  Unidades (una por línea)
                  <textarea
                    rows={5}
                    value={companyForm.units.join("\n")}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        units: e.target.value.split("\n"),
                      })
                    }
                  />
                </label>
                <div className="actions span-all">
                  <button className="primary" disabled={busy}>
                    Guardar configuración
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCompanyForm(copy(data.company ?? defaultCompany))
                    }
                  >
                    Restaurar valores guardados
                  </button>
                </div>
              </form>
            </>
          )}
        </main>
      </div>
      {statusDialog && quote && (
        <div className="modal-backdrop">
          <section
            className="surface modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-title"
          >
            <h2 id="status-title">Registrar: {statusLabels[statusDialog]}</h2>
            <p>
              {quote.folio} · Se guardará la fecha y el cambio en el historial.
            </p>
            <label>
              Nota o motivo (opcional)
              <textarea
                rows={3}
                maxLength={2000}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </label>
            <div className="actions">
              <button onClick={() => setStatusDialog(null)} disabled={busy}>
                Cancelar
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await request({
                      action: "status",
                      id: quote.id,
                      version: quote.version,
                      status: statusDialog,
                      note: statusNote,
                    });
                    await refresh();
                    const h = await fetch(`/api/data?history=${quote.id}`);
                    if (h.ok) setHistory(await h.json());
                    setStatusDialog(null);
                    setNotice("Estado registrado.");
                  })
                }
              >
                {busy ? "Guardando…" : "Confirmar estado"}
              </button>
            </div>
            {error && (
              <p className="text-error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

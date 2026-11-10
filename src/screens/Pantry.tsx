import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Clock, Package, Plus, Search, TriangleAlert, X } from "lucide-react";
import { db } from "../lib/db";
import { LOCATIONS, type FoodItem, type Location } from "../lib/types";
import { today } from "../lib/dates";
import { normalize } from "../lib/normalize";
import { ItemRow } from "../components/ItemRow";
import { EmptyState, LocationIcon } from "../components/icons";
import { daysLeft, effectiveDate, itemStatus } from "../lib/freshness";

type Filter = "todos" | Location | "vencendo" | "vencidos";
type Sort = "validade" | "nome" | "compra";

const HINT_KEY = "despensa:swipeHintSeen";

/** Urgency buckets, most urgent first. */
const GROUPS: { key: string; title: string; test: (days: number | null) => boolean }[] = [
  { key: "vencido", title: "Vencidos", test: () => false },
  { key: "passou", title: "Passou da data — confira", test: () => false },
  { key: "hoje", title: "Vence hoje", test: (d) => d === 0 },
  { key: "semana", title: "Nos próximos 7 dias", test: (d) => d != null && d >= 1 && d <= 7 },
  { key: "mes", title: "Neste mês", test: (d) => d != null && d >= 8 && d <= 30 },
  { key: "depois", title: "Mais para frente", test: (d) => d != null && d > 30 },
  { key: "sem", title: "Sem validade", test: (d) => d == null },
];

export function Pantry({ initialFilter, openItem, onAdd }: { initialFilter?: string; openItem: (i: FoodItem) => void; onAdd: () => void }) {
  const [filter, setFilter] = useState<Filter>((initialFilter as Filter) || "todos");
  const [sort, setSort] = useState<Sort>("validade");
  const [q, setQ] = useState("");
  const [hint, setHint] = useState(() => {
    try { return !localStorage.getItem(HINT_KEY); } catch { return false; }
  });
  const items = useLiveQuery(() => db.items.toArray(), []);
  const ref = today();

  if (!items) return null;

  const nq = normalize(q);
  const shown = items
    .filter((i) => {
      if (nq && !normalize(i.name).includes(nq)) return false;
      if (filter === "todos") return true;
      if (filter === "vencidos") return itemStatus(i, ref) === "vencido";
      if (filter === "vencendo") { const d = daysLeft(i, ref); return d != null && d >= 0 && d <= 7; }
      return i.location === filter;
    })
    .sort((a, b) => {
      if (sort === "nome") return a.name.localeCompare(b.name);
      if (sort === "compra") return b.purchaseDate.localeCompare(a.purchaseDate);
      return (effectiveDate(a) || "9999").localeCompare(effectiveDate(b) || "9999");
    });

  const groups = GROUPS.map((g) => ({
    ...g,
    items: shown.filter((i) => {
      const st = itemStatus(i, ref);
      if (st === "vencido" || st === "passou") return g.key === st;
      return g.key !== "vencido" && g.key !== "passou" && g.test(daysLeft(i, ref));
    }),
  })).filter((g) => g.items.length > 0);

  const dismissHint = () => {
    setHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ }
  };

  return (
    <>
      <header className="page-header">
        <h1>Despensa</h1>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={{ width: "auto", minHeight: 38, borderRadius: 99, fontWeight: 600, fontSize: "0.88rem" }} aria-label="Ordenar">
          <option value="validade">Por validade</option>
          <option value="nome">Por nome</option>
          <option value="compra">Mais recentes</option>
        </select>
      </header>
      <div className="page stack">
        <div className="search">
          <Search size={18} />
          <input type="search" placeholder="Buscar item…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips">
          <button className={`chip ${filter === "todos" ? "active" : ""}`} onClick={() => setFilter("todos")}>Tudo ({items.length})</button>
          <button className={`chip ${filter === "vencendo" ? "active" : ""}`} onClick={() => setFilter("vencendo")}><Clock size={14} />Vencendo</button>
          <button className={`chip ${filter === "vencidos" ? "active" : ""}`} onClick={() => setFilter("vencidos")}><TriangleAlert size={14} />Vencidos</button>
          {LOCATIONS.map((l) => (
            <button key={l.value} className={`chip ${filter === l.value ? "active" : ""}`} onClick={() => setFilter(l.value)}>
              <LocationIcon location={l.value} />{l.label}
            </button>
          ))}
        </div>

        {hint && shown.length > 0 && (
          <div className="hint">
            <span style={{ flex: 1 }}>Dica: deslize um item para a <b>direita</b> quando usar, ou para a <b>esquerda</b> se jogou fora.</span>
            <button className="icon-btn" onClick={dismissHint} aria-label="Fechar dica"><X size={18} /></button>
          </div>
        )}

        {shown.length === 0 ? (
          <EmptyState icon={Package}>
            <p>{items.length === 0 ? "Nada cadastrado ainda." : "Nenhum item neste filtro."}</p>
            {items.length === 0 && <button className="btn primary" onClick={onAdd}><Plus size={18} />Adicionar comida</button>}
          </EmptyState>
        ) : sort === "validade" ? (
          groups.map((g) => (
            <section key={g.key}>
              <div className="section-head" style={{ marginTop: 14 }}><h2>{g.title}</h2><span className="count-pill">{g.items.length}</span></div>
              <div className="list">{g.items.map((i) => <ItemRow key={i.id} item={i} swipe onClick={() => openItem(i)} />)}</div>
            </section>
          ))
        ) : (
          <div className="list">{shown.map((i) => <ItemRow key={i.id} item={i} swipe onClick={() => openItem(i)} />)}</div>
        )}
      </div>
    </>
  );
}

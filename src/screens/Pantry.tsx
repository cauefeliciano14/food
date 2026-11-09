import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { LOCATIONS, type FoodItem, type Location } from "../lib/types";
import { daysBetween, expiryStatus, today } from "../lib/dates";
import { normalize } from "../lib/normalize";
import { ItemRow } from "../components/ItemRow";

type Filter = "todos" | Location | "vencendo" | "vencidos";
type Sort = "validade" | "nome" | "compra";

export function Pantry({ initialFilter, openItem, onAdd }: { initialFilter?: string; openItem: (i: FoodItem) => void; onAdd: () => void }) {
  const [filter, setFilter] = useState<Filter>((initialFilter as Filter) || "todos");
  const [sort, setSort] = useState<Sort>("validade");
  const [q, setQ] = useState("");
  const items = useLiveQuery(() => db.items.toArray(), []);
  const ref = today();

  if (!items) return null;

  const nq = normalize(q);
  const shown = items
    .filter((i) => {
      if (nq && !normalize(i.name).includes(nq)) return false;
      if (filter === "todos") return true;
      if (filter === "vencidos") return expiryStatus(i.expiryDate, ref) === "vencido";
      if (filter === "vencendo") return !!i.expiryDate && daysBetween(ref, i.expiryDate) >= 0 && daysBetween(ref, i.expiryDate) <= 7;
      return i.location === filter;
    })
    .sort((a, b) => {
      if (sort === "nome") return a.name.localeCompare(b.name);
      if (sort === "compra") return b.purchaseDate.localeCompare(a.purchaseDate);
      return (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999");
    });

  const filters: { v: Filter; label: string }[] = [
    { v: "todos", label: `Tudo (${items.length})` },
    { v: "vencendo", label: "⏰ Vencendo" },
    { v: "vencidos", label: "⚠️ Vencidos" },
    ...LOCATIONS.map((l) => ({ v: l.value as Filter, label: `${l.icon} ${l.label}` })),
  ];

  return (
    <>
      <header className="page-header">
        <h1>Minha despensa</h1>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={{ width: "auto", minHeight: 36 }} aria-label="Ordenar">
          <option value="validade">Por validade</option>
          <option value="nome">Por nome</option>
          <option value="compra">Mais recentes</option>
        </select>
      </header>
      <div className="page stack">
        <input type="search" placeholder="Buscar item…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          {filters.map((f) => (
            <button key={f.v} className={`chip ${filter === f.v ? "active" : ""}`} onClick={() => setFilter(f.v)}>{f.label}</button>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="empty">
            <div className="big">🫙</div>
            <p>{items.length === 0 ? "Nada cadastrado ainda." : "Nenhum item neste filtro."}</p>
            {items.length === 0 && <button className="btn primary" onClick={onAdd}>Adicionar comida</button>}
          </div>
        ) : (
          <div className="list">{shown.map((i) => <ItemRow key={i.id} item={i} onClick={() => openItem(i)} />)}</div>
        )}
      </div>
    </>
  );
}

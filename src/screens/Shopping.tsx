import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { addToShopping, finishedSuggestions, guessCategory, pantryHas, shoppingListText } from "../lib/shopping";
import { defaultLocation, suggestShelfLifeDays } from "../lib/shelfLife";
import { addDays, today } from "../lib/dates";
import { CATEGORIES, LOCATIONS, UNITS, type Category, type Location, type ShoppingItem } from "../lib/types";
import { fmtQty } from "../components/ItemRow";
import { shareText } from "../lib/native";
import { Archive, Check, Plus, Share2, ShoppingCart, X } from "lucide-react";
import { EmptyState } from "../components/icons";

interface StoreDraft {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: Category;
  location: Location;
  expiryDate: string;
}

function draftFor(s: ShoppingItem): StoreDraft {
  const category = guessCategory(s.name);
  const location = defaultLocation(category, s.name);
  const qty = Number((s.amount ?? "").replace(",", ".").match(/^\d+(\.\d+)?/)?.[0]) || 1;
  return {
    id: s.id!, name: s.name, quantity: qty, unit: "un", category, location,
    expiryDate: addDays(today(), suggestShelfLifeDays(s.name, category, location)),
  };
}

export function Shopping() {
  const list = useLiveQuery(() => db.shopping.orderBy("createdAt").toArray(), []) ?? [];
  const pantry = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const history = useLiveQuery(() => db.history.toArray(), []) ?? [];
  const [text, setText] = useState("");
  const [storing, setStoring] = useState<StoreDraft[] | null>(null);
  const [toast, setToast] = useState("");

  const open = list.filter((i) => !i.done);
  const done = list.filter((i) => i.done);
  const suggestions = useMemo(() => finishedSuggestions(history, pantry, list), [history, pantry, list]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    // Allow "leite, ovos, pão" in one go.
    for (const part of text.split(/[,;\n]/)) await addToShopping(part);
    setText("");
  }

  async function share() {
    if ((await shareText(shoppingListText(list))) === "copied") flash("Lista copiada");
  }

  async function store() {
    if (!storing) return;
    const now = Date.now();
    await db.transaction("rw", db.items, db.shopping, async () => {
      await db.items.bulkAdd(storing.map((d) => ({
        name: d.name, quantity: d.quantity, unit: d.unit, category: d.category, location: d.location,
        purchaseDate: today(), expiryDate: d.expiryDate, createdAt: now,
      })));
      await db.shopping.bulkDelete(storing.map((d) => d.id));
    });
    flash(`${storing.length} item(ns) guardado(s) na despensa`);
    setStoring(null);
  }

  if (storing) {
    const upd = (i: number, patch: Partial<StoreDraft>) => setStoring((ds) => ds!.map((d, j) => {
      if (j !== i) return d;
      const next = { ...d, ...patch };
      if (patch.category || patch.location) next.expiryDate = addDays(today(), suggestShelfLifeDays(next.name, next.category, next.location));
      return next;
    }));
    return (
      <>
        <header className="page-header"><h1>Guardar compras</h1></header>
        <div className="page stack">
          <p className="small muted" style={{ margin: 0 }}>Confira quantidade, onde vai ficar e a validade (sugerida). Se a embalagem tiver data, ajuste.</p>
          <div className="list">
            {storing.map((d, i) => (
              <div key={d.id} className="card stack">
                <input type="text" value={d.name} onChange={(e) => upd(i, { name: e.target.value })} />
                <div className="grid-3">
                  <input type="number" inputMode="decimal" step="any" min="0" value={d.quantity} aria-label="Quantidade" onChange={(e) => upd(i, { quantity: Number(e.target.value) || 0 })} />
                  <select value={d.unit} aria-label="Unidade" onChange={(e) => upd(i, { unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
                  <select value={d.location} aria-label="Local" onChange={(e) => upd(i, { location: e.target.value as Location })}>
                    {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <select value={d.category} aria-label="Categoria" onChange={(e) => upd(i, { category: e.target.value as Category })}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input type="date" value={d.expiryDate} aria-label="Validade" onChange={(e) => upd(i, { expiryDate: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
          <button className="btn primary block" onClick={store}>Guardar {storing.length} na despensa</button>
          <button className="btn ghost block" onClick={() => setStoring(null)}>Voltar</button>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <h1>Compras</h1>
        {open.length > 0 && <button className="btn sm" onClick={share}><Share2 size={16} />Enviar</button>}
      </header>
      <div className="page stack">
        <form className="row" onSubmit={add}>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Adicionar (ex.: leite, ovos, pão)" aria-label="Novo item" />
          <button className="btn primary" type="submit" disabled={!text.trim()} aria-label="Adicionar à lista"><Plus size={20} /></button>
        </form>

        {toast && <div className="notice small">{toast}</div>}

        {suggestions.length > 0 && (
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>Acabou recentemente — comprar de novo?</div>
            <div className="chips">
              {suggestions.map((s) => (
                <button key={s.name} className="chip" onClick={() => addToShopping(s.name, { source: "acabou" })}>
                  <Plus size={14} />{s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {open.length === 0 && done.length === 0 ? (
          <EmptyState icon={ShoppingCart}>
            <p>Lista vazia. Adicione itens aqui ou, numa receita, toque em “Adicionar o que falta à lista”.</p>
          </EmptyState>
        ) : (
          <div className="list">
            {open.map((s) => <ShopRow key={s.id} item={s} have={pantryHas(s.name, pantry)} />)}
          </div>
        )}

        {done.length > 0 && (
          <>
            <div className="row" style={{ marginTop: 12 }}>
              <h2 style={{ margin: 0 }}>No carrinho ({done.length})</h2>
              <span className="spacer" />
              <button className="btn ghost sm" onClick={() => db.shopping.bulkDelete(done.map((d) => d.id!))}>Limpar</button>
            </div>
            <div className="list">
              {done.map((s) => <ShopRow key={s.id} item={s} have={[]} />)}
            </div>
            <button className="btn primary block" onClick={() => setStoring(done.map(draftFor))}>
              <Archive size={18} />Guardar comprados na despensa
            </button>
          </>
        )}
      </div>
    </>
  );
}

function ShopRow({ item, have }: { item: ShoppingItem; have: { name: string; quantity: number; unit: string }[] }) {
  const sub = [
    item.amount,
    item.recipes?.length ? `para ${item.recipes.join(", ")}` : item.source === "acabou" ? "acabou" : "",
  ].filter(Boolean).join(" · ");
  return (
    <div className={`item shop ${item.done ? "done" : ""}`}>
      <button className={`check ${item.done ? "on" : ""}`} role="checkbox" aria-checked={item.done} aria-label={`Marcar ${item.name}`}
        onClick={() => db.shopping.update(item.id!, { done: !item.done })}><Check size={16} strokeWidth={3} /></button>
      <div className="body">
        <div className="title">{item.name}</div>
        {sub && <div className="small muted">{sub}</div>}
        {have.length > 0 && (
          <div className="small" style={{ color: "var(--warn)" }}>
            Você já tem: {have.map((h) => `${h.name} (${fmtQty(h.quantity, h.unit)})`).join(", ")}
          </div>
        )}
      </div>
      <button className="icon-btn" aria-label="Remover" onClick={() => db.shopping.delete(item.id!)}><X size={18} /></button>
    </div>
  );
}

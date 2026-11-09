import { useState } from "react";
import type { Category, FoodItem, Location } from "../lib/types";
import { CATEGORIES, LOCATIONS, UNITS } from "../lib/types";
import { addDays, today } from "../lib/dates";
import { defaultLocation, suggestShelfLifeDays } from "../lib/shelfLife";
import { db } from "../lib/db";

export function ItemForm({ item, onDone }: { item?: FoodItem; onDone: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [unit, setUnit] = useState(item?.unit ?? "un");
  const [category, setCategory] = useState<Category>(item?.category ?? "outros");
  const [location, setLocation] = useState<Location>(item?.location ?? "despensa");
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate ?? today());
  const [expiryDate, setExpiryDate] = useState(item?.expiryDate ?? "");
  const [expiryTouched, setExpiryTouched] = useState(!!item);
  const [notes, setNotes] = useState(item?.notes ?? "");

  // While the user hasn't picked a date by hand, keep a suggested expiry in sync.
  function suggest(n = name, c = category, l = location, p = purchaseDate) {
    if (expiryTouched || !n.trim()) return;
    setExpiryDate(addDays(p || today(), suggestShelfLifeDays(n, c, l)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: name.trim(),
      quantity: Math.max(0, Number(quantity.replace(",", ".")) || 0),
      unit,
      category,
      location,
      purchaseDate,
      expiryDate,
      notes: notes.trim() || undefined,
    };
    if (!data.name) return;
    if (item?.id != null) await db.items.update(item.id, data);
    else await db.items.add({ ...data, createdAt: Date.now() });
    onDone();
  }

  async function remove() {
    if (item?.id == null) return;
    if (!confirm(`Excluir "${item.name}"?`)) return;
    await db.items.delete(item.id);
    onDone();
  }

  return (
    <form className="stack" onSubmit={save}>
      <label className="field">
        <span>Nome</span>
        <input type="text" value={name} autoFocus={!item} placeholder="Ex.: Peito de frango" required
          onChange={(e) => setName(e.target.value)} onBlur={() => suggest()} />
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Quantidade</span>
          <input type="number" inputMode="decimal" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="field">
          <span>Unidade</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <div className="grid-2">
        <label className="field">
          <span>Categoria</span>
          <select value={category} onChange={(e) => {
            const c = e.target.value as Category;
            setCategory(c);
            const l = item ? location : defaultLocation(c);
            setLocation(l);
            suggest(name, c, l);
          }}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Onde fica</span>
          <select value={location} onChange={(e) => {
            const l = e.target.value as Location;
            setLocation(l);
            suggest(name, category, l);
          }}>
            {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.icon} {l.label}</option>)}
          </select>
        </label>
      </div>
      <div className="grid-2">
        <label className="field">
          <span>Comprado em</span>
          <input type="date" value={purchaseDate} onChange={(e) => { setPurchaseDate(e.target.value); suggest(name, category, location, e.target.value); }} />
        </label>
        <label className="field">
          <span>Vence em {!expiryTouched && expiryDate && <em>(sugestão)</em>}</span>
          <input type="date" value={expiryDate} onChange={(e) => { setExpiryDate(e.target.value); setExpiryTouched(true); }} />
        </label>
      </div>
      <label className="field">
        <span>Observações</span>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
      </label>
      <button className="btn primary block" type="submit">{item ? "Salvar" : "Adicionar"}</button>
      {item && <button className="btn danger block" type="button" onClick={remove}>Excluir item</button>}
    </form>
  );
}

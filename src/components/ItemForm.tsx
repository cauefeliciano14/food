import { useRef, useState } from "react";
import type { Category, FoodItem, Location } from "../lib/types";
import { CATEGORIES, LOCATIONS, UNITS } from "../lib/types";
import { addDays, today } from "../lib/dates";
import { defaultLocation, suggestShelfLifeDays } from "../lib/shelfLife";
import { db } from "../lib/db";
import { ExpiryPhoto } from "./ExpiryPhoto";

export function ItemForm({ item, initial, onDone, onNext }: {
  item?: FoodItem;
  /** prefill for a new item (e.g. from a barcode) */
  initial?: Partial<FoodItem>;
  onDone: () => void;
  /** when given, shows "Adicionar e ler outro" */
  onNext?: () => void;
}) {
  const base = item ?? initial;
  const [name, setName] = useState(base?.name ?? "");
  const [quantity, setQuantity] = useState(String(base?.quantity ?? 1));
  const [unit, setUnit] = useState(base?.unit ?? "un");
  const [category, setCategory] = useState<Category>(base?.category ?? "outros");
  const [location, setLocation] = useState<Location>(base?.location ?? "despensa");
  const [purchaseDate, setPurchaseDate] = useState(base?.purchaseDate ?? today());
  const [expiryDate, setExpiryDate] = useState(
    base?.expiryDate ?? (initial?.name ? addDays(today(), suggestShelfLifeDays(initial.name, initial.category ?? "outros", initial.location ?? "despensa")) : ""),
  );
  const [expiryTouched, setExpiryTouched] = useState(!!item);
  const [notes, setNotes] = useState(base?.notes ?? "");
  const [opened, setOpened] = useState(!!base?.openedAt);
  const [openedAt, setOpenedAt] = useState(base?.openedAt ?? today());
  const [price, setPrice] = useState(base?.unitPrice ? String(base.unitPrice).replace(".", ",") : "");
  const next = useRef(false);

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
      openedAt: opened ? openedAt || today() : undefined,
      unitPrice: Number(price.replace(",", ".")) > 0 ? +Number(price.replace(",", ".")).toFixed(2) : undefined,
    };
    if (!data.name) return;
    if (item?.id != null) await db.items.update(item.id, data);
    else {
      await db.items.add({
        ...data, ...(initial?.barcode ? { barcode: initial.barcode } : {}),
        ...(initial?.fullName && initial.fullName !== data.name ? { fullName: initial.fullName } : {}), createdAt: Date.now(),
      });
      // Remember what this barcode is, so the next scan is instant and offline.
      if (initial?.barcode) {
        await db.barcodes.put({
          code: initial.barcode, name: data.name, category, location, unit, quantity: data.quantity, v: 2,
          ...(initial.fullName ? { fullName: initial.fullName } : {}),
          ...(initial.notes?.startsWith("Embalagem: ") ? { size: initial.notes.slice(11) } : {}),
        });
      }
    }
    if (next.current && onNext) onNext();
    else onDone();
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
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Onde fica</span>
          <select value={location} onChange={(e) => {
            const l = e.target.value as Location;
            setLocation(l);
            suggest(name, category, l);
          }}>
            {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
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
      <ExpiryPhoto onDate={(d) => { setExpiryDate(d); setExpiryTouched(true); }} />
      <label className="row" style={{ cursor: "pointer", gap: 10 }}>
        <input type="checkbox" checked={opened} onChange={(e) => setOpened(e.target.checked)} style={{ width: 22, height: 22 }} />
        <span>Já está aberto</span>
        {opened && <input type="date" value={openedAt} max={today()} onChange={(e) => setOpenedAt(e.target.value)} aria-label="Aberto em" style={{ marginLeft: "auto", width: "auto" }} />}
      </label>
      <label className="field">
        <span>Preço por {unit} (R$, opcional — para calcular o desperdício)</span>
        <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex.: 22,90" />
      </label>
      <label className="field">
        <span>Observações</span>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
      </label>
      <button className="btn primary block" type="submit" onClick={() => (next.current = false)}>{item ? "Salvar" : "Adicionar"}</button>
      {onNext && !item && (
        <button className="btn block" type="submit" onClick={() => (next.current = true)}>Adicionar e ler outro código</button>
      )}
      {item && <button className="btn danger block" type="button" onClick={remove}>Excluir item</button>}
    </form>
  );
}

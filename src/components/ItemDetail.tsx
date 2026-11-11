import { useState } from "react";
import { useBack } from "../lib/back";
import type { FoodItem } from "../lib/types";
import { categoryInfo, locationInfo } from "../lib/types";
import { formatBR } from "../lib/dates";
import { consumeItem, db, moveItem, moveMessage } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "../lib/toast";
import { LOCATIONS, type Location } from "../lib/types";
import { addToShopping } from "../lib/shopping";
import { ItemBadge, fmtQty } from "./ItemRow";
import { OpenItem } from "./OpenItem";
import { freshnessNote } from "../lib/freshness";
import { ItemForm } from "./ItemForm";
import { Check, Droplets, Info, PackageOpen, Pencil, ShoppingCart, Sparkles, Split, Trash2 } from "lucide-react";
import { CategoryIcon, LocationIcon } from "./icons";

export function ItemDetail({ item: initial, onDone }: { item: FoodItem; onDone: () => void }) {
  // follow changes made from this screen (e.g. moving it to the freezer)
  const item = useLiveQuery(() => db.items.get(initial.id!), [initial.id]) ?? initial;
  const showToast = useToast();
  const [editing, setEditing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [listed, setListed] = useState(false);
  const [amount, setAmount] = useState(String(item.unit === "un" || item.unit === "lata" ? 1 : item.quantity));
  useBack(editing || opening, () => { setEditing(false); setOpening(false); });

  if (editing) return <ItemForm item={item} onDone={onDone} onCancel={() => setEditing(false)} />;
  if (opening) return <OpenItem item={item} onDone={onDone} onCancel={() => setOpening(false)} />;
  const note = freshnessNote(item);

  const n = Math.max(0, Number(amount.replace(",", ".")) || 0);
  const act = async (action: "consumido" | "descartado", all = false) => {
    await consumeItem(item, all ? item.quantity : n, action);
    onDone();
  };

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row"><CategoryIcon category={item.category} size={48} /><div style={{ minWidth: 0 }}><b>{item.name}</b><div className="small muted">{categoryInfo(item.category).label}</div></div></div>
        <div className="row wrap small">
          <span>{fmtQty(item.quantity, item.unit)}</span>·<span className="icon-label"><LocationIcon location={item.location} />{locationInfo(item.location).label}</span>
        </div>
        <div className="row wrap small">
          <span className="muted">Comprado: {formatBR(item.purchaseDate)}</span>
          <span className="muted">Validade: {formatBR(item.expiryDate)}</span>
          {item.openedAt && <span className="muted icon-label"><PackageOpen size={14} />Aberto: {formatBR(item.openedAt)}</span>}
          <ItemBadge item={item} />
        </div>
        {note && <div className="small icon-label" style={{ alignItems: "flex-start" }}><Info size={14} style={{ marginTop: 3 }} /><span>{note}</span></div>}
        {item.fullName && item.fullName !== item.name && <div className="small"><span className="muted">Nome original: </span>{item.fullName}</div>}
        {item.notes && <div className="small">{item.notes}</div>}
        {item.thawedAt && item.location !== "freezer" && (
          <div className="notice small icon-label" role="status"><Droplets size={16} /><span>Descongelado em {formatBR(item.thawedAt)}: use até {formatBR(item.expiryDate)}. Não volte ao freezer cru.</span></div>
        )}
        {item.tip && <div className="small icon-label" style={{ alignItems: "flex-start" }}><Sparkles size={14} style={{ marginTop: 3 }} aria-label="Dica da IA" /><span>{item.tip}</span></div>}
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <span className="small muted">Onde está (toque para mover)</span>
        <div className="segmented locs" role="radiogroup" aria-label="Onde está">
          {LOCATIONS.map((l) => (
            <button key={l.value} role="radio" aria-checked={item.location === l.value} className={item.location === l.value ? "active" : ""}
              onClick={async () => {
                if (item.location === l.value) return;
                const r = await moveItem(item, l.value as Location);
                showToast(moveMessage(item, l.value as Location, r), r.undo);
              }}><LocationIcon location={l.value} />{l.label}</button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Quanto foi usado? ({item.unit})</span>
        <input type="number" inputMode="decimal" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <div className="grid-2">
        <button className="btn primary" onClick={() => act("consumido")} disabled={n <= 0}><Check size={18} />Usei</button>
        <button className="btn" onClick={() => act("consumido", true)}>Acabou tudo</button>
      </div>
      <button className="btn block" onClick={() => setOpening(true)}>
        {item.openedAt ? <><Split size={18} />Separar em outro pote</> : <><PackageOpen size={18} />Abri a embalagem</>}
      </button>
      <button className="btn danger block" onClick={() => act("descartado", true)}><Trash2 size={18} />Joguei fora (estragou)</button>
      <button className="btn block" disabled={listed} onClick={async () => { await addToShopping(item.name); setListed(true); }}>
        {listed ? <><Check size={18} />Está na lista de compras</> : <><ShoppingCart size={18} />Pôr na lista de compras</>}
      </button>
      <button className="btn ghost block" onClick={() => setEditing(true)}><Pencil size={18} />Editar</button>
    </div>
  );
}

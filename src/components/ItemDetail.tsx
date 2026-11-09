import { useState } from "react";
import type { FoodItem } from "../lib/types";
import { categoryInfo, locationInfo } from "../lib/types";
import { formatBR } from "../lib/dates";
import { consumeItem } from "../lib/db";
import { ExpiryBadge, fmtQty } from "./ItemRow";
import { ItemForm } from "./ItemForm";

export function ItemDetail({ item, onDone }: { item: FoodItem; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(item.unit === "un" || item.unit === "lata" ? 1 : item.quantity));

  if (editing) return <ItemForm item={item} onDone={onDone} />;

  const n = Math.max(0, Number(amount.replace(",", ".")) || 0);
  const act = async (action: "consumido" | "descartado", all = false) => {
    await consumeItem(item, all ? item.quantity : n, action);
    onDone();
  };

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row"><span style={{ fontSize: "2rem" }}>{categoryInfo(item.category).icon}</span><div><b>{item.name}</b><div className="small muted">{categoryInfo(item.category).label}</div></div></div>
        <div className="row wrap small">
          <span>{fmtQty(item.quantity, item.unit)}</span>·<span>{locationInfo(item.location).icon} {locationInfo(item.location).label}</span>
        </div>
        <div className="row wrap small">
          <span className="muted">Comprado: {formatBR(item.purchaseDate)}</span>
          <span className="muted">Validade: {formatBR(item.expiryDate)}</span>
          <ExpiryBadge date={item.expiryDate} />
        </div>
        {item.notes && <div className="small">{item.notes}</div>}
      </div>

      <label className="field">
        <span>Quanto foi usado? ({item.unit})</span>
        <input type="number" inputMode="decimal" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <div className="grid-2">
        <button className="btn primary" onClick={() => act("consumido")} disabled={n <= 0}>✅ Usei</button>
        <button className="btn" onClick={() => act("consumido", true)}>Acabou tudo</button>
      </div>
      <button className="btn danger block" onClick={() => act("descartado", true)}>🗑️ Joguei fora (estragou)</button>
      <button className="btn ghost block" onClick={() => setEditing(true)}>✏️ Editar</button>
    </div>
  );
}

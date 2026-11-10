import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { parseQuickAdd } from "../lib/quickAdd";
import { guessCategory } from "../lib/shopping";
import { defaultLocation, suggestShelfLifeDays } from "../lib/shelfLife";
import { addDays, expiryLabel, today } from "../lib/dates";
import { normalize } from "../lib/normalize";
import { locationInfo, type Category, type FoodItem, type HistoryEntry, type Location } from "../lib/types";
import { fmtQty } from "./ItemRow";
import { Mic, Plus, Repeat, X } from "lucide-react";
import { CategoryIcon, LocationIcon } from "./icons";

interface Draft {
  name: string;
  quantity: number;
  unit: string;
  category: Category;
  location: Location;
  expiryDate: string;
}

/** Reuse what the app already knows about a product (pantry, then history), else guess. */
function enrich(name: string, quantity: number, unit: string, pantry: FoodItem[], history: HistoryEntry[]): Draft {
  const key = normalize(name);
  const known = pantry.find((p) => normalize(p.name) === key);
  const category = known?.category ?? history.find((h) => normalize(h.itemName) === key)?.category ?? guessCategory(name);
  const location = known?.location ?? defaultLocation(category, name);
  return {
    name, quantity, unit: unit === "un" && known ? known.unit : unit, category, location,
    expiryDate: addDays(today(), suggestShelfLifeDays(name, category, location)),
  };
}

const NEXT_LOCATION: Record<Location, Location> = { geladeira: "freezer", freezer: "despensa", despensa: "armario", armario: "geladeira" };

export function QuickAdd({ onAdded }: { onAdded: (count: number) => void }) {
  const [text, setText] = useState("");
  const [overrides, setOverrides] = useState<Record<number, Partial<Draft> | null>>({});
  const pantry = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const history = useLiveQuery(() => db.history.toArray(), []) ?? [];

  const drafts = useMemo(() => {
    return parseQuickAdd(text)
      .map((p, i) => {
        const o = overrides[i];
        if (o === null) return null; // removed
        const d = enrich(p.name, p.quantity, p.unit, pantry, history);
        const merged = { ...d, ...o };
        if (o?.location) merged.expiryDate = addDays(today(), suggestShelfLifeDays(merged.name, merged.category, merged.location));
        return { ...merged, i };
      })
      .filter((d): d is Draft & { i: number } => d != null);
  }, [text, overrides, pantry, history]);

  async function addAll() {
    const now = Date.now();
    await db.items.bulkAdd(drafts.map(({ i: _i, ...d }) => ({ ...d, purchaseDate: today(), createdAt: now })));
    onAdded(drafts.length);
    setText("");
    setOverrides({});
  }

  return (
    <div className="stack">
      <label className="field">
        <span className="icon-label"><Mic size={14} />Escreva ou dite pelo microfone do teclado</span>
        <textarea
          rows={2}
          value={text}
          onChange={(e) => { setText(e.target.value); setOverrides({}); }}
          placeholder="Ex.: 6 ovos, 1kg arroz, 2 litros de leite e tomate"
          style={{ minHeight: 64 }}
          enterKeyHint="done"
        />
      </label>
      {drafts.length > 0 && (
        <>
          <div className="list">
            {drafts.map((d) => (
              <div key={d.i} className="item quick">
                <CategoryIcon category={d.category} size={34} />
                <div className="body">
                  <div className="title">{d.name}</div>
                  <div className="small muted">{fmtQty(d.quantity, d.unit)} · {expiryLabel(d.expiryDate).replace(/^vence (em )?/, "validade: ")}</div>
                </div>
                <button className="btn sm" title="Trocar local" aria-label={`Local: ${locationInfo(d.location).label}. Toque para trocar`}
                  onClick={() => setOverrides((o) => ({ ...o, [d.i]: { ...o[d.i], location: NEXT_LOCATION[d.location] } }))}>
                  <LocationIcon location={d.location} />{locationInfo(d.location).label}
                </button>
                <button className="icon-btn" aria-label={`Remover ${d.name}`} onClick={() => setOverrides((o) => ({ ...o, [d.i]: null }))}><X size={18} /></button>
              </div>
            ))}
          </div>
          <button className="btn primary block" onClick={addAll}><Plus size={18} />Adicionar {drafts.length} {drafts.length === 1 ? "item" : "itens"}</button>
          <div className="small muted">Toque no local para trocar. Para mudar a validade, edite o item depois.</div>
        </>
      )}
    </div>
  );
}

/** One-tap re-add of the things you use most. */
export function BuyAgain({ onAdded }: { onAdded: (name: string, undo: () => void) => void }) {
  const history = useLiveQuery(() => db.history.toArray(), []) ?? [];
  const pantry = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const frequent = useMemo(() => {
    const counts = new Map<string, { name: string; category: Category; count: number; unit?: string }>();
    for (const h of history) {
      const k = normalize(h.itemName);
      const c = counts.get(k) ?? { name: h.itemName, category: h.category, count: 0, unit: h.unit };
      c.count++;
      counts.set(k, c);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 12);
  }, [history]);

  if (frequent.length === 0) return null;
  return (
    <div>
      <div className="small muted icon-label" style={{ marginBottom: 8 }}><Repeat size={14} />Comprar de novo — um toque adiciona 1</div>
      <div className="chips">
        {frequent.map((f) => (
          <button key={f.name} className="chip" onClick={async () => {
            const d = enrich(f.name, 1, f.unit && f.unit !== "kg" && f.unit !== "g" ? f.unit : "un", pantry, history);
            const id = await db.items.add({ ...d, category: f.category, purchaseDate: today(), createdAt: Date.now() });
            onAdded(f.name, () => db.items.delete(id as number));
          }}>
            <Plus size={14} />{f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

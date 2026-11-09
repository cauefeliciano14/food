import { useCallback, useState } from "react";
import { BarcodeScanner } from "./BarcodeScanner";
import { ItemForm } from "./ItemForm";
import { lookupBarcode, type BarcodeLookup } from "../lib/barcode";
import { db } from "../lib/db";
import { addDays, today } from "../lib/dates";
import { suggestShelfLifeDays } from "../lib/shelfLife";
import { LOCATIONS, UNITS, type FoodItem, type Location } from "../lib/types";

/** Scan → look up → one-tap confirm (or full form) → scan the next one. */
export function BarcodeAdd({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<"scan" | "lookup" | "confirm" | "form">("scan");
  const [result, setResult] = useState<BarcodeLookup | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [round, setRound] = useState(0);

  const onCode = useCallback(async (code: string) => {
    setStage("lookup");
    const r = await lookupBarcode(code);
    setResult(r);
    setStage(r.found ? "confirm" : "form");
  }, []);

  const next = (name?: string) => {
    if (name) setAdded((a) => [...a, name]);
    setRound((r) => r + 1);
    setResult(null);
    setStage("scan");
  };

  if (stage === "lookup") return <div className="stack" style={{ textAlign: "center" }}><div className="spinner" /><p className="muted">Procurando o produto…</p></div>;

  if (stage === "confirm" && result) {
    return <QuickConfirm key={round} prefill={result.prefill} fromMemory={result.source === "memoria"}
      onAdded={(name, more) => (more ? next(name) : onDone())} onDetails={() => setStage("form")} />;
  }

  if (stage === "form" && result) {
    return (
      <div className="stack">
        {!result.found && (
          <div className="error small">Código {result.prefill.barcode} não encontrado. Preencha o nome — da próxima vez o app vai lembrar.</div>
        )}
        <ItemForm key={round} initial={result.prefill} onDone={onDone} onNext={() => next()} />
      </div>
    );
  }

  return (
    <div className="stack">
      {added.length > 0 && <div className="notice small">✔ Adicionados: {added.join(", ")}. Próximo:</div>}
      <BarcodeScanner key={round} onCode={onCode} />
      {added.length > 0 && <button className="btn ghost block" onClick={onDone}>Concluir</button>}
    </div>
  );
}

function QuickConfirm({ prefill, fromMemory, onAdded, onDetails }: {
  prefill: Partial<FoodItem>;
  fromMemory: boolean;
  onAdded: (name: string, scanMore: boolean) => void;
  onDetails: () => void;
}) {
  const category = prefill.category ?? "outros";
  const [name, setName] = useState(prefill.name ?? "");
  const [qty, setQty] = useState(prefill.quantity ?? 1);
  const [unit, setUnit] = useState(prefill.unit ?? "un");
  const [location, setLocation] = useState<Location>(prefill.location ?? "despensa");
  const [expiry, setExpiry] = useState(addDays(today(), suggestShelfLifeDays(prefill.name ?? "", category, prefill.location ?? "despensa")));
  const [expiryTouched, setExpiryTouched] = useState(false);

  async function save(scanMore: boolean) {
    const clean = name.trim();
    if (!clean) return;
    await db.items.add({
      name: clean, quantity: qty, unit, category, location, purchaseDate: today(), expiryDate: expiry,
      ...(prefill.notes ? { notes: prefill.notes } : {}), ...(prefill.barcode ? { barcode: prefill.barcode } : {}), createdAt: Date.now(),
    });
    if (prefill.barcode) {
      await db.barcodes.put({
        code: prefill.barcode, name: clean, category, location, unit,
        ...(prefill.notes?.startsWith("Embalagem: ") ? { size: prefill.notes.slice(11) } : {}),
      });
    }
    onAdded(clean, scanMore);
  }

  return (
    <div className="stack">
      <div className="notice small">{fromMemory ? "✔ Produto que você já cadastrou." : "✔ Produto encontrado. Confira o nome."}</div>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome" style={{ fontWeight: 600 }} />
      {prefill.notes && <div className="small muted" style={{ marginTop: -4 }}>{prefill.notes}</div>}
      <div className="row">
        <button className="btn" aria-label="Menos" onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ minWidth: 48 }}>−</button>
        <b style={{ minWidth: 40, textAlign: "center", fontSize: "1.2rem" }}>{qty}</b>
        <button className="btn" aria-label="Mais" onClick={() => setQty((q) => q + 1)} style={{ minWidth: 48 }}>+</button>
        <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unidade" style={{ width: "auto", flex: 1 }}>
          {UNITS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div className="segmented" role="radiogroup" aria-label="Onde fica">
        {LOCATIONS.map((l) => (
          <button key={l.value} role="radio" aria-checked={location === l.value} className={location === l.value ? "active" : ""}
            onClick={() => {
              setLocation(l.value);
              if (!expiryTouched) setExpiry(addDays(today(), suggestShelfLifeDays(name, category, l.value)));
            }}>{l.icon} {l.label}</button>
        ))}
      </div>
      <label className="field">
        <span>Validade {expiryTouched ? "" : "(sugestão — confira na embalagem)"}</span>
        <input type="date" value={expiry} onChange={(e) => { setExpiry(e.target.value); setExpiryTouched(true); }} />
      </label>
      <button className="btn primary block" style={{ minHeight: 52 }} onClick={() => save(true)} disabled={!name.trim()}>Adicionar e ler o próximo</button>
      <div className="grid-2">
        <button className="btn" onClick={() => save(false)} disabled={!name.trim()}>Adicionar e fechar</button>
        <button className="btn ghost" onClick={onDetails}>Mais detalhes</button>
      </div>
    </div>
  );
}

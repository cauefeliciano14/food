import { useRef, useState } from "react";
import { fileToJpegBase64 } from "../lib/image";
import { addDays, today } from "../lib/dates";
import { db } from "../lib/db";
import { loadSettings } from "../lib/settings";
import { CATEGORIES, LOCATIONS, UNITS, type Category, type Location } from "../lib/types";

interface Draft {
  include: boolean;
  rawName: string;
  name: string;
  quantity: number;
  unit: string;
  category: Category;
  location: Location;
  shelfLifeDays: number;
  expiryDate: string;
}

type Stage = "pick" | "reading" | "review" | "done";

export function ScanReceipt({ onDone, onNeedKey }: { onDone: () => void; onNeedKey: () => void }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [store, setStore] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saved, setSaved] = useState(0);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const apiKey = loadSettings().apiKey;

  async function onFile(file?: File) {
    if (!file) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setStage("reading");
    try {
      const b64 = await fileToJpegBase64(file);
      const { readReceipt } = await import("../lib/ai");
      const res = await readReceipt(apiKey, b64);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(res.purchaseDate) ? res.purchaseDate : today();
      setStore(res.store);
      setPurchaseDate(date);
      setDrafts(
        res.items.map((it) => {
          const days = Math.max(1, Math.round(it.shelfLifeDays));
          return {
            include: it.isFood,
            rawName: it.rawName,
            name: it.name,
            quantity: it.quantity > 0 ? it.quantity : 1,
            unit: UNITS.includes(it.unit) ? it.unit : "un",
            category: it.category,
            location: it.location,
            shelfLifeDays: days,
            expiryDate: addDays(date, days),
          };
        }),
      );
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("pick");
    }
  }

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  function changePurchaseDate(date: string) {
    setPurchaseDate(date);
    setDrafts((ds) => ds.map((d) => ({ ...d, expiryDate: addDays(date || today(), d.shelfLifeDays) })));
  }

  async function save() {
    const chosen = drafts.filter((d) => d.include && d.name.trim());
    const now = Date.now();
    await db.items.bulkAdd(
      chosen.map((d) => ({
        name: d.name.trim(),
        quantity: d.quantity,
        unit: d.unit,
        category: d.category,
        location: d.location,
        purchaseDate,
        expiryDate: d.expiryDate,
        notes: store ? `Comprado em ${store}` : undefined,
        createdAt: now,
      })),
    );
    setSaved(chosen.length);
    setStage("done");
  }

  if (!apiKey) {
    return (
      <div className="stack">
        <div className="notice">
          Para ler a nota fiscal pela foto o app usa a IA da Anthropic (Claude). Cadastre sua chave de API em <b>Ajustes</b> — ela fica salva só neste aparelho.
        </div>
        <button className="btn primary block" onClick={onNeedKey}>Ir para Ajustes</button>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="empty">
        <div className="big">🎉</div>
        <p>{saved} item(ns) adicionado(s) à despensa.</p>
        <button className="btn primary" onClick={onDone}>Ver despensa</button>
      </div>
    );
  }

  if (stage === "reading") {
    return (
      <div className="stack" style={{ textAlign: "center" }}>
        {preview && <img src={preview} alt="Nota" style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 12, objectFit: "contain" }} />}
        <div className="spinner" />
        <p className="muted">Lendo a nota… isso pode levar alguns segundos.</p>
      </div>
    );
  }

  if (stage === "review") {
    const count = drafts.filter((d) => d.include).length;
    return (
      <div className="stack">
        <div className="small muted">{store && <>📍 {store} · </>}Confira os itens, ajuste o que precisar e desmarque o que não é comida.</div>
        <label className="field">
          <span>Data da compra</span>
          <input type="date" value={purchaseDate} onChange={(e) => changePurchaseDate(e.target.value)} />
        </label>
        <div className="list">
          {drafts.map((d, i) => (
            <div key={i} className={`scan-row ${d.include ? "" : "off"}`}>
              <input type="checkbox" checked={d.include} onChange={(e) => update(i, { include: e.target.checked })} aria-label="Incluir" />
              <div className="stack" style={{ minWidth: 0 }}>
                <input type="text" value={d.name} onChange={(e) => update(i, { name: e.target.value })} />
                <div className="small muted" style={{ marginTop: 2 }}>{d.rawName}</div>
                {d.include && (
                  <>
                    <div className="grid-3">
                      <input type="number" inputMode="decimal" step="any" min="0" value={d.quantity} aria-label="Quantidade"
                        onChange={(e) => update(i, { quantity: Number(e.target.value) || 0 })} />
                      <select value={d.unit} onChange={(e) => update(i, { unit: e.target.value })} aria-label="Unidade">
                        {UNITS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                      <select value={d.location} onChange={(e) => update(i, { location: e.target.value as Location })} aria-label="Local">
                        {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.icon} {l.label}</option>)}
                      </select>
                    </div>
                    <div className="grid-2">
                      <select value={d.category} onChange={(e) => update(i, { category: e.target.value as Category })} aria-label="Categoria">
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                      </select>
                      <input type="date" value={d.expiryDate} aria-label="Validade"
                        onChange={(e) => update(i, { expiryDate: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="small muted">As validades são estimativas — se a embalagem tiver data, ajuste aqui ou depois.</div>
        <button className="btn primary block" onClick={save} disabled={count === 0}>Adicionar {count} item(ns)</button>
        <button className="btn ghost block" onClick={() => { setStage("pick"); setDrafts([]); }}>Tirar outra foto</button>
      </div>
    );
  }

  return (
    <div className="stack">
      {error && <div className="error">{error}</div>}
      <p className="muted small">
        Fotografe o cupom inteiro, de cima, com boa luz. Para notas muito compridas, tire mais de uma foto (uma por vez).
      </p>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <button className="btn primary block" onClick={() => cameraRef.current?.click()}>📷 Tirar foto da nota</button>
      <button className="btn block" onClick={() => galleryRef.current?.click()}>🖼️ Escolher da galeria</button>
    </div>
  );
}

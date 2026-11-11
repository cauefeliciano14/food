import { useRef, useState } from "react";
import { useBack } from "../lib/back";
import { fileToJpegBase64 } from "../lib/image";
import { addDays, today } from "../lib/dates";
import { db } from "../lib/db";
import { aiAllowed } from "../lib/settings";
import { fetchNfceHtml, isNfceUrl, looksLikeFood, mapUnit, parseNfceHtml, prettyName } from "../lib/nfce";
import { guessCategory } from "../lib/shopping";
import { defaultLocation, suggestShelfLifeDays } from "../lib/shelfLife";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { CATEGORIES, LOCATIONS, UNITS, type Category, type Location } from "../lib/types";
import { CalendarCheck, Camera, ChevronLeft, ChevronRight, Image as ImageIcon, PartyPopper, QrCode } from "lucide-react";
import { IconTile } from "../components/icons";
import { ExpiryPhoto } from "../components/ExpiryPhoto";
import { formatBR } from "../lib/dates";

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
  unitPrice: number;
  /** the date came from the package (photo or typed), not an estimate */
  checked?: boolean;
}

type Stage = "pick" | "qr" | "reading" | "review" | "guide" | "done";

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
  const aiOn = aiAllowed("nota");

  async function onFile(file?: File) {
    if (!file) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setStage("reading");
    try {
      const b64 = await fileToJpegBase64(file);
      const { readReceipt } = await import("../lib/ai");
      const res = await readReceipt(b64);
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
            unitPrice: it.unitPrice > 0 ? +it.unitPrice.toFixed(2) : 0,
          };
        }),
      );
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("pick");
    }
  }

  async function onQr(text: string) {
    setError("");
    if (!isNfceUrl(text)) {
      setError("Esse QR code não parece ser de uma NFC-e. Procure o QR impresso no fim do cupom, perto de “Consulte pela chave de acesso”.");
      setStage("pick");
      return;
    }
    setPreview("");
    setStage("reading");
    try {
      const data = parseNfceHtml(await fetchNfceHtml(text));
      const date = data.purchaseDate || today();
      setStore(data.store);
      setPurchaseDate(date);
      // Merge repeated lines of the same product.
      const merged = new Map<string, Draft>();
      for (const it of data.items) {
        const name = prettyName(it.rawName);
        const unit = mapUnit(it.unit);
        const prev = merged.get(it.rawName);
        if (prev) {
          prev.quantity = +(prev.quantity + it.quantity).toFixed(3);
          continue;
        }
        const category = guessCategory(name);
        const location = defaultLocation(category, name);
        const days = suggestShelfLifeDays(name, category, location);
        merged.set(it.rawName, {
          include: looksLikeFood(name),
          rawName: it.rawName,
          name,
          quantity: it.quantity,
          unit,
          category,
          location,
          shelfLifeDays: days,
          expiryDate: addDays(date, days),
          unitPrice: it.unitPrice > 0 ? +it.unitPrice.toFixed(2) : 0,
        });
      }
      setDrafts([...merged.values()]);
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
    setDrafts((ds) => ds.map((d) => (d.checked ? d : { ...d, expiryDate: addDays(date || today(), d.shelfLifeDays) })));
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
        ...(d.unitPrice > 0 ? { unitPrice: d.unitPrice } : {}),
        createdAt: now,
      })),
    );
    setSaved(chosen.length);
    setStage("done");
  }

  const [guideAt, setGuideAt] = useState(0);
  useBack(stage === "qr" || stage === "review" || stage === "guide", () => setStage(stage === "guide" ? "review" : "pick"));

  if (stage === "done") {
    return (
      <div className="empty">
        <IconTile icon={PartyPopper} hue={135} size={72} className="empty-ico" />
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
        <p className="muted">{preview ? "Lendo a foto da nota… isso pode levar alguns segundos." : "Buscando a nota na SEFAZ…"}</p>
      </div>
    );
  }

  if (stage === "guide") {
    // One item per screen, big buttons: photo of the date, next, previous.
    const idx = drafts.map((d, i) => (d.include ? i : -1)).filter((i) => i >= 0);
    const pos = Math.min(guideAt, idx.length - 1);
    const i = idx[pos];
    const d = drafts[i];
    const last = pos === idx.length - 1;
    const setDate = (iso: string) => update(i, { expiryDate: iso, checked: true });
    return (
      <div className="stack">
        <div className="row small" style={{ justifyContent: "space-between" }}>
          <b>Item {pos + 1} de {idx.length}</b>
          <span className="muted">{idx.filter((j) => drafts[j].checked).length} conferido(s)</span>
        </div>
        <div className="progress" aria-hidden="true"><div style={{ width: `${((pos + 1) / idx.length) * 100}%` }} /></div>
        <div className="card stack" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800 }} aria-live="polite">{d.name}</div>
          <div className="small muted">{d.quantity} {d.unit} · {LOCATIONS.find((l) => l.value === d.location)?.label}</div>
          <div style={{ fontSize: "1.1rem" }}>
            Validade: <b>{formatBR(d.expiryDate)}</b>{" "}
            <span className={`small ${d.checked ? "" : "muted"}`}>{d.checked ? "(conferida)" : "(estimativa)"}</span>
          </div>
        </div>
        <ExpiryPhoto key={i} big itemName={d.name} onDate={setDate} />
        <label className="field">
          <span>Ou digite a data</span>
          <input type="date" value={d.expiryDate} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="grid-2">
          <button className="btn" style={{ minHeight: 52 }} disabled={pos === 0} onClick={() => setGuideAt(pos - 1)}><ChevronLeft size={20} />Anterior</button>
          {last
            ? <button className="btn primary" style={{ minHeight: 52 }} onClick={() => setStage("review")}><CalendarCheck size={20} />Concluir</button>
            : <button className="btn primary" style={{ minHeight: 52 }} onClick={() => setGuideAt(pos + 1)}>{d.checked ? "Próximo" : "Pular"}<ChevronRight size={20} /></button>}
        </div>
        <button className="btn ghost block" onClick={() => setStage("review")}>Voltar para a lista</button>
      </div>
    );
  }

  if (stage === "review") {
    const count = drafts.filter((d) => d.include).length;
    const checkedCount = drafts.filter((d) => d.include && d.checked).length;
    return (
      <div className="stack">
        <div className="small muted">{store && <>{store} · </>}Confira os itens, ajuste o que precisar e desmarque o que não é comida.</div>
        <label className="field">
          <span>Data da compra</span>
          <input type="date" value={purchaseDate} onChange={(e) => changePurchaseDate(e.target.value)} />
        </label>
        {count > 0 && (
          <button className="btn block" style={{ minHeight: 52 }} onClick={() => { setGuideAt(0); setStage("guide"); }}>
            <CalendarCheck size={20} />Conferir validades um a um, com foto{checkedCount > 0 ? ` (${checkedCount}/${count})` : ""}
          </button>
        )}
        <div className="list">
          {drafts.map((d, i) => (
            <div key={i} className={`scan-row ${d.include ? "" : "off"}`}>
              <input type="checkbox" checked={d.include} onChange={(e) => update(i, { include: e.target.checked })} aria-label="Incluir" />
              <div className="stack" style={{ minWidth: 0 }}>
                <input type="text" value={d.name} onChange={(e) => update(i, { name: e.target.value })} />
                <div className="small muted" style={{ marginTop: 2 }}>
                  {d.rawName}{d.unitPrice > 0 && ` · R$ ${d.unitPrice.toFixed(2).replace(".", ",")}/${d.unit}`}
                </div>
                {d.include && (
                  <>
                    <div className="grid-3">
                      <input type="number" inputMode="decimal" step="any" min="0" value={d.quantity} aria-label="Quantidade"
                        onChange={(e) => update(i, { quantity: Number(e.target.value) || 0 })} />
                      <select value={d.unit} onChange={(e) => update(i, { unit: e.target.value })} aria-label="Unidade">
                        {UNITS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                      <select value={d.location} onChange={(e) => update(i, { location: e.target.value as Location })} aria-label="Local">
                        {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <div className="grid-2">
                      <select value={d.category} onChange={(e) => update(i, { category: e.target.value as Category })} aria-label="Categoria">
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <input type="date" value={d.expiryDate} aria-label={`Validade de ${d.name}`}
                        onChange={(e) => update(i, { expiryDate: e.target.value, checked: true })} />
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <ExpiryPhoto itemName={d.name} onDate={(iso) => update(i, { expiryDate: iso, checked: true })} />
                      <span className="small muted">{d.checked ? "Validade conferida" : "Validade estimada"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="small muted">As validades são estimativas — se a embalagem tiver data, ajuste aqui ou depois. Revise os nomes: o app abrevia como o cupom.</div>
        <button className="btn primary block" onClick={save} disabled={count === 0}>Adicionar {count} item(ns)</button>
        <button className="btn ghost block" onClick={() => { setStage("pick"); setDrafts([]); }}>Ler outra nota</button>
      </div>
    );
  }

  if (stage === "qr") {
    return (
      <div className="stack">
        <BarcodeScanner mode="qr" onCode={onQr} />
        <button className="btn ghost block" onClick={() => setStage("pick")}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="stack">
      {error && <div className="error">{error}</div>}
      <button className="btn primary block" style={{ minHeight: 56 }} onClick={() => { setError(""); setStage("qr"); }}><QrCode size={20} />Ler QR code da nota — grátis</button>
      <p className="muted small" style={{ margin: 0 }}>
        O QR code no fim do cupom (NFC-e) leva à lista exata de produtos e preços na SEFAZ. Funciona no app Android.
      </p>
      <hr style={{ border: "none", borderTop: "1px solid var(--border)", width: "100%" }} />
      <b className="small">Nota sem QR code? Foto com IA</b>
      {aiOn ? (
        <>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="grid-2">
            <button className="btn" onClick={() => cameraRef.current?.click()}><Camera size={18} />Tirar foto</button>
            <button className="btn" onClick={() => galleryRef.current?.click()}><ImageIcon size={18} />Da galeria</button>
          </div>
          <p className="muted small" style={{ margin: 0 }}>Fotografe o cupom inteiro, de cima, com boa luz. Usa a API da Anthropic (custa centavos por foto).</p>
        </>
      ) : (
        <p className="muted small" style={{ margin: 0 }}>
          Opcional e pago (centavos por foto): ligue a IA e a leitura de nota em Ajustes.{" "}
          <button className="btn ghost sm" onClick={onNeedKey} style={{ padding: 0, minHeight: 0, textDecoration: "underline" }}>Configurar</button>
        </p>
      )}
    </div>
  );
}

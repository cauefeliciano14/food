import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, Sparkles } from "lucide-react";
import { db } from "../lib/db";
import { formatBR } from "../lib/dates";
import { aiAllowed, loadSpend } from "../lib/settings";
import { categoryInfo, locationInfo, type FoodItem } from "../lib/types";
import type { OrganizeSuggestion } from "../lib/ai";
import { useToast } from "../lib/toast";
import { useBack } from "../lib/back";
import { LocationIcon } from "./icons";

const CHUNK = 40;

interface Row {
  item: FoodItem;
  s: OrganizeSuggestion;
  changes: { name: boolean; category: boolean; location: boolean; expiry: boolean };
  on: boolean;
}

/**
 * "Organizar com IA": runs only when the button is pressed, sends only the
 * items the AI hasn't seen yet, and changes nothing until the user approves.
 */
export function OrganizeAI({ onDone, onNeedSettings }: { onDone: () => void; onNeedSettings: () => void }) {
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [unchanged, setUnchanged] = useState<{ item: FoodItem; s: OrganizeSuggestion }[]>([]);
  const showToast = useToast();
  useBack(rows != null, () => setRows(null));

  const pending = items.filter((i) => i.quantity > 0 && !i.aiReviewedAt);
  const target = all ? items.filter((i) => i.quantity > 0) : pending;

  if (!aiAllowed("organizar")) {
    return (
      <div className="stack">
        <div className="notice">Ligue a IA e “Organizar a despensa” em Ajustes → IA.</div>
        <button className="btn primary block" onClick={onNeedSettings}>Ir para Ajustes</button>
      </div>
    );
  }

  async function run() {
    setError("");
    try {
      const { organizePantry } = await import("../lib/ai");
      const got: OrganizeSuggestion[] = [];
      for (let k = 0; k < target.length; k += CHUNK) {
        const part = target.slice(k, k + CHUNK);
        setBusy(target.length > CHUNK ? `Analisando ${Math.min(k + CHUNK, target.length)} de ${target.length}…` : `Analisando ${target.length} itens…`);
        got.push(...(await organizePantry(part)));
      }
      const byId = new Map(target.map((i) => [i.id!, i]));
      const changed: Row[] = [];
      const same: { item: FoodItem; s: OrganizeSuggestion }[] = [];
      for (const s of got) {
        const item = byId.get(s.id);
        if (!item) continue;
        byId.delete(s.id);
        const expiryOk = /^\d{4}-\d{2}-\d{2}$/.test(s.expiryDate);
        const changes = {
          name: !!s.name.trim() && s.name.trim() !== item.name,
          category: s.category !== item.category,
          location: s.location !== item.location,
          expiry: expiryOk && s.expiryDate !== item.expiryDate,
        };
        if (Object.values(changes).some(Boolean)) changed.push({ item, s, changes, on: true });
        else same.push({ item, s });
      }
      setUnchanged(same);
      setRows(changed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function apply() {
    if (!rows) return;
    const before = [...rows.map((r) => r.item), ...unchanged.map((u) => u.item)];
    const now = Date.now();
    await db.transaction("rw", db.items, async () => {
      for (const r of rows) {
        const patch: Partial<FoodItem> = { aiReviewedAt: now, ...(r.s.tip ? { tip: r.s.tip.trim() } : {}) };
        if (r.on) {
          if (r.changes.name) {
            patch.name = r.s.name.trim();
            // keep the original name in the details
            if (!r.item.fullName) patch.fullName = r.item.name;
          }
          if (r.changes.category) patch.category = r.s.category;
          if (r.changes.location) patch.location = r.s.location;
          if (r.changes.expiry) {
            patch.expiryDate = r.s.expiryDate;
            if (r.s.reason) patch.tip = `${r.s.reason.trim()}${r.s.tip ? ` ${r.s.tip.trim()}` : ""}`;
          }
        }
        await db.items.update(r.item.id!, patch);
      }
      for (const u of unchanged) await db.items.update(u.item.id!, { aiReviewedAt: now, ...(u.s.tip ? { tip: u.s.tip.trim() } : {}) });
    });
    const n = rows.filter((r) => r.on).length;
    showToast(n ? `${n} ${n === 1 ? "item atualizado" : "itens atualizados"}` : "Lista revisada", async () => {
      await db.items.bulkPut(before);
    });
    onDone();
  }

  if (rows) {
    const n = rows.filter((r) => r.on).length;
    return (
      <div className="stack">
        {rows.length === 0 ? (
          <div className="notice ok">Está tudo certo: a IA não sugeriu mudanças. {unchanged.length > 0 && "As dicas de conservação foram guardadas nos detalhes dos itens."}</div>
        ) : (
          <div className="small muted">Confira as sugestões. Desmarque o que não quiser mudar. Os nomes originais ficam guardados nos detalhes do item.</div>
        )}
        <div className="list">
          {rows.map((r, k) => (
            <label key={r.item.id} className={`card org-row ${r.on ? "" : "off"}`}>
              <input type="checkbox" checked={r.on} aria-label={`Aplicar sugestões para ${r.item.name}`}
                onChange={(e) => setRows(rows.map((x, j) => (j === k ? { ...x, on: e.target.checked } : x)))} />
              <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                {r.changes.name ? (
                  <div className="org-change"><span className="muted">{r.item.name}</span><ArrowRight size={14} aria-label="vira" /><b>{r.s.name}</b></div>
                ) : <b>{r.item.name}</b>}
                {r.changes.category && (
                  <div className="org-change small"><span className="muted">{categoryInfo(r.item.category).label}</span><ArrowRight size={14} aria-label="vira" />{categoryInfo(r.s.category).label}</div>
                )}
                {r.changes.location && (
                  <div className="org-change small">
                    <span className="muted">{locationInfo(r.item.location).label}</span><ArrowRight size={14} aria-label="vira" />
                    <span className="icon-label"><LocationIcon location={r.s.location} />{locationInfo(r.s.location).label}</span>
                  </div>
                )}
                {r.changes.expiry && (
                  <>
                    <div className="org-change small">
                      <span className="muted">Validade {r.item.expiryDate ? formatBR(r.item.expiryDate) : "sem data"}</span><ArrowRight size={14} aria-label="vira" /><b>{formatBR(r.s.expiryDate)}</b>
                    </div>
                    {r.s.reason && <div className="small">{r.s.reason}</div>}
                  </>
                )}
              </div>
            </label>
          ))}
        </div>
        <button className="btn primary block" style={{ minHeight: 52 }} onClick={apply}>
          {rows.length ? `Aplicar ${n} ${n === 1 ? "mudança" : "mudanças"}` : "Concluir"}
        </button>
        <button className="btn ghost block" onClick={() => setRows(null)}>Voltar</button>
      </div>
    );
  }

  const spend = loadSpend();
  return (
    <div className="stack">
      <p className="small" style={{ margin: 0 }}>
        A IA revisa sua lista e sugere:
      </p>
      <ul className="small" style={{ margin: 0, paddingLeft: 20 }}>
        <li><b>nomes práticos</b> (o nome original fica nos detalhes);</li>
        <li><b>categoria</b> certa;</li>
        <li><b>validade conforme onde está guardado</b> (geladeira, freezer, aberto ou fechado), com o motivo;</li>
        <li>uma <b>dica de conservação</b> para cada item.</li>
      </ul>
      <p className="small muted" style={{ margin: 0 }}>Nada muda sem você aprovar. Só roda quando você toca no botão e só envia os itens que ela ainda não viu. Gasto do mês até agora: US$ {spend.usd.toFixed(2).replace(".", ",")}.</p>
      {items.length - pending.length > 0 && <label className="row small" style={{ gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} style={{ width: 22, height: 22 }} />
        Revisar também os {items.length - pending.length} itens já organizados
      </label>}
      <button className="btn primary block" style={{ minHeight: 52 }} onClick={run} disabled={!!busy || target.length === 0}>
        <Sparkles size={18} />{busy || (target.length ? `Organizar ${target.length} ${target.length === 1 ? "item" : "itens"}` : "Nenhum item novo para organizar")}
      </button>
      {busy && <div className="spinner" />}
      {error && <div className="error small" role="alert">{error}</div>}
    </div>
  );
}

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { brl, monthlyStats, tipFor, topWasted, wastedByCategory } from "../lib/waste";
import { categoryInfo } from "../lib/types";
import { formatBR } from "../lib/dates";
import { ChartColumn, Lightbulb } from "lucide-react";
import { CategoryIcon, EmptyState } from "./icons";

export function WasteReport() {
  const history = useLiveQuery(() => db.history.toArray(), []);
  const months = useMemo(() => monthlyStats(history ?? [], 6), [history]);
  const top = useMemo(() => topWasted(history ?? [], 90), [history]);
  const cats = useMemo(() => wastedByCategory(history ?? [], 90), [history]);
  if (!history) return null;

  if (history.length === 0) {
    return (
      <EmptyState icon={ChartColumn}>
        <p>Ainda não há histórico. Quando você usar um item (“Usei”) ou jogar fora (“Joguei fora”), ele entra aqui.</p>
      </EmptyState>
    );
  }

  const cur = months[months.length - 1];
  const prev = months[months.length - 2];
  // A rate from 1–4 events says little ("100%" after one spoiled banana).
  const enough = (m?: { used: number; wasted: number }) => !!m && m.used + m.wasted >= 5;
  const max = Math.max(1, ...months.map((m) => m.used + m.wasted));
  const totalValue90 = top.reduce((s, t) => s + t.value, 0);
  const maxCat = Math.max(1, ...cats.map((c) => c.count));

  return (
    <div className="stack">
      <div className="kpis">
        <div className="kpi"><b>{cur.wasteRate == null || !enough(cur) ? "—" : `${Math.round(cur.wasteRate * 100)}%`}</b><span className="small muted">{enough(cur) || cur.wasteRate == null ? "desperdício este mês" : "poucos dados este mês"}</span></div>
        <div className="kpi"><b>{cur.wasted}</b><span className="small muted">jogados fora este mês</span></div>
        <div className="kpi"><b>{cur.wastedValue > 0 ? brl(cur.wastedValue) : "—"}</b><span className="small muted">em R$ este mês</span></div>
      </div>
      {enough(prev) && enough(cur) && prev.wasteRate != null && cur.wasteRate != null && (
        <div className="small muted">
          {cur.wasteRate < prev.wasteRate ? "Melhor que" : cur.wasteRate > prev.wasteRate ? "Pior que" : "Igual a"} {prev.label} ({Math.round(prev.wasteRate * 100)}%).
        </div>
      )}

      <div className="card">
        <div className="row wrap" style={{ justifyContent: "space-between" }}>
          <b>Últimos 6 meses</b>
          <div className="row small muted" aria-hidden="true">
            <span className="swatch used" /> aproveitados
            <span className="swatch waste" style={{ marginLeft: 8 }} /> jogados fora
          </div>
        </div>
        <div className="bars" role="table" aria-label="Itens aproveitados e jogados fora por mês">
          {months.map((m) => {
            const desc = `${m.label}: ${m.used} aproveitado(s), ${m.wasted} jogado(s) fora${m.wastedValue ? ` (${brl(m.wastedValue)})` : ""}`;
            return (
              <div key={m.key} className="bar-row" role="row" title={desc} aria-label={desc}>
                <span className="bar-label" role="cell">{m.label}</span>
                <div className="bar-track" role="cell">
                  {m.used > 0 && <div className="seg used" style={{ width: `${(m.used / max) * 100}%` }} />}
                  {m.wasted > 0 && <div className="seg waste" style={{ width: `${(m.wasted / max) * 100}%` }} />}
                </div>
                <span className="bar-value small" role="cell">
                  {m.used + m.wasted === 0 ? <span className="muted">—</span> : <>{m.used} · <b>{m.wasted}</b></>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <h2>O que mais estraga <span className="small muted">(90 dias)</span></h2>
      {top.length === 0 ? (
        <div className="muted small">Nada jogado fora nos últimos 90 dias.</div>
      ) : (
        <>
          {totalValue90 > 0 && <div className="small muted">Total com preço conhecido: <b>{brl(totalValue90)}</b></div>}
          <div className="list">
            {top.slice(0, 8).map((t) => (
              <div key={t.name} className="item" style={{ alignItems: "flex-start" }}>
                <CategoryIcon category={t.category} />
                <div className="body">
                  <div className="row"><span className="title" style={{ flex: 1 }}>{t.name}</span><span className="badge urgente">{t.count}x</span></div>
                  <div className="small muted">Última vez: {formatBR(t.lastDate)}{t.value > 0 && <> · {brl(t.value)}</>}</div>
                  <div className="small icon-label" style={{ marginTop: 6, alignItems: "flex-start" }}><Lightbulb size={14} style={{ marginTop: 2 }} /><span>{tipFor(t)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {cats.length > 1 && (
        <div className="card">
          <b>Por categoria</b>
          <div className="bars">
            {cats.map((c) => (
              <div key={c.category} className="bar-row" title={`${categoryInfo(c.category).label}: ${c.count}`}>
                <span className="bar-label wide">{categoryInfo(c.category).label}</span>
                <div className="bar-track"><div className="seg waste" style={{ width: `${(c.count / maxCat) * 100}%` }} /></div>
                <span className="bar-value small">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="small muted">Para ver o valor em R$, o item precisa ter preço — vem automático da foto da nota, ou preencha ao cadastrar.</p>
    </div>
  );
}

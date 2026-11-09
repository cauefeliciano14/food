import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { daysBetween, expiryStatus, today } from "../lib/dates";
import { rankRecipes } from "../lib/matching";
import type { FoodItem, Recipe } from "../lib/types";
import { ItemRow } from "../components/ItemRow";

export function Home({ go, openItem, openRecipe, openSettings }: {
  openSettings: () => void;
  go: (tab: "despensa" | "add" | "receitas", filter?: string) => void;
  openItem: (i: FoodItem) => void;
  openRecipe: (r: Recipe) => void;
}) {
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? [];
  const history = useLiveQuery(() => db.history.toArray(), []) ?? [];

  const ref = today();
  const expired = items.filter((i) => expiryStatus(i.expiryDate, ref) === "vencido");
  const soon = items
    .filter((i) => i.expiryDate && daysBetween(ref, i.expiryDate) >= 0 && daysBetween(ref, i.expiryDate) <= 3)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  const suggestions = useMemo(
    () => rankRecipes(recipes, items, ref).filter((m) => m.canMake || m.missing.length <= 1).slice(0, 3),
    [recipes, items, ref],
  );

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const recent = history.filter((h) => new Date(h.date) >= monthAgo);
  const wasted = recent.filter((h) => h.action === "descartado").length;
  const used = recent.filter((h) => h.action === "consumido").length;

  return (
    <>
      <header className="page-header">
        <h1>🥕 Despensa</h1>
        <button className="icon-btn" onClick={openSettings} aria-label="Ajustes">⚙️</button>
      </header>
      <div className="page">
        <div className="stats">
          <div className="stat" onClick={() => go("despensa")}><b>{items.length}</b><span className="small muted">itens</span></div>
          <div className="stat warn" onClick={() => go("despensa", "vencendo")}><b>{soon.length}</b><span className="small muted">vencem em 3 dias</span></div>
          <div className="stat alert" onClick={() => go("despensa", "vencidos")}><b>{expired.length}</b><span className="small muted">vencidos</span></div>
        </div>

        {items.length === 0 && (
          <div className="card empty" style={{ marginTop: 16 }}>
            <div className="big">🛒</div>
            <p>Sua despensa está vazia. Comece adicionando o que você tem em casa — ou tire foto da última nota do mercado.</p>
            <button className="btn primary" onClick={() => go("add")}>Adicionar comida</button>
          </div>
        )}

        {expired.length > 0 && (
          <>
            <h2>⚠️ Já venceu — confira</h2>
            <div className="list">{expired.map((i) => <ItemRow key={i.id} item={i} onClick={() => openItem(i)} />)}</div>
          </>
        )}

        {soon.length > 0 && (
          <>
            <h2>⏰ Use logo</h2>
            <div className="list">{soon.map((i) => <ItemRow key={i.id} item={i} onClick={() => openItem(i)} />)}</div>
          </>
        )}

        {items.length > 0 && (
          <>
            <div className="row" style={{ marginTop: 20 }}>
              <h2 style={{ margin: 0 }}>🍳 Dá pra fazer agora</h2>
              <span className="spacer" />
              <button className="btn ghost sm" onClick={() => go("receitas")}>Ver todas</button>
            </div>
            <div className="list" style={{ marginTop: 8 }}>
              {suggestions.length === 0 && <div className="muted small">Nenhuma receita do livro bate com o que você tem. Experimente “Sugerir com IA” em Receitas.</div>}
              {suggestions.map((m) => (
                <div key={m.recipe.id} className="item" onClick={() => openRecipe(m.recipe)} style={{ cursor: "pointer" }}>
                  <div className="emoji">{m.canMake ? "✅" : "🟡"}</div>
                  <div className="body">
                    <div className="title">{m.recipe.title}</div>
                    <div className="small muted">
                      {m.canMake ? "Você tem tudo" : `Falta: ${m.missing.map((x) => x.name).join(", ")}`}
                      {m.expiringUsed.length > 0 && ` · usa ${m.expiringUsed.length} item(ns) vencendo`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {recent.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <b>Últimos 30 dias</b>
            <div className="small muted" style={{ marginTop: 4 }}>
              {used} item(ns) aproveitado(s) · {wasted} jogado(s) fora
            </div>
            <div className="progress" style={{ marginTop: 8 }}>
              <div style={{ width: `${(used / Math.max(1, used + wasted)) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { rankRecipes } from "../lib/matching";
import { normalize } from "../lib/normalize";
import { today } from "../lib/dates";
import type { Recipe } from "../lib/types";

type Filter = "posso" | "quase" | "todas" | "favoritas" | "minhas";

export function Recipes({ openRecipe, onNew, onAI }: { openRecipe: (r: Recipe) => void; onNew: () => void; onAI: () => void }) {
  const [filter, setFilter] = useState<Filter>("posso");
  const [q, setQ] = useState("");
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? [];
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const ranked = useMemo(() => rankRecipes(recipes, items, today()), [recipes, items]);

  const nq = normalize(q);
  const shown = ranked.filter((m) => {
    const r = m.recipe;
    if (nq && !normalize(`${r.title} ${r.tags.join(" ")} ${r.ingredients.map((i) => i.name).join(" ")}`).includes(nq)) return false;
    switch (filter) {
      case "posso": return m.canMake;
      case "quase": return !m.canMake && m.missing.length <= 2;
      case "favoritas": return !!r.favorite;
      case "minhas": return r.source !== "padrao";
      default: return true;
    }
  });

  const counts = {
    posso: ranked.filter((m) => m.canMake).length,
    quase: ranked.filter((m) => !m.canMake && m.missing.length <= 2).length,
  };

  return (
    <>
      <header className="page-header">
        <h1>Receitas</h1>
        <div className="row">
          <button className="btn sm" onClick={onAI}>✨ IA</button>
          <button className="btn sm primary" onClick={onNew}>+ Nova</button>
        </div>
      </header>
      <div className="page stack">
        <input type="search" placeholder="Buscar receita ou ingrediente…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          {([
            ["posso", `✅ Posso fazer (${counts.posso})`],
            ["quase", `🟡 Falta pouco (${counts.quase})`],
            ["todas", `📖 Todas (${recipes.length})`],
            ["favoritas", "⭐ Favoritas"],
            ["minhas", "✍️ Minhas"],
          ] as [Filter, string][]).map(([v, label]) => (
            <button key={v} className={`chip ${filter === v ? "active" : ""}`} onClick={() => setFilter(v)}>{label}</button>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="empty">
            <div className="big">🍽️</div>
            <p>
              {filter === "posso" ? "Com o que tem agora, nenhuma receita do livro fecha 100%. Veja “Falta pouco” ou peça uma sugestão à IA." : "Nada por aqui."}
            </p>
          </div>
        ) : (
          <div className="list">
            {shown.map((m) => (
              <div key={m.recipe.id} className="item" onClick={() => openRecipe(m.recipe)} style={{ cursor: "pointer", alignItems: "stretch" }}>
                <div className="body stack" style={{ marginTop: 0 }}>
                  <div className="row">
                    <div className="title" style={{ flex: 1 }}>{m.recipe.favorite && "⭐ "}{m.recipe.title}</div>
                    <span className="small muted">⏱ {m.recipe.minutes} min</span>
                  </div>
                  <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${m.score * 100}%` }} /></div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {m.canMake ? "Você tem todos os ingredientes" : `Falta: ${m.missing.map((x) => x.name).join(", ")}`}
                    {m.expiringUsed.length > 0 && <> · <span style={{ color: "var(--warn)" }}>aproveita {m.expiringUsed.map((i) => i.name).join(", ")}</span></>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { today } from "../lib/dates";
import { rankRecipes } from "../lib/matching";
import type { FoodItem, Recipe } from "../lib/types";
import { ItemRow } from "../components/ItemRow";
import { RecipeCard } from "../components/RecipeCard";
import { IconTile } from "../components/icons";
import { KeyExpiryNote } from "../components/AiNetSettings";
import { loadSettings } from "../lib/settings";
import { ChartColumn, ChevronRight, CircleCheck, Moon, Plus, Settings, Sun, TriangleAlert } from "lucide-react";
import { daysLeft, effectiveDate, itemStatus } from "../lib/freshness";

export function Home({ go, openItem, openRecipe, openSettings, openWaste }: {
  openSettings: () => void;
  openWaste: () => void;
  go: (tab: "despensa" | "add" | "receitas", filter?: string) => void;
  openItem: (i: FoodItem) => void;
  openRecipe: (r: Recipe) => void;
}) {
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? [];
  const history = useLiveQuery(() => db.history.toArray(), []) ?? [];
  const todayMeals = useLiveQuery(async () => {
    const es = await db.mealPlan.where("date").equals(today()).toArray();
    const rs = await Promise.all(es.map((e) => db.recipes.get(e.recipeId)));
    return es.map((e, i) => ({ ...e, recipe: rs[i] })).filter((e) => e.recipe).sort((a, b) => a.slot.localeCompare(b.slot));
  }, []) ?? [];

  const ref = today();
  const expired = items.filter((i) => itemStatus(i, ref) === "vencido");
  const soon = items
    .filter((i) => { const d = daysLeft(i, ref); return d != null && d >= 0 && d <= 3; })
    .sort((a, b) => effectiveDate(a).localeCompare(effectiveDate(b)));

  const suggestions = useMemo(
    () => rankRecipes(recipes, items, ref).filter((m) => m.recipe.rating !== -1 && (m.canMake || m.missing.length <= 1)).slice(0, 6),
    [recipes, items, ref],
  );

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const recent = history.filter((h) => new Date(h.date) >= monthAgo);
  const wasted = recent.filter((h) => h.action === "descartado").length;
  const used = recent.filter((h) => h.action === "consumido").length;

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Boa noite" : hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const rawDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const dateLabel = rawDate[0].toUpperCase() + rawDate.slice(1);
  const attention = [...expired, ...soon];
  const tone = expired.length > 0 ? "alert" : soon.length > 0 ? "warn" : "";
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <h1>{greeting}</h1>
        </div>
        <button className="icon-btn" onClick={openSettings} aria-label="Ajustes"><Settings size={22} /></button>
      </header>
      <div className="page">
        <KeyExpiryNote s={loadSettings()} onOpen={openSettings} />
        <div className={`hero ${tone}`}>
          <div className="hero-title">
            {items.length === 0 ? <>Vamos começar</> : tone === "" ? <><CircleCheck size={22} /> Tudo em dia</> : <><TriangleAlert size={22} /> {plural(attention.length, "item pede", "itens pedem")} atenção</>}
          </div>
          <div className="hero-sub">
            {items.length === 0
              ? "Adicione o que você tem em casa para o app avisar antes de vencer."
              : tone === ""
                ? "Nada vence nos próximos 3 dias."
                : [expired.length ? plural(expired.length, "vencido", "vencidos") : "", soon.length ? `${plural(soon.length, "vence", "vencem")} em até 3 dias` : ""].filter(Boolean).join(" · ")}
          </div>
          {items.length === 0 ? (
            <button className="btn" style={{ marginTop: 14, color: "#1f5c3a", background: "#fff", border: "none" }} onClick={() => go("add")}><Plus size={18} />Adicionar comida</button>
          ) : (
            <div className="stats">
              <button className="stat" onClick={() => go("despensa")}><b>{items.length}</b><span>{items.length === 1 ? "item" : "itens"}</span></button>
              <button className="stat" onClick={() => go("despensa", "vencendo")}><b>{soon.length}</b><span>vencendo</span></button>
              <button className="stat" onClick={() => go("despensa", "vencidos")}><b>{expired.length}</b><span>{expired.length === 1 ? "vencido" : "vencidos"}</span></button>
            </div>
          )}
        </div>

        {todayMeals.length > 0 && (
          <>
            <div className="section-head"><h2>Hoje no cardápio</h2></div>
            <div className="list">
              {todayMeals.map((m) => (
                <button key={m.id} className="item" onClick={() => openRecipe(m.recipe!)}>
                  <IconTile icon={m.slot === "almoco" ? Sun : Moon} hue={m.slot === "almoco" ? 45 : 250} />
                  <div className="body"><div className="title">{m.recipe!.title}</div><div className="meta">{m.slot === "almoco" ? "Almoço" : "Jantar"}</div></div>
                  <ChevronRight size={18} className="muted" />
                </button>
              ))}
            </div>
          </>
        )}

        {attention.length > 0 && (
          <>
            <div className="section-head"><h2>Use logo</h2><span className="count-pill">{attention.length}</span></div>
            <div className="list">{attention.map((i) => <ItemRow key={i.id} item={i} swipe onClick={() => openItem(i)} />)}</div>
          </>
        )}

        {items.length > 0 && (
          <>
            <div className="section-head">
              <h2>Dá pra fazer agora</h2>
              <button className="btn ghost sm" onClick={() => go("receitas")}>Ver todas<ChevronRight size={16} /></button>
            </div>
            {suggestions.length === 0 ? (
              <div className="muted small">Nenhuma receita do livro bate com o que você tem. Adicione mais itens ou crie uma receita.</div>
            ) : (
              <div className="hscroll">{suggestions.map((m) => <RecipeCard key={m.recipe.id} match={m} onClick={() => openRecipe(m.recipe)} />)}</div>
            )}
          </>
        )}

        {recent.length > 0 && (
          <button className="card" style={{ marginTop: 20, cursor: "pointer", width: "100%", textAlign: "left" }} onClick={openWaste}>
            <div className="row"><IconTile icon={ChartColumn} size={36} /><div style={{ flex: 1 }}><b>Últimos 30 dias</b>
              <div className="small muted">{plural(used, "aproveitado", "aproveitados")} · {plural(wasted, "jogado fora", "jogados fora")}</div></div>
              <ChevronRight size={18} className="muted" /></div>
            <div className="progress" style={{ marginTop: 10 }}>
              <div style={{ width: `${(used / Math.max(1, used + wasted)) * 100}%` }} />
            </div>
          </button>
        )}
      </div>
    </>
  );
}

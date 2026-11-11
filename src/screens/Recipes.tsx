import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { rankRecipes } from "../lib/matching";
import { normalize } from "../lib/normalize";
import { today } from "../lib/dates";
import type { Recipe } from "../lib/types";
import { Planner } from "../components/Planner";
import { BookOpen, CalendarDays, Plus, Search, Sparkles, UtensilsCrossed } from "lucide-react";
import { RecipeCard } from "../components/RecipeCard";
import { matchesKind, RECIPE_KINDS, RECIPE_SORTS, sortMatches, type RecipeSort } from "../lib/recipeFilters";
import { EmptyState } from "../components/icons";

type Filter = "posso" | "quase" | "todas" | "favoritas" | "minhas";

const VIEW_KEY = "despensa:recipesView";
const PREFS_KEY = "despensa:recipesPrefs";
interface Prefs { filter: Filter; kind: string; sort: RecipeSort }
function loadPrefs(): Prefs {
  const d: Prefs = { filter: "posso", kind: "", sort: "sugestao" };
  try {
    return { ...d, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return d;
  }
}
function savePrefs(p: Prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
function loadView(): "livro" | "semana" {
  try {
    return localStorage.getItem(VIEW_KEY) === "semana" ? "semana" : "livro";
  } catch {
    return "livro";
  }
}

export function Recipes({ openRecipe, onNew, onAI, openShopping }: { openRecipe: (r: Recipe) => void; onNew: () => void; onAI: () => void; openShopping: () => void }) {
  const [view, setViewState] = useState(loadView);
  const setView = (v: "livro" | "semana") => {
    setViewState(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ }
  };
  const prefs = loadPrefs();
  const [filter, setFilterState] = useState<Filter>(prefs.filter);
  const [kind, setKindState] = useState(prefs.kind);
  const [sort, setSortState] = useState<RecipeSort>(prefs.sort);
  const persist = (p: Partial<Prefs>) => savePrefs({ filter, kind, sort, ...p });
  const setFilter = (v: Filter) => { setFilterState(v); persist({ filter: v }); };
  const setKind = (v: string) => { setKindState(v); persist({ kind: v }); };
  const setSort = (v: RecipeSort) => { setSortState(v); persist({ sort: v }); };
  const [q, setQ] = useState("");
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? [];
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  // Your own recipes (typed, from photos, from the AI) always come before the app's built-in ones.
  const ranked = useMemo(
    () => rankRecipes(recipes, items, today()).sort((a, b) => Number(a.recipe.source === "padrao") - Number(b.recipe.source === "padrao")),
    [recipes, items],
  );

  const nq = normalize(q);
  const shown = sortMatches(ranked.filter((m) => {
    const r = m.recipe;
    if (!matchesKind(r, kind)) return false;
    if (nq && !normalize(`${r.title} ${r.tags.join(" ")} ${r.ingredients.map((i) => i.name).join(" ")}`).includes(nq)) return false;
    switch (filter) {
      case "posso": return m.canMake;
      case "quase": return !m.canMake && m.missing.length <= 2;
      case "favoritas": return !!r.favorite;
      case "minhas": return r.source !== "padrao";
      default: return true;
    }
  }), sort);

  const counts = {
    posso: ranked.filter((m) => m.canMake).length,
    quase: ranked.filter((m) => !m.canMake && m.missing.length <= 2).length,
  };

  return (
    <>
      <header className="page-header">
        <h1>Receitas</h1>
        <div className="row">
          <button className="btn sm" onClick={onAI}><Sparkles size={16} />IA</button>
          <button className="btn sm primary" onClick={onNew}><Plus size={16} />Nova</button>
        </div>
      </header>
      <div className="page stack">
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={view === "livro"} className={view === "livro" ? "active" : ""} onClick={() => setView("livro")}><BookOpen size={16} />Livro</button>
          <button role="tab" aria-selected={view === "semana"} className={view === "semana" ? "active" : ""} onClick={() => setView("semana")}><CalendarDays size={16} />Semana</button>
        </div>
        {view === "semana" ? <Planner openRecipe={openRecipe} openShopping={openShopping} /> : <>
        <div className="search"><Search size={18} /><input type="search" placeholder="Buscar receita ou ingrediente…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="chips">
          {([
            ["posso", `Posso fazer (${counts.posso})`],
            ["quase", `Falta pouco (${counts.quase})`],
            ["todas", `Todas (${recipes.length})`],
            ["favoritas", "Favoritas"],
            ["minhas", "Minhas"],
          ] as [Filter, string][]).map(([v, label]) => (
            <button key={v} className={`chip ${filter === v ? "active" : ""}`} onClick={() => setFilter(v)}>{label}</button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Tipo de prato">
          {RECIPE_KINDS.map((k) => (
            <button key={k.value} className={`chip ${kind === k.value ? "active" : ""}`} aria-pressed={kind === k.value} onClick={() => setKind(k.value)}>{k.label}</button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="small muted">{shown.length} {shown.length === 1 ? "receita" : "receitas"}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as RecipeSort)} aria-label="Ordenar receitas"
            style={{ width: "auto", minHeight: 40, borderRadius: 99, fontWeight: 600, fontSize: "0.88rem" }}>
            {RECIPE_SORTS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
        {shown.length === 0 ? (
          <EmptyState icon={UtensilsCrossed}>
            <p>
              {filter === "posso" ? "Com o que tem agora, nenhuma receita do livro fecha 100%. Veja “Falta pouco”." : "Nada por aqui."}
            </p>
          </EmptyState>
        ) : (
          <div className="rgrid">
            {shown.map((m) => <RecipeCard key={m.recipe.id} match={m} onClick={() => openRecipe(m.recipe)} />)}
          </div>
        )}
        </>}
      </div>
    </>
  );
}

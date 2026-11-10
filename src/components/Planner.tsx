import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { autoFill, dayLabel, weekDays, weekShoppingNeeds, weekStart } from "../lib/mealplan";
import { addToShopping } from "../lib/shopping";
import { rankRecipes, matchRecipe } from "../lib/matching";
import { addDays, today } from "../lib/dates";
import { normalize } from "../lib/normalize";
import { MEAL_SLOTS, type MealSlot, type Recipe } from "../lib/types";
import { Sheet } from "./Sheet";
import { ChevronLeft, ChevronRight, Plus, Search, ShoppingCart, Sparkles, X } from "lucide-react";
import { IconTile, MealIcon, dishStyle } from "./icons";

export function Planner({ openRecipe, openShopping }: { openRecipe: (r: Recipe) => void; openShopping: () => void }) {
  const ref = today();
  const [start, setStart] = useState(weekStart(ref));
  const [picking, setPicking] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [toast, setToast] = useState<{ text: string; shopping?: boolean } | null>(null);
  const days = weekDays(start);
  const end = days[6];

  const entries = useLiveQuery(() => db.mealPlan.where("date").between(start, end, true, true).toArray(), [start, end]) ?? [];
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? [];
  const pantry = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const byId = useMemo(() => new Map(recipes.map((r) => [r.id!, r])), [recipes]);

  const future = entries.filter((e) => e.date >= ref);
  const needs = useMemo(() => weekShoppingNeeds(future, recipes, pantry, ref), [future, recipes, pantry, ref]);
  const emptyFutureSlots = days.filter((d) => d >= ref).length * MEAL_SLOTS.length - future.length;

  function flash(text: string, shopping = false) {
    setToast({ text, shopping });
    setTimeout(() => setToast(null), 4000);
  }

  async function fill() {
    const add = autoFill(days, MEAL_SLOTS.map((s) => s.value), entries, recipes, pantry, ref);
    await db.mealPlan.bulkAdd(add);
    flash(add.length ? `${add.length} refeição(ões) planejada(s) — priorizando o que você já tem e o que vence antes.` : "Não há receitas suficientes no livro para preencher.");
  }

  async function makeList() {
    for (const n of needs) {
      for (const r of n.recipes) await addToShopping(n.name, { amount: n.amount, source: "receita", recipe: r });
    }
    flash(`${needs.length} ingrediente(s) na lista de compras.`, true);
  }

  return (
    <div className="stack">
      <div className="row">
        <button className="icon-btn" aria-label="Semana anterior" onClick={() => setStart(addDays(start, -7))}><ChevronLeft size={22} /></button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <b>{start === weekStart(ref) ? "Esta semana" : `Semana de ${dayLabel(start).slice(4)}`}</b>
          <div className="small muted">{dayLabel(start).slice(4)} a {dayLabel(end).slice(4)}</div>
        </div>
        <button className="icon-btn" aria-label="Próxima semana" onClick={() => setStart(addDays(start, 7))}><ChevronRight size={22} /></button>
      </div>

      <div className="grid-2">
        <button className="btn" onClick={fill} disabled={emptyFutureSlots <= 0}><Sparkles size={16} />Preencher vazios</button>
        <button className="btn primary" onClick={makeList} disabled={needs.length === 0}><ShoppingCart size={16} />Lista da semana{needs.length ? ` (${needs.length})` : ""}</button>
      </div>
      {toast && (
        <div className="notice small row">
          <span style={{ flex: 1 }}>{toast.text}</span>
          {toast.shopping && <button className="btn sm" onClick={openShopping}>Ver</button>}
        </div>
      )}

      <div className="list">
        {days.map((d) => {
          const past = d < ref;
          return (
            <div key={d} className={`card day ${d === ref ? "today" : ""} ${past ? "past" : ""}`}>
              <div className="row small"><b>{dayLabel(d)}</b>{d === ref && <span className="badge ok">hoje</span>}</div>
              {MEAL_SLOTS.map((slot) => {
                const e = entries.find((x) => x.date === d && x.slot === slot.value);
                const r = e ? byId.get(e.recipeId) : undefined;
                const missing = r && !past ? matchRecipe(r, pantry, d).missing.length : 0;
                return (
                  <div key={slot.value} className="meal">
                    <span className="meal-slot small muted"><MealIcon slot={slot.value} />{slot.label}</span>
                    {e ? (
                      <>
                        <button className="meal-recipe" onClick={() => r && openRecipe(r)}>
                          {r ? r.title : <span className="muted">(receita excluída)</span>}
                          {r && !past && (missing ? <span className="small" style={{ color: "var(--warn)" }}> · falta {missing}</span> : <span className="small" style={{ color: "var(--primary)" }}> · tem tudo</span>)}
                        </button>
                        <button className="icon-btn" aria-label="Remover do cardápio" onClick={() => db.mealPlan.delete(e.id!)}><X size={18} /></button>
                      </>
                    ) : past ? (
                      <span className="muted small" style={{ flex: 1 }}>—</span>
                    ) : (
                      <button className="btn ghost sm meal-add" onClick={() => setPicking({ date: d, slot: slot.value })}><Plus size={14} />escolher</button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="small muted">A lista da semana confere se você <i>tem</i> cada ingrediente no dia da refeição (o que vencer antes conta como faltando), mas não soma quantidades entre receitas.</p>

      {picking && (
        <Sheet title={`${MEAL_SLOTS.find((s) => s.value === picking.slot)!.label} · ${dayLabel(picking.date)}`} onClose={() => setPicking(null)}>
          <RecipePicker
            date={picking.date}
            onPick={async (r) => {
              await db.mealPlan.add({ date: picking.date, slot: picking.slot, recipeId: r.id! });
              setPicking(null);
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

function RecipePicker({ date, onPick }: { date: string; onPick: (r: Recipe) => void }) {
  const [q, setQ] = useState("");
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? [];
  const pantry = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const ranked = useMemo(() => rankRecipes(recipes, pantry, date), [recipes, pantry, date]);
  const nq = normalize(q);
  const shown = ranked.filter((m) => !nq || normalize(m.recipe.title).includes(nq));
  return (
    <div className="stack">
      <div className="search"><Search size={18} /><input type="search" placeholder="Buscar receita…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="list">
        {shown.map((m) => (
          <button key={m.recipe.id} className="item" style={{ textAlign: "left", cursor: "pointer", width: "100%" }} onClick={() => onPick(m.recipe)}>
            <IconTile icon={dishStyle(m.recipe).icon} hue={dishStyle(m.recipe).hue} />
            <div className="body">
              <div className="title">{m.recipe.title}</div>
              <div className="meta">{m.canMake ? <span style={{ color: "var(--primary)", fontWeight: 700 }}>Tem tudo</span> : `Falta: ${m.missing.map((x) => x.name).join(", ")}`}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

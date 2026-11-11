import { useMemo, useState, type CSSProperties } from "react";
import { useBack } from "../lib/back";
import { useLiveQuery } from "dexie-react-hooks";
import { db, consumeItem } from "../lib/db";
import { addToShopping } from "../lib/shopping";
import { matchRecipe } from "../lib/matching";
import { today } from "../lib/dates";
import { MEAL_SLOTS, type FoodItem, type MealSlot, type Recipe } from "../lib/types";
import { addDays } from "../lib/dates";
import { dayLabel } from "../lib/mealplan";
import { ExpiryBadge, fmtQty } from "./ItemRow";
import { RecipeForm } from "./RecipeForm";
import { CalendarDays, Check, ChefHat, Clock, Minus, Pencil, ShoppingCart, Star, ThumbsDown, ThumbsUp, Users, X } from "lucide-react";
import { dishStyle } from "./icons";
import { DishPhoto } from "./DishPhoto";

export function RecipeDetail({ recipe: initial, onDone, onOpenShopping }: { recipe: Recipe; onDone: () => void; onOpenShopping: () => void }) {
  const recipe = useLiveQuery(() => db.recipes.get(initial.id!), [initial.id]) ?? initial;
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const m = useMemo(() => matchRecipe(recipe, items, today()), [recipe, items]);
  const [mode, setMode] = useState<"view" | "edit" | "cook" | "rate">("view");
  const [usedUp, setUsedUp] = useState<Set<number>>(new Set());
  const [addedToList, setAddedToList] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [planDate, setPlanDate] = useState(today());
  const [planSlot, setPlanSlot] = useState<MealSlot>("jantar");
  const [planned, setPlanned] = useState("");

  const dish = dishStyle(recipe);
  useBack(mode !== "view", () => setMode("view"));
  if (mode === "edit") return <RecipeForm recipe={recipe} onDone={() => setMode("view")} />;

  const matchedItems: FoodItem[] = [];
  for (const ing of m.ingredients) for (const it of ing.items) if (!matchedItems.some((x) => x.id === it.id)) matchedItems.push(it);

  if (mode === "rate") {
    const rate = async (v?: 1 | -1) => {
      if (v) await db.recipes.update(recipe.id!, { rating: v });
      onDone();
    };
    return (
      <div className="stack" style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.15rem", fontWeight: 700, margin: "8px 0" }}>Como ficou?</p>
        <p className="small muted" style={{ margin: 0 }}>As receitas que você gosta aparecem antes nas sugestões; as que não gostou vão para o fim.</p>
        <div className="grid-2">
          <button className="btn primary" style={{ minHeight: 56 }} onClick={() => rate(1)}><ThumbsUp size={20} />Gostei</button>
          <button className="btn" style={{ minHeight: 56 }} onClick={() => rate(-1)}><ThumbsDown size={20} />Não gostei</button>
        </div>
        <button className="btn ghost block" onClick={() => rate()}>Pular</button>
      </div>
    );
  }

  if (mode === "cook") {
    return (
      <div className="stack">
        <p className="small muted">Bom apetite! Marque o que <b>acabou</b> para tirar da despensa. Se sobrou parte, ajuste a quantidade direto no item depois.</p>
        <div className="list">
          {matchedItems.map((it) => (
            <label key={it.id} className="item" style={{ cursor: "pointer" }}>
              <input type="checkbox" style={{ width: 22, height: 22 }} checked={usedUp.has(it.id!)}
                onChange={(e) => {
                  const s = new Set(usedUp);
                  if (e.target.checked) s.add(it.id!); else s.delete(it.id!);
                  setUsedUp(s);
                }} />
              <div className="body"><div className="title">{it.name}</div><div className="small muted">{fmtQty(it.quantity, it.unit)}</div></div>
              <ExpiryBadge date={it.expiryDate} />
            </label>
          ))}
        </div>
        <button className="btn primary block" onClick={async () => {
          for (const it of matchedItems) if (usedUp.has(it.id!)) await consumeItem(it, it.quantity, "consumido");
          setMode("rate");
        }}>Concluir</button>
      </div>
    );
  }

  return (
    <div className="stack">
      {recipe.photo
        ? <img className="recipe-photo" src={recipe.photo} alt={`Foto de ${recipe.title}`} />
        : <div className="recipe-hero" style={{ "--h": dish.hue } as CSSProperties}><dish.icon size={52} strokeWidth={1.4} aria-hidden="true" /></div>}
      <DishPhoto recipe={recipe} />
      <div className="row wrap small muted">
        <span className="icon-label"><Clock size={14} />{recipe.minutes} min</span>·<span className="icon-label"><Users size={14} />{recipe.servings} {recipe.servings === 1 ? "porção" : "porções"}</span>
        {recipe.tags.map((t) => <span key={t} className="badge sem-data">{t}</span>)}
      </div>

      <div className="card">
        <div className="row"><b>Ingredientes</b><span className="spacer" /><span className="small muted">{m.haveCount}/{m.requiredCount} em casa</span></div>
        {m.ingredients.map((ing, idx) => (
          <div key={idx} className="ing">
            <span className={`mark ${ing.items.length ? "have" : ing.staple || ing.optional ? "opt" : "miss"}`}>{ing.items.length ? <Check size={14} strokeWidth={3} /> : ing.staple || ing.optional ? <Minus size={14} /> : <X size={14} strokeWidth={3} />}</span>
            <div style={{ flex: 1 }}>
              {ing.name}{ing.amount && <span className="muted"> — {ing.amount}</span>}
              {ing.optional && <span className="muted small"> (opcional)</span>}
              {ing.items.length > 0 && (
                <div className="small muted">
                  {ing.items.map((it) => `${it.name} (${fmtQty(it.quantity, it.unit)})`).join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {m.missing.length > 0 && (
        <div className="notice small stack">
          <div>Para fazer, falta: <b>{m.missing.map((x) => x.name).join(", ")}</b></div>
          {addedToList ? (
            <button className="btn sm block" onClick={onOpenShopping}><Check size={16} />Na lista — ver compras</button>
          ) : (
            <button className="btn sm block" onClick={async () => {
              for (const x of m.missing) await addToShopping(x.name, { amount: x.amount, source: "receita", recipe: recipe.title });
              setAddedToList(true);
            }}><ShoppingCart size={16} />Adicionar o que falta à lista</button>
          )}
        </div>
      )}

      <div className="card">
        <b>Modo de preparo</b>
        <ol className="steps">{recipe.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>

      {matchedItems.length > 0 && <button className="btn primary block" onClick={() => setMode("cook")}><ChefHat size={18} />Cozinhei esta receita</button>}
      {planning ? (
        <div className="card stack">
          <b>Planejar</b>
          <div className="grid-2">
            <select value={planDate} onChange={(e) => setPlanDate(e.target.value)} aria-label="Dia">
              {Array.from({ length: 14 }, (_, i) => addDays(today(), i)).map((d, i) => (
                <option key={d} value={d}>{i === 0 ? "Hoje" : i === 1 ? "Amanhã" : dayLabel(d)}</option>
              ))}
            </select>
            <select value={planSlot} onChange={(e) => setPlanSlot(e.target.value as MealSlot)} aria-label="Refeição">
              {MEAL_SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button className="btn primary" onClick={async () => {
            const existing = await db.mealPlan.where("[date+slot]").equals([planDate, planSlot]).first();
            if (existing) await db.mealPlan.update(existing.id!, { recipeId: recipe.id! });
            else await db.mealPlan.add({ date: planDate, slot: planSlot, recipeId: recipe.id! });
            setPlanned(`${MEAL_SLOTS.find((s) => s.value === planSlot)!.label} de ${dayLabel(planDate)}`);
            setPlanning(false);
          }}>Colocar no cardápio</button>
        </div>
      ) : (
        <button className="btn block" onClick={() => setPlanning(true)}>{planned ? <><Check size={18} />No cardápio: {planned}</> : <><CalendarDays size={18} />Planejar para um dia</>}</button>
      )}
      <div className="grid-2" role="group" aria-label="Avaliação">
        <button className={`btn ${recipe.rating === 1 ? "primary" : ""}`} aria-pressed={recipe.rating === 1}
          onClick={() => db.recipes.update(recipe.id!, { rating: recipe.rating === 1 ? undefined : 1 })}><ThumbsUp size={18} />Gostei</button>
        <button className={`btn ${recipe.rating === -1 ? "danger" : ""}`} aria-pressed={recipe.rating === -1}
          onClick={() => db.recipes.update(recipe.id!, { rating: recipe.rating === -1 ? undefined : -1 })}><ThumbsDown size={18} />Não gostei</button>
      </div>
      <div className="grid-2">
        <button className="btn" onClick={() => db.recipes.update(recipe.id!, { favorite: !recipe.favorite })}><Star size={18} fill={recipe.favorite ? "currentColor" : "none"} />{recipe.favorite ? "Favorita" : "Favoritar"}</button>
        <button className="btn" onClick={() => setMode("edit")}><Pencil size={18} />Editar</button>
      </div>
      <button className="btn danger ghost block" onClick={async () => {
        if (!confirm(`Excluir a receita "${recipe.title}"?`)) return;
        await db.transaction("rw", db.recipes, db.mealPlan, async () => {
          await db.recipes.delete(recipe.id!);
          await db.mealPlan.where("recipeId").equals(recipe.id!).delete();
        });
        onDone();
      }}>Excluir receita</button>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, consumeItem } from "../lib/db";
import { addToShopping } from "../lib/shopping";
import { matchRecipe } from "../lib/matching";
import { today } from "../lib/dates";
import type { FoodItem, Recipe } from "../lib/types";
import { ExpiryBadge, fmtQty } from "./ItemRow";
import { RecipeForm } from "./RecipeForm";

export function RecipeDetail({ recipe: initial, onDone, onOpenShopping }: { recipe: Recipe; onDone: () => void; onOpenShopping: () => void }) {
  const recipe = useLiveQuery(() => db.recipes.get(initial.id!), [initial.id]) ?? initial;
  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const m = useMemo(() => matchRecipe(recipe, items, today()), [recipe, items]);
  const [mode, setMode] = useState<"view" | "edit" | "cook">("view");
  const [usedUp, setUsedUp] = useState<Set<number>>(new Set());
  const [addedToList, setAddedToList] = useState(false);

  if (mode === "edit") return <RecipeForm recipe={recipe} onDone={() => setMode("view")} />;

  const matchedItems: FoodItem[] = [];
  for (const ing of m.ingredients) for (const it of ing.items) if (!matchedItems.some((x) => x.id === it.id)) matchedItems.push(it);

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
          onDone();
        }}>Concluir</button>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row wrap small muted">
        <span>⏱ {recipe.minutes} min</span>·<span>🍽 {recipe.servings} porções</span>
        {recipe.tags.map((t) => <span key={t} className="badge sem-data">{t}</span>)}
      </div>

      <div className="card">
        <div className="row"><b>Ingredientes</b><span className="spacer" /><span className="small muted">{m.haveCount}/{m.requiredCount} em casa</span></div>
        {m.ingredients.map((ing, idx) => (
          <div key={idx} className="ing">
            <span className="mark">{ing.items.length ? "✅" : ing.staple ? "🧂" : ing.optional ? "➖" : "❌"}</span>
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
          <div>🛒 Para fazer, falta: <b>{m.missing.map((x) => x.name).join(", ")}</b></div>
          {addedToList ? (
            <button className="btn sm block" onClick={onOpenShopping}>✔ Na lista — ver compras</button>
          ) : (
            <button className="btn sm block" onClick={async () => {
              for (const x of m.missing) await addToShopping(x.name, { amount: x.amount, source: "receita", recipe: recipe.title });
              setAddedToList(true);
            }}>Adicionar o que falta à lista de compras</button>
          )}
        </div>
      )}

      <div className="card">
        <b>Modo de preparo</b>
        <ol className="steps">{recipe.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>

      {matchedItems.length > 0 && <button className="btn primary block" onClick={() => setMode("cook")}>👩‍🍳 Cozinhei esta receita</button>}
      <div className="grid-2">
        <button className="btn" onClick={() => db.recipes.update(recipe.id!, { favorite: !recipe.favorite })}>{recipe.favorite ? "★ Favorita" : "☆ Favoritar"}</button>
        <button className="btn" onClick={() => setMode("edit")}>✏️ Editar</button>
      </div>
      <button className="btn danger ghost block" onClick={async () => {
        if (!confirm(`Excluir a receita "${recipe.title}"?`)) return;
        await db.recipes.delete(recipe.id!);
        onDone();
      }}>Excluir receita</button>
    </div>
  );
}

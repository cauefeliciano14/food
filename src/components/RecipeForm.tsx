import { useState } from "react";
import { db } from "../lib/db";
import type { Recipe, RecipeIngredient } from "../lib/types";

/** "2 xícaras de arroz" style is hard to parse; we use "ingrediente - quantidade" per line, "?" prefix = opcional. */
export function ingredientsToText(ings: RecipeIngredient[]) {
  return ings.map((i) => `${i.optional ? "? " : ""}${i.name}${i.amount ? ` - ${i.amount}` : ""}`).join("\n");
}

export function textToIngredients(text: string): RecipeIngredient[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const optional = l.startsWith("?");
      const body = optional ? l.slice(1).trim() : l;
      const [name, ...rest] = body.split(/\s+-\s+/);
      const amount = rest.join(" - ").trim();
      return { name: name.trim(), ...(amount ? { amount } : {}), ...(optional ? { optional } : {}) };
    });
}

export function RecipeForm({ recipe, initial, onDone }: { recipe?: Recipe; initial?: Partial<Recipe>; onDone: (id?: number) => void }) {
  const base = recipe ?? initial;
  const [title, setTitle] = useState(base?.title ?? "");
  const [minutes, setMinutes] = useState(String(base?.minutes ?? 30));
  const [servings, setServings] = useState(String(base?.servings ?? 2));
  const [ings, setIngs] = useState(ingredientsToText(base?.ingredients ?? []));
  const [steps, setSteps] = useState((base?.steps ?? []).join("\n"));
  const [tags, setTags] = useState((base?.tags ?? []).join(", "));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      title: title.trim(),
      minutes: Number(minutes) || 0,
      servings: Number(servings) || 1,
      ingredients: textToIngredients(ings),
      steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (!data.title) return;
    if (recipe?.id != null) {
      await db.recipes.update(recipe.id, data);
      onDone(recipe.id);
    } else {
      const id = await db.recipes.add({ ...data, source: initial?.source ?? "minha", createdAt: Date.now() });
      onDone(id);
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <label className="field"><span>Nome da receita</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
      <div className="grid-2">
        <label className="field"><span>Tempo (min)</span><input type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
        <label className="field"><span>Porções</span><input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} /></label>
      </div>
      <label className="field">
        <span>Ingredientes — um por linha, “nome - quantidade”. Comece com “?” se for opcional.</span>
        <textarea rows={7} value={ings} onChange={(e) => setIngs(e.target.value)} placeholder={"arroz - 2 xícaras\ncebola - 1\n? queijo ralado - a gosto"} />
      </label>
      <label className="field">
        <span>Modo de preparo — um passo por linha</span>
        <textarea rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} />
      </label>
      <label className="field"><span>Etiquetas (separadas por vírgula)</span><input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="rápido, vegetariano" /></label>
      <button className="btn primary block" type="submit">Salvar receita</button>
    </form>
  );
}

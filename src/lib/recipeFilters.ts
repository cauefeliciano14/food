import type { RecipeMatch } from "./matching";
import type { Recipe } from "./types";
import { normalize } from "./normalize";

export type RecipeSort = "sugestao" | "az" | "rapidas" | "recentes" | "favoritas";

export const RECIPE_SORTS: [RecipeSort, string][] = [
  ["sugestao", "Sugestão do app"],
  ["az", "Nome (A–Z)"],
  ["rapidas", "Mais rápidas"],
  ["favoritas", "Favoritas primeiro"],
  ["recentes", "Mais recentes"],
];

/** Dish types for the second row of filters. */
export const RECIPE_KINDS: { value: string; label: string; tags: string[]; maxMinutes?: number }[] = [
  { value: "", label: "Todos os tipos", tags: [] },
  { value: "salgado", label: "Salgados", tags: ["salgado", "proteina", "massa", "acompanhamento", "basico"] },
  { value: "doce", label: "Doces", tags: ["doce", "sobremesa"] },
  { value: "rapido", label: "Até 20 min", tags: ["rapido"], maxMinutes: 20 },
  { value: "proteina", label: "Carnes e peixes", tags: ["proteina"] },
  { value: "massa", label: "Massas", tags: ["massa"] },
  { value: "vegetariano", label: "Vegetarianas", tags: ["vegetariano"] },
  { value: "salada", label: "Saladas e leves", tags: ["salada", "leve"] },
  { value: "acompanhamento", label: "Acompanhamentos", tags: ["acompanhamento", "basico"] },
  { value: "lanche", label: "Lanches", tags: ["lanche", "cafe da manha"] },
  { value: "forno", label: "Forno", tags: ["forno"] },
  { value: "air fryer", label: "Air fryer", tags: ["air fryer"] },
  { value: "panela de pressao", label: "Panela de pressão", tags: ["panela de pressao"] },
];

export function matchesKind(r: Recipe, kind: string): boolean {
  const k = RECIPE_KINDS.find((x) => x.value === kind);
  if (!k || !k.value) return true;
  if (k.maxMinutes != null && r.minutes > 0 && r.minutes <= k.maxMinutes) return true;
  const tags = r.tags.map(normalize);
  return k.tags.some((t) => tags.includes(t));
}

/** Sorts a copy. "sugestao" keeps the app's ranking (your recipes first, what you can make, what uses expiring food). */
export function sortMatches(list: RecipeMatch[], sort: RecipeSort): RecipeMatch[] {
  const out = [...list];
  const byTitle = (a: RecipeMatch, b: RecipeMatch) => a.recipe.title.localeCompare(b.recipe.title, "pt-BR");
  switch (sort) {
    case "az": return out.sort(byTitle);
    case "rapidas": return out.sort((a, b) => (a.recipe.minutes || 999) - (b.recipe.minutes || 999) || byTitle(a, b));
    case "recentes": return out.sort((a, b) => b.recipe.createdAt - a.recipe.createdAt || (b.recipe.id ?? 0) - (a.recipe.id ?? 0));
    case "favoritas": return out.sort((a, b) => Number(!!b.recipe.favorite) - Number(!!a.recipe.favorite));
    default: return out;
  }
}

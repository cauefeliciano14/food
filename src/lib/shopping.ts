import { db } from "./db";
import { normalize, tokens, canonical, itemMatchesIngredient } from "./normalize";
import { daysBetween, today } from "./dates";
import type { Category, FoodItem, HistoryEntry, ShoppingItem, ShoppingSource } from "./types";

/** Same product? Compares the main word, so "Cebola" ≈ "cebolas" ≈ "cebola roxa". */
export function sameProduct(a: string, b: string): boolean {
  if (normalize(a) === normalize(b)) return true;
  return itemMatchesIngredient(a, b) || itemMatchesIngredient(b, a);
}

/** Pantry items that already cover this shopping entry (non-expired, quantity > 0). */
export function pantryHas(name: string, pantry: FoodItem[], ref = today()): FoodItem[] {
  return pantry.filter(
    (p) => p.quantity > 0 && (!p.expiryDate || daysBetween(ref, p.expiryDate) >= 0) && itemMatchesIngredient(p.name, name),
  );
}

/**
 * Add to the shopping list unless an open entry for the same product exists;
 * in that case just attach the recipe name to it.
 */
export async function addToShopping(name: string, opts: { amount?: string; source?: ShoppingSource; recipe?: string } = {}) {
  const clean = name.trim();
  if (!clean) return;
  const open = await db.shopping.filter((s) => !s.done).toArray();
  const existing = open.find((s) => sameProduct(s.name, clean));
  if (existing) {
    if (opts.recipe && !existing.recipes?.includes(opts.recipe)) {
      await db.shopping.update(existing.id!, { recipes: [...(existing.recipes ?? []), opts.recipe] });
    }
    return existing.id;
  }
  return db.shopping.add({
    name: clean[0].toUpperCase() + clean.slice(1),
    amount: opts.amount,
    done: false,
    source: opts.source ?? "manual",
    recipes: opts.recipe ? [opts.recipe] : undefined,
    createdAt: Date.now(),
  });
}

/**
 * Things you used up recently (last 21 days) and don't have anymore —
 * the "you probably want to buy this again" suggestions.
 */
export function finishedSuggestions(history: HistoryEntry[], pantry: FoodItem[], list: ShoppingItem[], ref = today()) {
  const seen = new Set<string>();
  const out: { name: string; category: Category }[] = [];
  const recent = [...history].filter((h) => daysBetween(h.date, ref) <= 21).reverse();
  for (const h of recent) {
    const key = normalize(h.itemName);
    if (seen.has(key)) continue;
    seen.add(key);
    if (pantry.some((p) => p.quantity > 0 && sameProduct(p.name, h.itemName))) continue;
    if (list.some((s) => !s.done && sameProduct(s.name, h.itemName))) continue;
    out.push({ name: h.itemName, category: h.category });
  }
  return out.slice(0, 8);
}

const CATEGORY_WORDS: Record<string, Category> = {
  frango: "carnes", carne: "carnes", linguica: "carnes", bacon: "carnes", presunto: "carnes",
  peixe: "peixes", atum: "enlatados", sardinha: "enlatados",
  leite: "laticinios", queijo: "laticinios", iogurte: "laticinios", manteiga: "laticinios", requeijao: "laticinios",
  cremedeleite: "laticinios", ovo: "laticinios", leitecondensado: "laticinios",
  pao: "padaria", bolo: "padaria",
  arroz: "graos", feijao: "graos", macarrao: "graos", farinha: "graos", farinhademandioca: "graos", aveia: "graos", polvilho: "graos",
  milho: "enlatados", ervilha: "enlatados", molhodetomate: "temperos", cogumelo: "enlatados",
  sal: "temperos", acucar: "temperos", oleo: "temperos", azeite: "temperos", tempero: "temperos", caldo: "temperos", canela: "temperos",
  suco: "bebidas", refrigerante: "bebidas", agua: "bebidas", cafe: "bebidas", cerveja: "bebidas",
  biscoito: "lanches", chocolate: "lanches", salgadinho: "lanches", doce: "lanches", geleia: "lanches",
  sorvete: "congelados",
};
const PRODUCE = new Set([
  "tomate", "cebola", "alho", "batata", "batatadoce", "cenoura", "banana", "limao", "laranja", "maca", "mamao", "morango",
  "alface", "abobrinha", "brocolis", "espinafre", "pimentao", "cheiroverde", "coentro", "mandioca", "abobora", "alecrim",
]);

export function guessCategory(name: string): Category {
  for (const t of tokens(name).map(canonical)) {
    if (PRODUCE.has(t)) return "hortifruti";
    if (t in CATEGORY_WORDS) return CATEGORY_WORDS[t];
  }
  return "outros";
}

export function shoppingListText(items: ShoppingItem[]): string {
  const open = items.filter((i) => !i.done);
  return "🛒 Lista de compras\n" + open.map((i) => `☐ ${i.name}${i.amount ? ` (${i.amount})` : ""}`).join("\n");
}

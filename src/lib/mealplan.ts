import type { FoodItem, MealPlanEntry, MealSlot, Recipe } from "./types";
import { addDays, parseISODate, today } from "./dates";
import { matchRecipe } from "./matching";
import { normalize } from "./normalize";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const dow = parseISODate(iso).getDay(); // 0 = Sunday
  return addDays(iso, -((dow + 6) % 7));
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function dayLabel(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Fill empty slots (from `from` on) with recipes from the book: fewest missing
 * ingredients first, favoring food that expires soon (checked on each meal's
 * day) and favorites, never repeating a recipe within the week.
 */
export function autoFill(
  days: string[],
  slots: MealSlot[],
  existing: MealPlanEntry[],
  recipes: Recipe[],
  pantry: FoodItem[],
  from: string = today(),
): MealPlanEntry[] {
  const used = new Set(existing.map((e) => e.recipeId));
  const taken = new Set(existing.map((e) => `${e.date}|${e.slot}`));
  // Desserts/drinks/snacks don't make a meal.
  const notAMeal = new Set(["doce", "bebida", "lanche", "cafe da manha"]);
  const mealish = recipes.filter((r) => !r.tags.some((t) => notAMeal.has(normalize(t))));
  const out: MealPlanEntry[] = [];
  for (const date of days) {
    if (date < from) continue;
    for (const slot of slots) {
      if (taken.has(`${date}|${slot}`)) continue;
      // Judge each candidate on the meal's own day: fewer missing ingredients
      // is better, and using food that is about to expire earns a bonus.
      let best: { r: Recipe; key: number; score: number } | null = null;
      for (const r of mealish) {
        if (r.id == null || used.has(r.id)) continue;
        const m = matchRecipe(r, pantry, date);
        const key = m.missing.length - m.expiringUsed.length + (r.favorite ? -0.5 : 0);
        if (!best || key < best.key || (key === best.key && m.score > best.score)) best = { r, key, score: m.score };
      }
      if (!best) return out;
      used.add(best.r.id!);
      out.push({ date, slot, recipeId: best.r.id! });
    }
  }
  return out;
}

export interface WeekNeed {
  name: string;
  amount?: string;
  recipes: string[];
}

/**
 * Ingredients missing for the planned meals. Each meal is checked on its own
 * date, so food that will have expired by then counts as missing.
 * (Quantities aren't summed — the app knows *if* you have something, not if
 * there is enough for every recipe.)
 */
export function weekShoppingNeeds(entries: MealPlanEntry[], recipes: Recipe[], pantry: FoodItem[], from: string = today()): WeekNeed[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const needs = new Map<string, WeekNeed>();
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    if (e.date < from) continue;
    const r = byId.get(e.recipeId);
    if (!r) continue;
    for (const miss of matchRecipe(r, pantry, e.date).missing) {
      const key = normalize(miss.name);
      const n = needs.get(key) ?? { name: miss.name, amount: miss.amount, recipes: [] };
      if (!n.recipes.includes(r.title)) n.recipes.push(r.title);
      needs.set(key, n);
    }
  }
  return [...needs.values()];
}

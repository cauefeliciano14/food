import type { FoodItem, Recipe } from "./types";
import { today } from "./dates";
import { isStaple, itemMatchesIngredient } from "./normalize";
import { daysLeft, isUsable, itemStatus } from "./freshness";

export interface IngredientMatch {
  name: string;
  amount?: string;
  optional?: boolean;
  staple: boolean;
  items: FoodItem[];
}

export interface RecipeMatch {
  recipe: Recipe;
  ingredients: IngredientMatch[];
  /** required (non-optional, non-staple) ingredients */
  requiredCount: number;
  haveCount: number;
  missing: IngredientMatch[];
  /** 0..1 */
  score: number;
  /** pantry items used by this recipe that expire within 7 days (or are expired) */
  expiringUsed: FoodItem[];
  canMake: boolean;
}

function usable(item: FoodItem, ref: string): boolean {
  return isUsable(item, ref);
}

export function matchRecipe(recipe: Recipe, pantry: FoodItem[], ref: string = today()): RecipeMatch {
  const available = pantry.filter((i) => usable(i, ref));
  const ingredients: IngredientMatch[] = recipe.ingredients.map((ing) => ({
    ...ing,
    staple: isStaple(ing.name),
    items: available.filter((it) => itemMatchesIngredient(it.name, ing.name)),
  }));

  const required = ingredients.filter((i) => !i.optional && !i.staple);
  const missing = required.filter((i) => i.items.length === 0);
  const haveCount = required.length - missing.length;
  const score = required.length === 0 ? 1 : haveCount / required.length;

  const expiringUsed = new Map<number | string, FoodItem>();
  for (const ing of ingredients) {
    for (const it of ing.items) {
      const left = daysLeft(it, ref);
      if (left != null && left <= 7 && itemStatus(it, ref) !== "passou") {
        expiringUsed.set(it.id ?? it.name, it);
      }
    }
  }

  return {
    recipe,
    ingredients,
    requiredCount: required.length,
    haveCount,
    missing,
    score,
    expiringUsed: [...expiringUsed.values()],
    canMake: missing.length === 0,
  };
}

/**
 * Rank recipes: makeable first, then by how many soon-to-expire items they use,
 * then by ingredient coverage.
 */
export function rankRecipes(recipes: Recipe[], pantry: FoodItem[], ref: string = today()): RecipeMatch[] {
  return recipes
    .map((r) => matchRecipe(r, pantry, ref))
    .sort(
      (a, b) =>
        Number(b.canMake) - Number(a.canMake) ||
        b.expiringUsed.length - a.expiringUsed.length ||
        b.score - a.score ||
        a.missing.length - b.missing.length ||
        a.recipe.title.localeCompare(b.recipe.title),
    );
}

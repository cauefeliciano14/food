import { describe, expect, it } from "vitest";
import { addDays, daysBetween, expiryLabel, expiryStatus } from "../dates";
import { isStaple, itemMatchesIngredient, singular } from "../normalize";
import { matchRecipe, rankRecipes } from "../matching";
import { suggestShelfLifeDays } from "../shelfLife";
import { SEED_RECIPES } from "../seedRecipes";
import { textToIngredients, ingredientsToText } from "../../components/RecipeForm";
import type { FoodItem, Recipe } from "../types";

const REF = "2026-11-09";
let n = 0;
const item = (name: string, expiryDate = "2026-11-30", extra: Partial<FoodItem> = {}): FoodItem => ({
  id: ++n, name, quantity: 1, unit: "un", category: "outros", location: "despensa",
  purchaseDate: REF, expiryDate, createdAt: 0, ...extra,
});
const recipe = (r: Partial<Recipe>): Recipe => ({
  id: ++n, title: "x", minutes: 1, servings: 1, ingredients: [], steps: [], tags: [], source: "padrao", createdAt: 0, ...r,
});

describe("dates", () => {
  it("adds and diffs across month boundary", () => {
    expect(addDays("2026-11-28", 5)).toBe("2026-12-03");
    expect(daysBetween("2026-11-28", "2026-12-03")).toBe(5);
  });
  it("classifies expiry", () => {
    expect(expiryStatus("2026-11-08", REF)).toBe("vencido");
    expect(expiryStatus(REF, REF)).toBe("hoje");
    expect(expiryStatus("2026-11-12", REF)).toBe("urgente");
    expect(expiryStatus("2026-11-16", REF)).toBe("breve");
    expect(expiryStatus("2026-12-16", REF)).toBe("ok");
    expect(expiryStatus("", REF)).toBe("sem-data");
    expect(expiryLabel("2026-11-10", REF)).toBe("vence amanhã");
  });
});

describe("ingredient matching", () => {
  it("singularizes", () => {
    expect(singular("tomates")).toBe("tomate");
    expect(singular("limoes")).toBe("limao");
    expect(singular("paes")).toBe("pao");
  });
  it.each([
    ["PEITO DE FRANGO SADIA KG", "peito de frango", true],
    ["File de peito de frango", "frango", true],
    ["MUCARELA FATIADA 200G", "queijo mussarela", true],
    ["Queijo prato", "queijo", true],
    ["Tomates italianos", "tomate", true],
    ["Creme de leite Nestlé", "leite", false],
    ["Creme de leite Nestlé", "creme de leite", true],
    ["Leite integral", "creme de leite", false],
    ["Leite condensado", "leite", false],
    ["Molho de tomate Pomarola", "tomate", false],
    ["Extrato de tomate", "molho de tomate", true],
    ["Suco de laranja", "laranja", false],
    ["Patinho moído", "carne moída", true],
    ["Ovos brancos dz", "ovo", true],
    ["Macarrão espaguete", "macarrão", true],
    ["Pão de forma Pullman", "pão de forma", true],
    ["Farinha de mandioca", "farinha de trigo", false],
    ["Farinha de trigo", "farinha de trigo", true],
  ])("%s ↔ %s = %s", (itemName, ing, expected) => {
    expect(itemMatchesIngredient(itemName, ing)).toBe(expected);
  });
  it("treats basics as staples", () => {
    expect(isStaple("sal")).toBe(true);
    expect(isStaple("óleo")).toBe(true);
    expect(isStaple("arroz")).toBe(false);
  });
});

describe("recipe ranking", () => {
  const omelete = recipe({ title: "Omelete", ingredients: [{ name: "ovo" }, { name: "queijo", optional: true }, { name: "sal" }] });
  const strogo = recipe({ title: "Strogonoff", ingredients: [{ name: "frango" }, { name: "creme de leite" }, { name: "cebola" }] });

  it("needs only non-optional, non-staple ingredients", () => {
    const m = matchRecipe(omelete, [item("Ovos")], REF);
    expect(m.canMake).toBe(true);
    expect(m.requiredCount).toBe(1);
  });
  it("ignores expired and empty items", () => {
    expect(matchRecipe(omelete, [item("Ovos", "2026-11-01")], REF).canMake).toBe(false);
    expect(matchRecipe(omelete, [item("Ovos", "", { quantity: 0 })], REF).canMake).toBe(false);
  });
  it("lists missing and prioritises recipes using expiring food", () => {
    const pantry = [item("Ovos"), item("Peito de frango", "2026-11-10"), item("Creme de leite"), item("Cebola")];
    const ranked = rankRecipes([omelete, strogo], pantry, REF);
    expect(ranked.map((r) => r.recipe.title)).toEqual(["Strogonoff", "Omelete"]);
    expect(ranked[0].expiringUsed.map((i) => i.name)).toEqual(["Peito de frango"]);
    const partial = matchRecipe(strogo, [item("Cebola")], REF);
    expect(partial.missing.map((m) => m.name)).toEqual(["frango", "creme de leite"]);
  });
  it("seed recipes are well formed", () => {
    expect(SEED_RECIPES.length).toBeGreaterThan(15);
    for (const r of SEED_RECIPES) {
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });
});

describe("shelf life + recipe text", () => {
  it("suggests sensible defaults", () => {
    expect(suggestShelfLifeDays("Banana prata", "hortifruti", "despensa")).toBe(5);
    expect(suggestShelfLifeDays("Peito de frango", "carnes", "geladeira")).toBe(2);
    expect(suggestShelfLifeDays("Peito de frango", "carnes", "freezer")).toBe(120);
    expect(suggestShelfLifeDays("Arroz", "graos", "despensa")).toBe(365);
    expect(suggestShelfLifeDays("Feijão carioca", "graos", "despensa")).toBe(365);
  });
  it("round-trips ingredient text", () => {
    const ings = textToIngredients("arroz - 2 xícaras\n? queijo ralado - a gosto\nsal");
    expect(ings).toEqual([
      { name: "arroz", amount: "2 xícaras" },
      { name: "queijo ralado", amount: "a gosto", optional: true },
      { name: "sal" },
    ]);
    expect(textToIngredients(ingredientsToText(ings))).toEqual(ings);
  });
});

import { finishedSuggestions, guessCategory, sameProduct, shoppingListText } from "../shopping";

describe("shopping list", () => {
  it("dedupes the same product", () => {
    expect(sameProduct("Cebola", "cebolas")).toBe(true);
    expect(sameProduct("Peito de frango", "frango")).toBe(true);
    expect(sameProduct("Leite", "Creme de leite")).toBe(false);
  });
  it("guesses categories", () => {
    expect(guessCategory("Tomate italiano")).toBe("hortifruti");
    expect(guessCategory("Peito de frango")).toBe("carnes");
    expect(guessCategory("Creme de leite")).toBe("laticinios");
    expect(guessCategory("Esponja")).toBe("outros");
  });
  it("suggests recently finished items not in pantry or list", () => {
    const hist = [
      { itemName: "Leite integral", category: "laticinios" as const, action: "consumido" as const, date: "2026-11-05" },
      { itemName: "Ovos", category: "laticinios" as const, action: "consumido" as const, date: "2026-11-06" },
      { itemName: "Arroz", category: "graos" as const, action: "consumido" as const, date: "2026-11-07" },
      { itemName: "Pão", category: "padaria" as const, action: "consumido" as const, date: "2026-09-01" },
    ];
    const pantry = [item("Ovos brancos")];
    const list = [{ id: 1, name: "arroz", done: false, source: "manual" as const, createdAt: 0 }];
    expect(finishedSuggestions(hist, pantry, list, REF).map((s) => s.name)).toEqual(["Leite integral"]);
  });
  it("formats the shareable text with open items only", () => {
    expect(shoppingListText([
      { name: "Leite", amount: "2 L", done: false, source: "manual", createdAt: 0 },
      { name: "Pão", done: true, source: "manual", createdAt: 0 },
    ])).toBe("🛒 Lista de compras\n☐ Leite (2 L)");
  });
});

import { monthlyStats, topWasted, wastedByCategory } from "../waste";
import type { HistoryEntry } from "../types";

describe("waste report", () => {
  const h = (itemName: string, action: "consumido" | "descartado", date: string, value?: number, category: HistoryEntry["category"] = "hortifruti"): HistoryEntry =>
    ({ itemName, action, date, category, ...(value ? { value } : {}) });
  const hist = [
    h("Alface", "descartado", "2026-11-02", 4.5),
    h("alface", "descartado", "2026-10-20", 4),
    h("Pão", "descartado", "2026-11-03", 0, "padaria"),
    h("Leite", "consumido", "2026-11-04"),
    h("Ovos", "consumido", "2026-10-01"),
    h("Ovos", "consumido", "2026-05-01"),
  ];
  it("groups by month, oldest first, across a year boundary label", () => {
    const m = monthlyStats(hist, 6, REF);
    expect(m.map((x) => x.key)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(m[5]).toMatchObject({ used: 1, wasted: 2, wastedValue: 4.5 });
    expect(m[5].wasteRate).toBeCloseTo(2 / 3);
    expect(m[0].wasteRate).toBeNull();
    expect(monthlyStats([], 12, "2026-02-10")[0].label).toBe("mar/25");
  });
  it("ranks the most wasted items, merging case/accents", () => {
    const top = topWasted(hist, 90, REF);
    expect(top[0]).toMatchObject({ name: "Alface", count: 2, value: 8.5 });
    expect(top.map((t) => t.name)).toEqual(["Alface", "Pão"]);
    expect(wastedByCategory(hist, 90, REF)).toEqual([{ category: "hortifruti", count: 2 }, { category: "padaria", count: 1 }]);
  });
});

import { autoFill, dayLabel, weekDays, weekShoppingNeeds, weekStart } from "../mealplan";

describe("meal plan", () => {
  it("computes the week (Mon–Sun)", () => {
    expect(weekStart("2026-11-09")).toBe("2026-11-09"); // Monday
    expect(weekStart("2026-11-15")).toBe("2026-11-09"); // Sunday
    expect(weekDays("2026-11-09").at(-1)).toBe("2026-11-15");
    expect(dayLabel("2026-11-12")).toBe("Qui 12/11");
  });
  const rs: Recipe[] = [
    recipe({ id: 101, title: "Omelete", ingredients: [{ name: "ovo" }] }),
    recipe({ id: 102, title: "Frango", ingredients: [{ name: "frango" }, { name: "limão" }] }),
    recipe({ id: 103, title: "Brigadeiro", tags: ["doce"], ingredients: [{ name: "leite condensado" }] }),
  ];
  it("auto-fills empty future slots without repeats or desserts", () => {
    const days = weekDays("2026-11-09");
    const filled = autoFill(days, ["jantar"], [{ date: "2026-11-10", slot: "jantar", recipeId: 999 }], rs, [item("Ovos")], "2026-11-10");
    expect(filled).toEqual([
      { date: "2026-11-11", slot: "jantar", recipeId: 101 },
      { date: "2026-11-12", slot: "jantar", recipeId: 102 },
    ]);
  });
  it("lists what's missing, checking freshness on the meal's day", () => {
    const pantry = [item("Ovos"), item("Peito de frango", "2026-11-11")];
    const needs = weekShoppingNeeds(
      [{ date: "2026-11-10", slot: "jantar", recipeId: 101 }, { date: "2026-11-14", slot: "jantar", recipeId: 102 }],
      rs, pantry, REF,
    );
    // frango expires on the 11th, so for the 14th it must be bought
    expect(needs.map((n) => n.name)).toEqual(["frango", "limão"]);
    expect(needs[0].recipes).toEqual(["Frango"]);
  });
});

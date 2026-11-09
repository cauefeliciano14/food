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
    expect(suggestShelfLifeDays("Arroz", "graos", "despensa")).toBe(180);
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

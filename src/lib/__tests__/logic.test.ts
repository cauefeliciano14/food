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

import { parseQuickAdd } from "../quickAdd";

describe("quick add parser", () => {
  it.each([
    ["6 ovos", { name: "Ovos", quantity: 6, unit: "un" }],
    ["1kg arroz", { name: "Arroz", quantity: 1, unit: "kg" }],
    ["arroz 5kg", { name: "Arroz", quantity: 5, unit: "kg" }],
    ["2 litros de leite", { name: "Leite", quantity: 2, unit: "L" }],
    ["500g de carne moída", { name: "Carne moída", quantity: 500, unit: "g" }],
    ["meia dúzia de ovos", { name: "Ovos", quantity: 6, unit: "un" }],
    ["uma dúzia de bananas", { name: "Bananas", quantity: 12, unit: "un" }],
    ["três latas de atum", { name: "Atum", quantity: 3, unit: "lata" }],
    ["pacote de café", { name: "Café", quantity: 1, unit: "pct" }],
    ["Queijo mussarela", { name: "Queijo mussarela", quantity: 1, unit: "un" }],
    ["1,5 kg de batata", { name: "Batata", quantity: 1.5, unit: "kg" }],
  ])("%s", (text, expected) => {
    expect(parseQuickAdd(text)).toEqual([expected]);
  });
  it("splits lists, including dictated ones", () => {
    expect(parseQuickAdd("6 ovos, 1kg arroz e 2 litros de leite").map((i) => i.name)).toEqual(["Ovos", "Arroz", "Leite"]);
    expect(parseQuickAdd("tomate\ncebola; alho").map((i) => i.name)).toEqual(["Tomate", "Cebola", "Alho"]);
    expect(parseQuickAdd(" , ,")).toEqual([]);
  });
});

import { defaultLocation } from "../shelfLife";
describe("default location", () => {
  it("keeps sealed shelf-stable items in the pantry", () => {
    expect(defaultLocation("laticinios", "Leite condensado Moça")).toBe("despensa");
    expect(defaultLocation("laticinios", "Creme de leite")).toBe("despensa");
    expect(defaultLocation("laticinios", "Queijo prato")).toBe("geladeira");
    expect(defaultLocation("carnes")).toBe("geladeira");
  });
});

import { effectiveDate, isUsable, itemLabel, itemStatus, locationAfterOpening } from "../freshness";

describe("freshness rules", () => {
  const it2 = (name: string, category: FoodItem["category"], expiryDate: string, extra: Partial<FoodItem> = {}) =>
    item(name, expiryDate, { category, location: "despensa", ...extra });
  it("sealed dry goods past the date are 'passou', not expired", () => {
    const arroz = it2("Arroz", "graos", "2026-10-01");
    expect(itemStatus(arroz, REF)).toBe("passou");
    expect(itemLabel(arroz, REF)).toBe("passou há 39 dias");
    expect(isUsable(arroz, REF)).toBe(true);
    expect(itemStatus(it2("Açúcar refinado", "temperos", "2024-01-01"), REF)).toBe("passou");
  });
  it("fresh food past the date is expired", () => {
    expect(itemStatus(it2("Peito de frango", "carnes", "2026-11-08"), REF)).toBe("vencido");
    expect(itemStatus(it2("Iogurte", "laticinios", "2026-11-08"), REF)).toBe("vencido");
    expect(itemStatus(it2("Arroz", "graos", "2025-01-01"), REF)).toBe("vencido"); // beyond tolerance
  });
  it("opened packages follow the after-opening rule", () => {
    const leite = it2("Leite integral", "laticinios", "2027-03-01", { openedAt: "2026-11-08", location: "geladeira" });
    expect(effectiveDate(leite)).toBe("2026-11-11");
    expect(itemLabel(leite, REF)).toBe("use em 2 dias");
    const cond = it2("Leite condensado", "laticinios", "2027-06-01", { openedAt: "2026-11-01" });
    expect(itemStatus(cond, REF)).toBe("vencido"); // opened 8 days ago, keeps 5
    const arrozAberto = it2("Arroz", "graos", "2027-06-01", { openedAt: "2026-11-01" });
    expect(itemStatus(arrozAberto, REF)).toBe("ok");
    // never later than the printed date
    expect(effectiveDate(it2("Arroz", "graos", "2026-12-01", { openedAt: "2026-11-09" }))).toBe("2026-12-01");
  });
  it("suggests the fridge after opening when needed", () => {
    expect(locationAfterOpening({ name: "Creme de leite", category: "laticinios", location: "despensa" })).toBe("geladeira");
    expect(locationAfterOpening({ name: "Arroz", category: "graos", location: "despensa" })).toBe("despensa");
  });
});

import { parseExpiryFromText } from "../expiryOcr";

describe("expiry date OCR parsing", () => {
  it.each([
    ["VAL: 12/03/2027", "2027-03-12"],
    ["VAL.12/03/27 L:2310A", "2027-03-12"],
    ["FAB 01/01/2026 VAL 01/07/2027", "2027-07-01"],
    ["VAL 01/07/2027\nFAB 01/01/2026", "2027-07-01"],
    ["VENC 12.03.2027", "2027-03-12"],
    ["V: 12-03-27", "2027-03-12"],
    ["12 MAR 2027", "2027-03-12"],
    ["VAL 12MAR27", "2027-03-12"],
    ["VAL: MAR/2027", "2027-03-31"],
    ["VALIDADE 02/2027 LOTE 4455", "2027-02-28"],
    ["VAL 1O/O3/2O27", "2027-03-10"],
    ["CONSUMIR ATÉ 05 DEZ 2026", "2026-12-05"],
    ["L 2405 15/08/26 14:32", "2026-08-15"],
  ])("%s → %s", (text, expected) => {
    expect(parseExpiryFromText(text, "2026-11-09").best).toBe(expected);
  });
  it("prefers the expiry over manufacture without labels (later date)", () => {
    expect(parseExpiryFromText("01/01/2026 01/07/2027", "2026-11-09").best).toBe("2027-07-01");
  });
  it("returns nothing for text without dates", () => {
    expect(parseExpiryFromText("ARROZ TIPO 1 5KG", "2026-11-09")).toEqual({ best: null, candidates: [] });
  });
});

import { parseClaudeReply, parseIngredientLine, parseRecipeText } from "../recipeOcr";

describe("recipe from photo text", () => {
  it.each([
    ["2 xícaras (chá) de farinha de trigo", { name: "farinha de trigo", amount: "2 xícaras (chá)" }],
    ["1 lata de leite condensado", { name: "leite condensado", amount: "1 lata" }],
    ["3 ovos", { name: "ovos", amount: "3" }],
    ["• 1/2 xícara de óleo", { name: "óleo", amount: "1/2 xícara" }],
    ["Sal a gosto", { name: "sal", amount: "a gosto" }],
    ["1 colher (sopa) de fermento em pó", { name: "fermento em pó", amount: "1 colher (sopa)" }],
    ["2 dentes de alho picados", { name: "alho picados", amount: "2 dentes" }],
    ["Cheiro-verde picado (opcional)", { name: "cheiro-verde picado", optional: true }],
    ["500 g de carne moída", { name: "carne moída", amount: "500 g" }],
  ])("%s", (line, expected) => {
    expect(parseIngredientLine(line)).toEqual(expected);
  });

  it("parses a typical cookbook page", () => {
    const page = `BOLO DE CENOURA
Rende: 12 porções
Tempo de preparo: 50 minutos
Ingredientes
Massa
3 cenouras médias
4 ovos
1 xícara (chá) de óleo
2 xícaras (chá) de açúcar
2 xícaras (chá) de farinha de
trigo
1 colher (sopa) de fermento
Cobertura
1 colher (sopa) de manteiga
Modo de preparo
1. Bata no liquidificador as cenouras, os ovos e o óleo.
2. Em uma tigela, misture o açúcar e a farinha. Junte o creme
batido e mexa bem.
3. Por último, acrescente o fermento.
4. Asse em forno médio por 40 minutos.
32`;
    const r = parseRecipeText(page);
    expect(r.title).toBe("Bolo de cenoura");
    expect(r.servings).toBe(12);
    expect(r.minutes).toBe(50);
    expect(r.ingredients.map((i) => i.name)).toEqual(["cenouras médias", "ovos", "óleo", "açúcar", "farinha de trigo", "fermento", "manteiga"]);
    expect(r.steps).toHaveLength(4);
    expect(r.steps[1]).toBe("Em uma tigela, misture o açúcar e a farinha. Junte o creme batido e mexa bem.");
  });

  it("splits prose instructions into sentences", () => {
    const r = parseRecipeText("Arroz simples\nIngredientes\n2 xícaras de arroz\nModo de fazer\nRefogue o alho no óleo. Junte o arroz e frite.\nAcrescente a água e cozinhe até secar.");
    expect(r.steps).toEqual(["Refogue o alho no óleo.", "Junte o arroz e frite.", "Acrescente a água e cozinhe até secar."]);
  });

  it("reads the Claude app reply (JSON in a code block)", () => {
    const reply = 'Claro! Aqui está:\n```json\n{"title":"Pudim","minutes":60,"servings":8,"ingredients":[{"name":"leite condensado","amount":"1 lata"},{"name":"ovo","amount":"3","optional":false}],"steps":["Bata tudo.","Asse em banho-maria."],"tags":["doce"]}\n```';
    const r = parseClaudeReply(reply);
    expect(r).toEqual({
      title: "Pudim", minutes: 60, servings: 8,
      ingredients: [{ name: "leite condensado", amount: "1 lata" }, { name: "ovo", amount: "3" }],
      steps: ["Bata tudo.", "Asse em banho-maria."], tags: ["doce"],
    });
  });

  it("falls back to text when the reply isn't JSON", () => {
    const r = parseClaudeReply("Pudim\nIngredientes\n1 lata de leite condensado\nModo de preparo\n1. Bata.\n2. Asse.");
    expect(r.title).toBe("Pudim");
    expect(r.ingredients[0]).toEqual({ name: "leite condensado", amount: "1 lata" });
    expect(r.steps).toEqual(["Bata.", "Asse."]);
  });
});

import { packageSize, simplifyProductName } from "../productName";
import { categoryFromTags, productPrefill } from "../barcode";

describe("barcode product names", () => {
  it.each([
    ["Arroz Saboroso Integral Tipo 1 5kg", ["Saboroso"], "Arroz integral"],
    ["Arroz Tio João Tipo 1 Longo Fino 5kg", ["Tio João"], "Arroz"],
    ["Leite condensado Moça", ["Moça", "Nestlé"], "Leite condensado"],
    ["Biscoito Recheado Passatempo Chocolate 130g", ["Nestlé", "Passatempo"], "Biscoito recheado chocolate"],
    ["Feijão Carioca Camil 1kg", ["Camil"], "Feijão carioca"],
    ["Leite de Coco Sococo 200ml", ["Sococo"], "Leite de coco"],
    ["Café Torrado e Moído Pilão 500g", ["Pilão"], "Café torrado"],
    ["Biscoito Maizena", [], "Biscoito maizena"],
  ])("%s → %s", (full, brands, expected) => {
    expect(simplifyProductName(full, brands)).toBe(expected);
  });
  it.each([
    ["5 kg", { quantity: 5, unit: "kg" }],
    ["5kg", { quantity: 5, unit: "kg" }],
    ["1 L", { quantity: 1, unit: "L" }],
    ["1000 ml", { quantity: 1, unit: "L" }],
    ["2000 g", { quantity: 2, unit: "kg" }],
    ["12 x 200 ml", { quantity: 12, unit: "un" }],
    ["395 g", null],
    ["", null],
  ])("size %s", (raw, expected) => {
    expect(packageSize(raw)).toEqual(expected);
  });
  it("does not mistake rice for a drink (generic 'and-beverages' tag)", () => {
    const tags = ["en:plant-based-foods-and-beverages", "en:plant-based-foods", "en:cereals-and-potatoes", "en:seeds", "en:cereal-grains", "en:rices"];
    expect(categoryFromTags(tags, "Arroz integral")).toBe("graos");
    expect(categoryFromTags(tags, "Produto xyz")).toBe("graos");
    expect(categoryFromTags(["en:beverages", "en:juices"], "Del valle")).toBe("bebidas");
  });
  it("builds a tidy prefill", () => {
    expect(productPrefill("Arroz Saboroso Integral Tipo 1 5kg", ["Saboroso"], "5 kg", ["en:plant-based-foods-and-beverages"])).toEqual({
      name: "Arroz integral", fullName: "Arroz Saboroso Integral Tipo 1 5kg", category: "graos", location: "despensa", quantity: 5, unit: "kg",
    });
    expect(productPrefill("Leite condensado Moça", ["Moça"], "395 g").notes).toBe("Embalagem: 395 g");
  });
});

import { productFromLabel } from "../productOcr";

describe("product from a package photo", () => {
  it("takes the biggest food text as name and reads the weight", () => {
    const r = productFromLabel([
      { text: "Saboroso", height: 40 },
      { text: "ARROZ", height: 90 },
      { text: "INTEGRAL", height: 80 },
      { text: "TIPO 1", height: 30 },
      { text: "PESO LÍQUIDO 5 kg", height: 18 },
      { text: "INFORMAÇÃO NUTRICIONAL", height: 12 },
      { text: "Indústria Brasileira", height: 10 },
    ], "2026-11-10")!;
    expect(r.rawName).toBe("ARROZ INTEGRAL");
    expect(r.prefill).toMatchObject({ name: "Arroz integral", category: "graos", location: "despensa", quantity: 5, unit: "kg" });
  });
  it("keeps small packages by unit and uses a labelled expiry date", () => {
    const r = productFromLabel([
      { text: "Leite Condensado", height: 60 },
      { text: "Mococa", height: 70 },
      { text: "395g", height: 20 },
      { text: "VAL 15/08/2027 L 2210", height: 10 },
    ], "2026-11-10")!;
    expect(r.prefill).toMatchObject({ name: "Leite condensado", quantity: 1, unit: "un", notes: "Embalagem: 395g", expiryDate: "2027-08-15" });
  });
  it("returns null when nothing looks like a name", () => {
    expect(productFromLabel([{ text: "1234 5678", height: 30 }])).toBeNull();
  });
});

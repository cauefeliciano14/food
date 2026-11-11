import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { matchesKind, sortMatches } from "../recipeFilters";
import type { RecipeMatch } from "../matching";
import type { Recipe } from "../types";

const rec = (title: string, tags: string[], minutes = 30, extra: Partial<Recipe> = {}): Recipe =>
  ({ title, tags, minutes, servings: 2, ingredients: [], steps: [], source: "padrao", createdAt: 1, ...extra });

describe("recipe filters and sorting", () => {
  it("filters by dish type, accents and quick ones by time", () => {
    expect(matchesKind(rec("Pudim", ["doce", "sobremesa"]), "doce")).toBe(true);
    expect(matchesKind(rec("Pudim", ["doce"]), "salgado")).toBe(false);
    expect(matchesKind(rec("Costela", ["proteína", "panela de pressão"]), "panela de pressao")).toBe(true);
    expect(matchesKind(rec("Tapioca", ["café da manhã"]), "lanche")).toBe(true);
    expect(matchesKind(rec("Omelete", ["proteína"], 10), "rapido")).toBe(true);
    expect(matchesKind(rec("Lasanha", ["massa"], 60), "rapido")).toBe(false);
    expect(matchesKind(rec("Qualquer", []), "")).toBe(true);
  });

  it("sorts by name, time, favorites and recency", () => {
    const m = (r: Recipe) => ({ recipe: r }) as RecipeMatch;
    const list = [m(rec("Bolo", [], 50, { createdAt: 3 })), m(rec("Arroz", [], 25, { createdAt: 1, favorite: true })), m(rec("Ovo", [], 5, { createdAt: 2 }))];
    expect(sortMatches(list, "az").map((x) => x.recipe.title)).toEqual(["Arroz", "Bolo", "Ovo"]);
    expect(sortMatches(list, "rapidas").map((x) => x.recipe.title)).toEqual(["Ovo", "Arroz", "Bolo"]);
    expect(sortMatches(list, "favoritas")[0].recipe.title).toBe("Arroz");
    expect(sortMatches(list, "recentes")[0].recipe.title).toBe("Bolo");
    expect(sortMatches(list, "sugestao").map((x) => x.recipe.title)).toEqual(["Bolo", "Arroz", "Ovo"]);
  });
});

describe("moving an item between places", () => {
  it("freezing extends fresh food, thawing shortens it, undo restores", async () => {
    const { db, moveItem } = await import("../db");
    const id = await db.items.add({ name: "Carne moída", quantity: 1, unit: "kg", category: "carnes", location: "geladeira", purchaseDate: "2026-11-10", expiryDate: "2026-11-12", createdAt: 1 });
    let it = (await db.items.get(id))!;
    const frozen = await moveItem(it, "freezer", "2026-11-11");
    expect(frozen.expiryDate > "2027-01-01").toBe(true);
    it = (await db.items.get(id))!;
    expect(it.location).toBe("freezer");
    const thawed = await moveItem(it, "geladeira", "2026-12-01");
    expect(thawed.expiryDate).toBe("2026-12-03");
    await thawed.undo();
    expect((await db.items.get(id))!.location).toBe("freezer");
  });

  it("shelf-stable food keeps its date when moved", async () => {
    const { db, moveItem } = await import("../db");
    const id = await db.items.add({ name: "Arroz", quantity: 5, unit: "kg", category: "graos", location: "despensa", purchaseDate: "2026-11-10", expiryDate: "2027-08-01", createdAt: 1 });
    const r = await moveItem((await db.items.get(id))!, "armario", "2026-11-11");
    expect(r.expiryDate).toBe("2027-08-01");
  });
});

describe("ratings order the suggestions", () => {
  it("liked first, disliked last", async () => {
    const { rankRecipes } = await import("../matching");
    const r = (title: string, rating?: 1 | -1) => rec(title, [], 10, { ingredients: [{ name: "sal" }], rating });
    const out = rankRecipes([r("B"), r("A", -1), r("C", 1)], [], "2026-11-11").map((m) => m.recipe.title);
    expect(out).toEqual(["C", "B", "A"]);
  });
});

describe("thawing", () => {
  it("marks the item and warns", async () => {
    const { db, moveItem, moveMessage } = await import("../db");
    const id = await db.items.add({ name: "Frango", quantity: 1, unit: "kg", category: "carnes", location: "freezer", purchaseDate: "2026-11-01", expiryDate: "2027-02-01", createdAt: 1 });
    const it = (await db.items.get(id))!;
    const r = await moveItem(it, "geladeira", "2026-11-11");
    expect(r.thawing).toBe(true);
    expect((await db.items.get(id))!.thawedAt).toBe("2026-11-11");
    expect(moveMessage(it, "geladeira", r)).toBe("Frango descongelando: use até 13/11/2026 e não volte ao freezer");
    await moveItem((await db.items.get(id))!, "freezer", "2026-11-12");
    expect((await db.items.get(id))!.thawedAt).toBeUndefined();
  });
});

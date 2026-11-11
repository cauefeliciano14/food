import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";

describe("upgrade of data saved by the previous version", () => {
  it("simplifies scanned names, fixes category and package size", async () => {
    // database exactly as v3 (app 1.9) left it
    const old = new Dexie("despensa");
    old.version(1).stores({ items: "++id, name, category, location, expiryDate, purchaseDate", recipes: "++id, title, source, favorite", history: "++id, date, action" });
    old.version(2).stores({ shopping: "++id, name, done, createdAt" });
    old.version(3).stores({ items: "++id, name, category, location, expiryDate, purchaseDate, barcode", mealPlan: "++id, date, recipeId, [date+slot]", barcodes: "&code" });
    await old.open();
    await old.table("items").bulkAdd([
      { name: "Arroz Saboroso Integral Tipo 1 Saboroso", quantity: 1, unit: "un", category: "bebidas", location: "despensa", purchaseDate: "2026-11-10", expiryDate: "2027-08-29", notes: "Embalagem: 5 kg", barcode: "7890000000001", createdAt: 1 },
      { name: "Arroz", quantity: 5, unit: "kg", category: "graos", location: "despensa", purchaseDate: "2026-11-10", expiryDate: "2027-11-10", createdAt: 2 },
    ]);
    await old.table("recipes").bulkAdd([
      { title: "Arroz branco soltinho", source: "padrao", ingredients: [], steps: [], tags: [], createdAt: 1 },
      { title: "Bolo de cenoura com cobertura de chocolate", source: "minha", ingredients: [], steps: [], tags: [], createdAt: 1 },
    ]);
    await old.table("barcodes").put({ code: "7890000000001", name: "Arroz Saboroso Integral Tipo 1 Saboroso", category: "bebidas", location: "despensa", unit: "un", size: "5 kg" });
    old.close();

    const { db } = await import("../db");
    const items = (await db.items.toArray()).sort((a, b) => a.createdAt - b.createdAt);
    expect(items[0]).toMatchObject({ name: "Arroz integral", fullName: "Arroz Saboroso Integral Tipo 1 Saboroso", category: "graos", quantity: 5, unit: "kg" });
    expect(items[0].notes).toBeUndefined();
    expect(items[1]).toMatchObject({ name: "Arroz", quantity: 5, unit: "kg", category: "graos" });
    expect(items[1].fullName).toBeUndefined();
    // v5: the new built-in recipes arrive, without duplicating what was there
    const { SEED_RECIPES_2 } = await import("../seedRecipes2");
    const { SEED_RECIPES_3 } = await import("../seedRecipes3");
    const recipes = await db.recipes.toArray();
    expect(recipes.length).toBe(2 + SEED_RECIPES_2.length - 1 + SEED_RECIPES_3.length);
    expect(recipes.filter((r) => r.title.startsWith("Bolo de cenoura"))).toHaveLength(1);
    expect(recipes.some((r) => r.title === "Coxinha de frango")).toBe(true);
    const { lookupBarcode } = await import("../barcode");
    const r = await lookupBarcode("7890000000001", (() => { throw new Error("no network in test"); }) as never);
    expect(r.prefill).toMatchObject({ name: "Arroz integral", category: "graos", quantity: 5, unit: "kg" });
  });
});

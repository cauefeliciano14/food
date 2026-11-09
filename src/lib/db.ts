import Dexie, { type EntityTable } from "dexie";
import type { FoodItem, HistoryEntry, Recipe, ShoppingItem } from "./types";
import { SEED_RECIPES } from "./seedRecipes";
import { today } from "./dates";

export class DespensaDB extends Dexie {
  items!: EntityTable<FoodItem, "id">;
  recipes!: EntityTable<Recipe, "id">;
  history!: EntityTable<HistoryEntry, "id">;
  shopping!: EntityTable<ShoppingItem, "id">;

  constructor() {
    super("despensa");
    this.version(1).stores({
      items: "++id, name, category, location, expiryDate, purchaseDate",
      recipes: "++id, title, source, favorite",
      history: "++id, date, action",
    });
    this.version(2).stores({
      shopping: "++id, name, done, createdAt",
    });
    this.on("populate", (tx) => {
      const now = Date.now();
      tx.table("recipes").bulkAdd(SEED_RECIPES.map((r) => ({ ...r, source: "padrao", createdAt: now })));
    });
  }
}

export const db = new DespensaDB();

/** Consume (or discard) some quantity of an item; removes it when it hits zero. */
export async function consumeItem(item: FoodItem, amount: number, action: "consumido" | "descartado") {
  if (item.id == null) return;
  await db.transaction("rw", db.items, db.history, async () => {
    const left = Math.max(0, +(item.quantity - amount).toFixed(3));
    if (left <= 0) await db.items.delete(item.id!);
    else await db.items.update(item.id!, { quantity: left });
    await db.history.add({ itemName: item.name, category: item.category, action, date: today() });
  });
}

export interface Backup {
  app: "despensa";
  version: 1;
  exportedAt: string;
  items: FoodItem[];
  recipes: Recipe[];
  history: HistoryEntry[];
  shopping?: ShoppingItem[];
}

export async function exportBackup(): Promise<Backup> {
  return {
    app: "despensa",
    version: 1,
    exportedAt: new Date().toISOString(),
    items: await db.items.toArray(),
    recipes: await db.recipes.toArray(),
    history: await db.history.toArray(),
    shopping: await db.shopping.toArray(),
  };
}

export async function importBackup(data: Backup) {
  if (data?.app !== "despensa") throw new Error("Arquivo não é um backup do Despensa.");
  await db.transaction("rw", [db.items, db.recipes, db.history, db.shopping], async () => {
    await Promise.all([db.items.clear(), db.recipes.clear(), db.history.clear(), db.shopping.clear()]);
    await db.shopping.bulkAdd(data.shopping ?? []);
    await db.items.bulkAdd(data.items ?? []);
    await db.recipes.bulkAdd(data.recipes ?? []);
    await db.history.bulkAdd(data.history ?? []);
  });
}

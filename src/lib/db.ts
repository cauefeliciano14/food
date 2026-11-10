import Dexie, { type EntityTable } from "dexie";
import type { BarcodeInfo, FoodItem, Location, HistoryEntry, MealPlanEntry, Recipe, ShoppingItem } from "./types";
import { SEED_RECIPES } from "./seedRecipes";
import { today } from "./dates";
import { productPrefill } from "./barcode";

export class DespensaDB extends Dexie {
  items!: EntityTable<FoodItem, "id">;
  recipes!: EntityTable<Recipe, "id">;
  history!: EntityTable<HistoryEntry, "id">;
  shopping!: EntityTable<ShoppingItem, "id">;
  mealPlan!: EntityTable<MealPlanEntry, "id">;
  barcodes!: EntityTable<BarcodeInfo, "code">;

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
    this.version(3).stores({
      items: "++id, name, category, location, expiryDate, purchaseDate, barcode",
      mealPlan: "++id, date, recipeId, [date+slot]",
      barcodes: "&code",
    });
    // v4: barcode-scanned items get a short name (original kept), category
    // decided by the name and the package size as quantity.
    this.version(4).stores({}).upgrade(async (tx) => {
      // (remembered barcodes are refreshed on their next scan — see lookupBarcode)
      await tx.table("items").toCollection().modify((it: FoodItem) => {
        if (!it.barcode || it.fullName) return;
        const size = it.notes?.startsWith("Embalagem: ") ? it.notes.slice(11) : undefined;
        const p = productPrefill(it.name, [], size);
        if (p.name !== it.name) { it.fullName = it.name; it.name = p.name; }
        if (p.category !== "outros") it.category = p.category;
        if (it.quantity === 1 && it.unit === "un" && !p.notes && p.unit !== "un") {
          it.quantity = p.quantity;
          it.unit = p.unit;
          if (it.notes === `Embalagem: ${size}`) delete it.notes;
        }
      });
    });
    this.on("populate", (tx) => {
      const now = Date.now();
      tx.table("recipes").bulkAdd(SEED_RECIPES.map((r) => ({ ...r, source: "padrao", createdAt: now })));
    });
  }
}

export const db = new DespensaDB();

/**
 * Consume (or discard) some quantity of an item; removes it when it hits zero.
 * Returns an undo function that puts everything back.
 */
export async function consumeItem(item: FoodItem, amount: number, action: "consumido" | "descartado"): Promise<() => Promise<void>> {
  if (item.id == null) return async () => {};
  let historyId: number | undefined;
  await db.transaction("rw", db.items, db.history, async () => {
    const used = Math.min(amount, item.quantity);
    const left = Math.max(0, +(item.quantity - used).toFixed(3));
    if (left <= 0) await db.items.delete(item.id!);
    else await db.items.update(item.id!, { quantity: left });
    historyId = (await db.history.add({
      itemName: item.name,
      category: item.category,
      action,
      date: today(),
      quantity: used,
      unit: item.unit,
      ...(item.unitPrice ? { value: +(item.unitPrice * used).toFixed(2) } : {}),
    })) as number;
  });
  return async () => {
    await db.transaction("rw", db.items, db.history, async () => {
      await db.items.put(item);
      if (historyId != null) await db.history.delete(historyId);
    });
  };
}

/**
 * Mark a package as opened and, optionally, move part of it to another
 * container (e.g. 1 kg of a 5 kg rice bag into a jar in the kitchen cabinet).
 * Both parts count as opened from `openedAt`.
 */
export async function openItem(
  item: FoodItem,
  opts: { openedAt: string; location: Location; split?: { quantity: number; location: Location; name: string } },
) {
  if (item.id == null) return;
  await db.transaction("rw", db.items, async () => {
    const part = opts.split && opts.split.quantity > 0 ? Math.min(opts.split.quantity, item.quantity) : 0;
    const rest = +(item.quantity - part).toFixed(3);
    if (part > 0) {
      await db.items.add({
        ...item,
        id: undefined,
        name: opts.split!.name.trim() || item.name,
        quantity: part,
        location: opts.split!.location,
        openedAt: item.openedAt ?? opts.openedAt,
        notes: `Separado de ${item.name}${item.notes ? ` · ${item.notes}` : ""}`,
        createdAt: Date.now(),
      });
    }
    if (rest <= 0) await db.items.delete(item.id!);
    else await db.items.update(item.id!, { quantity: rest, location: opts.location, openedAt: item.openedAt ?? opts.openedAt });
  });
}

/** Units you count one by one — a quick "usei" takes one of these, not the whole lot. */
const COUNTABLE = new Set(["un", "lata", "cx", "pct", "dz", "maço"]);

export function quickUseAmount(item: FoodItem): number {
  return COUNTABLE.has(item.unit) && item.quantity > 1 ? 1 : item.quantity;
}

export interface Backup {
  app: "despensa";
  version: 1;
  exportedAt: string;
  items: FoodItem[];
  recipes: Recipe[];
  history: HistoryEntry[];
  shopping?: ShoppingItem[];
  mealPlan?: MealPlanEntry[];
  barcodes?: BarcodeInfo[];
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
    mealPlan: await db.mealPlan.toArray(),
    barcodes: await db.barcodes.toArray(),
  };
}

export async function importBackup(data: Backup) {
  if (data?.app !== "despensa") throw new Error("Arquivo não é um backup do Despensa.");
  await db.transaction("rw", [db.items, db.recipes, db.history, db.shopping, db.mealPlan, db.barcodes], async () => {
    await Promise.all([db.items.clear(), db.recipes.clear(), db.history.clear(), db.shopping.clear(), db.mealPlan.clear(), db.barcodes.clear()]);
    await db.mealPlan.bulkAdd(data.mealPlan ?? []);
    await db.barcodes.bulkPut(data.barcodes ?? []);
    await db.shopping.bulkAdd(data.shopping ?? []);
    await db.items.bulkAdd(data.items ?? []);
    await db.recipes.bulkAdd(data.recipes ?? []);
    await db.history.bulkAdd(data.history ?? []);
  });
}

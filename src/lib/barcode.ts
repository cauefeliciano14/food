import { db } from "./db";
import { guessCategory } from "./shopping";
import { defaultLocation } from "./shelfLife";
import type { Category, FoodItem } from "./types";

/** Open Food Facts category tags → our categories (first match wins). */
const OFF_CATEGORIES: [string, Category][] = [
  ["frozen", "congelados"],
  ["fish", "peixes"], ["seafood", "peixes"],
  ["meats", "carnes"], ["poultry", "carnes"], ["sausages", "carnes"], ["hams", "carnes"],
  ["dairies", "laticinios"], ["milks", "laticinios"], ["cheeses", "laticinios"], ["yogurts", "laticinios"], ["eggs", "laticinios"], ["butters", "laticinios"],
  ["breads", "padaria"], ["cakes", "padaria"],
  ["canned", "enlatados"],
  ["condiments", "temperos"], ["sauces", "temperos"], ["spices", "temperos"], ["salts", "temperos"], ["sugars", "temperos"], ["oils", "temperos"],
  ["beverages", "bebidas"], ["drinks", "bebidas"], ["coffees", "bebidas"], ["juices", "bebidas"],
  ["cereals", "graos"], ["pastas", "graos"], ["rices", "graos"], ["legumes", "graos"], ["flours", "graos"], ["beans", "graos"],
  ["snacks", "lanches"], ["biscuits", "lanches"], ["chocolates", "lanches"], ["confectioneries", "lanches"], ["sweets", "lanches"],
  ["fruits", "hortifruti"], ["vegetables", "hortifruti"],
];

export function categoryFromTags(tags: string[] = [], name = ""): Category {
  for (const [needle, cat] of OFF_CATEGORIES) {
    if (tags.some((t) => t.includes(needle))) return cat;
  }
  return guessCategory(name);
}

export function isValidBarcode(code: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(code);
}

export interface BarcodeLookup {
  found: boolean;
  source: "memoria" | "openfoodfacts" | "nenhum";
  prefill: Partial<FoodItem>;
}

/**
 * Look up a scanned barcode: first what we remembered from earlier scans
 * (works offline), then the free Open Food Facts database.
 */
export async function lookupBarcode(code: string, fetchImpl: typeof fetch = fetch): Promise<BarcodeLookup> {
  const known = await db.barcodes.get(code);
  if (known) {
    return {
      found: true,
      source: "memoria",
      prefill: {
        barcode: code, name: known.name, category: known.category, location: known.location, unit: known.unit,
        quantity: 1, ...(known.size ? { notes: `Embalagem: ${known.size}` } : {}),
      },
    };
  }
  try {
    const res = await fetchImpl(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_pt,generic_name_pt,brands,quantity,categories_tags`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (res.ok) {
      const data = await res.json();
      const p = data?.product;
      const baseName: string = (p?.product_name_pt || p?.product_name || p?.generic_name_pt || "").trim();
      if (data?.status === 1 && baseName) {
        const brand = String(p.brands ?? "").split(",")[0].trim();
        const name = brand && !baseName.toLowerCase().includes(brand.toLowerCase()) ? `${baseName} ${brand}` : baseName;
        const category = categoryFromTags(p.categories_tags, baseName);
        return {
          found: true,
          source: "openfoodfacts",
          prefill: {
            barcode: code, name, category, location: defaultLocation(category, baseName), unit: "un", quantity: 1,
            ...(p.quantity ? { notes: `Embalagem: ${String(p.quantity).trim()}` } : {}),
          },
        };
      }
    }
  } catch {
    /* offline or timeout: fall through to manual entry */
  }
  return { found: false, source: "nenhum", prefill: { barcode: code, quantity: 1, unit: "un" } };
}

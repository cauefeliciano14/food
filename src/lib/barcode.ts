import { netAllowed } from "./settings";
import { db } from "./db";
import { guessCategory } from "./shopping";
import { defaultLocation } from "./shelfLife";
import type { Category, FoodItem } from "./types";
import { packageSize, simplifyProductName } from "./productName";

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

/** Generic parent tags that say nothing about the food itself. */
const GENERIC_TAG = /(and-beverages|plant-based-foods$|^en:foods$|^en:groceries$|-based-foods$)/;

/**
 * Category: the simple product name decides first (arroz → grãos); otherwise
 * the most specific Open Food Facts tag (tags go general → specific).
 */
export function categoryFromTags(tags: string[] = [], name = ""): Category {
  const byName = guessCategory(name);
  if (byName !== "outros") return byName;
  for (const tag of [...tags].reverse()) {
    if (GENERIC_TAG.test(tag)) continue;
    const parts = tag.split(/[:-]/);
    for (const [needle, cat] of OFF_CATEGORIES) {
      if (parts.includes(needle)) return cat;
    }
  }
  return "outros";
}

/** Prefill from a raw product name + package size (also used to upgrade old memory). */
export function productPrefill(fullName: string, brands: string[], size: string | undefined, tags: string[] = []) {
  const name = simplifyProductName(fullName, brands);
  const category = categoryFromTags(tags, name);
  const pkg = packageSize(size);
  return {
    name,
    fullName: fullName.trim(),
    category,
    location: defaultLocation(category, name),
    quantity: pkg?.quantity ?? 1,
    unit: pkg?.unit ?? "un",
    ...(size && !pkg ? { notes: `Embalagem: ${size.trim()}` } : {}),
  };
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
  if (known && known.v !== 2 && netAllowed("produtos")) {
    // remembered by an older version: refresh from the database (brands, size) when online
    const fresh = await fetchOff(code, fetchImpl);
    if (fresh) return { found: true, source: "memoria", prefill: { ...fresh, location: known.location } };
  }
  if (known) {
    const base = known.v === 2
      ? {
          name: known.name, fullName: known.fullName, category: known.category, location: known.location,
          quantity: known.quantity ?? 1, unit: known.unit, ...(known.size ? { notes: `Embalagem: ${known.size}` } : {}),
        }
      : // remembered before names were simplified: redo it, keeping the user's place
        { ...productPrefill(known.name, [], known.size), location: known.location };
    return { found: true, source: "memoria", prefill: { barcode: code, ...base } };
  }
  const off = netAllowed("produtos") ? await fetchOff(code, fetchImpl) : null;
  if (off) return { found: true, source: "openfoodfacts", prefill: off };
  return { found: false, source: "nenhum", prefill: { barcode: code, quantity: 1, unit: "un" } };
}

async function fetchOff(code: string, fetchImpl: typeof fetch): Promise<Partial<FoodItem> | null> {
  try {
    const res = await fetchImpl(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_pt,generic_name_pt,brands,quantity,categories_tags`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.product;
    const baseName: string = (p?.product_name_pt || p?.product_name || p?.generic_name_pt || "").trim();
    if (data?.status !== 1 || !baseName) return null;
    const brands = String(p.brands ?? "").split(",").map((x: string) => x.trim()).filter(Boolean);
    const brand = brands[0] ?? "";
    const full = brand && !baseName.toLowerCase().includes(brand.toLowerCase()) ? `${baseName} ${brand}` : baseName;
    return { barcode: code, ...productPrefill(full, brands, p.quantity ? String(p.quantity) : undefined, p.categories_tags ?? []) };
  } catch {
    return null; // offline or timeout
  }
}

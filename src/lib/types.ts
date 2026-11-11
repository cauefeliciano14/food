export type Location = "geladeira" | "freezer" | "despensa" | "armario";

export type Category =
  | "hortifruti"
  | "carnes"
  | "peixes"
  | "laticinios"
  | "padaria"
  | "graos"
  | "enlatados"
  | "temperos"
  | "bebidas"
  | "congelados"
  | "lanches"
  | "outros";

export interface FoodItem {
  id?: number;
  name: string;
  quantity: number;
  unit: string;
  category: Category;
  location: Location;
  /** YYYY-MM-DD */
  purchaseDate: string;
  /** YYYY-MM-DD; empty string when unknown */
  expiryDate: string;
  notes?: string;
  /** original product name as read from the barcode database (name is the short one) */
  fullName?: string;
  /** YYYY-MM-DD when the package was opened (validity then follows freshness rules) */
  openedAt?: string;
  /** price paid per 1 `unit` (R$), when known — used to value waste */
  unitPrice?: number;
  barcode?: string;
  /** storage tip / why the date was adjusted (from "Organizar com IA") */
  tip?: string;
  /** when the AI last reviewed this item — the button only sends items not reviewed yet */
  aiReviewedAt?: number;
  createdAt: number;
}

export interface RecipeIngredient {
  name: string;
  amount?: string;
  optional?: boolean;
}

export interface Recipe {
  id?: number;
  title: string;
  minutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  favorite?: boolean;
  /** photo of the finished dish (small JPEG data URL), added by the user */
  photo?: string;
  source: "padrao" | "minha" | "ia";
  createdAt: number;
}

export type ShoppingSource = "manual" | "receita" | "acabou";

export interface ShoppingItem {
  id?: number;
  name: string;
  amount?: string;
  done: boolean;
  source: ShoppingSource;
  /** recipe titles that need this item */
  recipes?: string[];
  createdAt: number;
}

export type ConsumptionAction = "consumido" | "descartado";

export interface HistoryEntry {
  id?: number;
  itemName: string;
  category: Category;
  action: ConsumptionAction;
  date: string;
  quantity?: number;
  unit?: string;
  /** R$ value of the amount, when the item had a price */
  value?: number;
}

export type MealSlot = "almoco" | "jantar";

export interface MealPlanEntry {
  id?: number;
  /** YYYY-MM-DD */
  date: string;
  slot: MealSlot;
  recipeId: number;
}

export const MEAL_SLOTS: { value: MealSlot; label: string }[] = [
  { value: "almoco", label: "Almoço" },
  { value: "jantar", label: "Jantar" },
];

/** What we remember about a barcode after the first time it is scanned. */
export interface BarcodeInfo {
  code: string;
  name: string;
  category: Category;
  location: Location;
  unit: string;
  size?: string;
  fullName?: string;
  quantity?: number;
  /** 2 = name/category/quantity already simplified */
  v?: number;
}

export const LOCATIONS: { value: Location; label: string }[] = [
  { value: "geladeira", label: "Geladeira" },
  { value: "freezer", label: "Freezer" },
  { value: "despensa", label: "Despensa" },
  { value: "armario", label: "Armário" },
];

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "hortifruti", label: "Hortifrúti" },
  { value: "carnes", label: "Carnes" },
  { value: "peixes", label: "Peixes" },
  { value: "laticinios", label: "Laticínios e ovos" },
  { value: "padaria", label: "Padaria" },
  { value: "graos", label: "Grãos e massas" },
  { value: "enlatados", label: "Enlatados e conservas" },
  { value: "temperos", label: "Temperos e molhos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "congelados", label: "Congelados" },
  { value: "lanches", label: "Lanches e doces" },
  { value: "outros", label: "Outros" },
];

export const UNITS = ["un", "kg", "g", "L", "ml", "pct", "cx", "lata", "dz", "maço"];

export function categoryInfo(c: Category) {
  return CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[CATEGORIES.length - 1];
}
export function locationInfo(l: Location) {
  return LOCATIONS.find((x) => x.value === l) ?? LOCATIONS[2];
}

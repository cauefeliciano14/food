export type Location = "geladeira" | "freezer" | "despensa";

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
  source: "padrao" | "minha" | "ia";
  createdAt: number;
}

export type ConsumptionAction = "consumido" | "descartado";

export interface HistoryEntry {
  id?: number;
  itemName: string;
  category: Category;
  action: ConsumptionAction;
  date: string;
}

export const LOCATIONS: { value: Location; label: string; icon: string }[] = [
  { value: "geladeira", label: "Geladeira", icon: "🧊" },
  { value: "freezer", label: "Freezer", icon: "❄️" },
  { value: "despensa", label: "Despensa", icon: "🗄️" },
];

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "hortifruti", label: "Hortifrúti", icon: "🥬" },
  { value: "carnes", label: "Carnes", icon: "🥩" },
  { value: "peixes", label: "Peixes", icon: "🐟" },
  { value: "laticinios", label: "Laticínios e ovos", icon: "🧀" },
  { value: "padaria", label: "Padaria", icon: "🍞" },
  { value: "graos", label: "Grãos e massas", icon: "🌾" },
  { value: "enlatados", label: "Enlatados e conservas", icon: "🥫" },
  { value: "temperos", label: "Temperos e molhos", icon: "🧂" },
  { value: "bebidas", label: "Bebidas", icon: "🧃" },
  { value: "congelados", label: "Congelados", icon: "🧊" },
  { value: "lanches", label: "Lanches e doces", icon: "🍪" },
  { value: "outros", label: "Outros", icon: "📦" },
];

export const UNITS = ["un", "kg", "g", "L", "ml", "pct", "cx", "lata", "dz", "maço"];

export function categoryInfo(c: Category) {
  return CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[CATEGORIES.length - 1];
}
export function locationInfo(l: Location) {
  return LOCATIONS.find((x) => x.value === l) ?? LOCATIONS[2];
}

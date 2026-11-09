import type { Category, Location } from "./types";
import { tokens, canonical } from "./normalize";

/** Rough shelf-life (days) by category and storage place — used only as a suggestion. */
const BY_CATEGORY: Record<Category, Partial<Record<Location, number>> & { default: number }> = {
  hortifruti: { default: 7, geladeira: 7, despensa: 5, freezer: 180 },
  carnes: { default: 3, geladeira: 3, freezer: 120 },
  peixes: { default: 2, geladeira: 2, freezer: 90 },
  laticinios: { default: 10, geladeira: 10, freezer: 60 },
  padaria: { default: 4, despensa: 4, geladeira: 7, freezer: 60 },
  graos: { default: 180 },
  enlatados: { default: 365 },
  temperos: { default: 180 },
  bebidas: { default: 90 },
  congelados: { default: 90, freezer: 90, geladeira: 2 },
  lanches: { default: 60 },
  outros: { default: 30 },
};

/** Item-specific overrides (by canonical token). */
const BY_ITEM: Record<string, number> = {
  banana: 5,
  alface: 4,
  morango: 3,
  tomate: 6,
  cebola: 30,
  alho: 60,
  batata: 21,
  cenoura: 14,
  limao: 14,
  laranja: 14,
  maca: 21,
  ovo: 21,
  leite: 5,
  iogurte: 15,
  queijo: 15,
  manteiga: 60,
  requeijao: 20,
  cremedeleite: 180,
  pao: 4,
  frango: 2,
  carne: 3,
  linguica: 7,
  presunto: 5,
};

export function suggestShelfLifeDays(name: string, category: Category, location: Location): number {
  if (location === "freezer") {
    return BY_CATEGORY[category].freezer ?? 90;
  }
  for (const t of tokens(name).map(canonical)) {
    if (t in BY_ITEM) return BY_ITEM[t];
  }
  const c = BY_CATEGORY[category];
  return c[location] ?? c.default;
}

export function defaultLocation(category: Category): Location {
  switch (category) {
    case "carnes":
    case "peixes":
    case "laticinios":
      return "geladeira";
    case "congelados":
      return "freezer";
    default:
      return "despensa";
  }
}

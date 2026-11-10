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
  leitecondensado: 365,
  molhodetomate: 365,
  arroz: 365,
  feijao: 365,
  acucar: 730,
  sal: 1095,
  cafe: 180,
  achocolatado: 365,
  chocolate: 180,
  aveia: 270,
  biscoito: 120,
  oleo: 365,
  azeite: 540,
  atum: 1095,
  sardinha: 1095,
  milho: 730,
  ervilha: 730,
  macarrao: 365,
  farinha: 180,
  pao: 4,
  frango: 2,
  carne: 3,
  linguica: 7,
  presunto: 5,
};

export function suggestShelfLifeDays(name: string, category: Category, loc: Location): number {
  // A kitchen cabinet behaves like the pantry.
  const location: Location = loc === "armario" ? "despensa" : loc;
  if (location === "freezer") {
    return BY_CATEGORY[category].freezer ?? 90;
  }
  for (const t of tokens(name).map(canonical)) {
    if (t in BY_ITEM) return BY_ITEM[t];
  }
  const c = BY_CATEGORY[category];
  return c[location] ?? c.default;
}

/** Shelf-stable while sealed, even though their category usually goes in the fridge. */
const PANTRY_WHILE_SEALED = new Set(["leitecondensado", "cremedeleite", "molhodetomate", "leitedecoco", "atum", "sardinha", "milho", "ervilha"]);

export function defaultLocation(category: Category, name = ""): Location {
  if (name && tokens(name).map(canonical).some((t) => PANTRY_WHILE_SEALED.has(t))) return "despensa";
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

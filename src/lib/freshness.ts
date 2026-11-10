/**
 * What the app knows about how long food really lasts:
 *  - tolerance: how long past the printed date a SEALED item is usually still
 *    fine ("consumir preferencialmente antes de" — rice, sugar, cans…). Fresh
 *    meat, fish, milk and the like get zero.
 *  - after opening: how long it keeps once opened, and whether it must go to
 *    the fridge.
 * These are conservative household rules of thumb, not food-safety guarantees;
 * the UI always tells the user to check smell and look.
 */
import type { Category, FoodItem, Location } from "./types";
import { addDays, daysBetween, formatBR, today, type ExpiryStatus } from "./dates";
import { canonical, tokens } from "./normalize";

interface Rule {
  /** days past the printed date that a sealed item usually stays good */
  tolerance: number;
  /** days it keeps after opening */
  opened: number;
  /** must be refrigerated once opened */
  fridgeOnOpen?: boolean;
}

// Keyed by canonical token (see normalize.ts). First token of the name that matches wins.
const BY_ITEM: Record<string, Rule> = {
  // practically don't spoil
  sal: { tolerance: 3650, opened: 3650 },
  acucar: { tolerance: 3650, opened: 730 },
  mel: { tolerance: 3650, opened: 730 },
  vinagre: { tolerance: 1095, opened: 730 },
  // dry goods: printed date is "best before"
  arroz: { tolerance: 180, opened: 180 },
  macarrao: { tolerance: 180, opened: 180 },
  feijao: { tolerance: 180, opened: 180 },
  lentilha: { tolerance: 180, opened: 180 },
  grao: { tolerance: 180, opened: 180 },
  farinha: { tolerance: 60, opened: 90 },
  farinhademandioca: { tolerance: 90, opened: 120 },
  farinhaderosca: { tolerance: 60, opened: 90 },
  fuba: { tolerance: 60, opened: 90 },
  polvilho: { tolerance: 90, opened: 120 },
  aveia: { tolerance: 60, opened: 90 },
  cafe: { tolerance: 90, opened: 30 },
  cha: { tolerance: 180, opened: 180 },
  chocolate: { tolerance: 90, opened: 90 },
  achocolatado: { tolerance: 90, opened: 90 },
  biscoito: { tolerance: 30, opened: 14 },
  salgadinho: { tolerance: 15, opened: 5 },
  gelatina: { tolerance: 180, opened: 90 },
  fermento: { tolerance: 30, opened: 60 },
  tempero: { tolerance: 180, opened: 180 },
  caldo: { tolerance: 180, opened: 120 },
  oleo: { tolerance: 90, opened: 90 },
  azeite: { tolerance: 90, opened: 120 },
  // sealed cans/boxes keep long; opened they go to the fridge for days
  leitecondensado: { tolerance: 60, opened: 5, fridgeOnOpen: true },
  cremedeleite: { tolerance: 30, opened: 3, fridgeOnOpen: true },
  leitedecoco: { tolerance: 30, opened: 4, fridgeOnOpen: true },
  molhodetomate: { tolerance: 60, opened: 4, fridgeOnOpen: true },
  atum: { tolerance: 365, opened: 2, fridgeOnOpen: true },
  sardinha: { tolerance: 365, opened: 2, fridgeOnOpen: true },
  milho: { tolerance: 365, opened: 3, fridgeOnOpen: true },
  ervilha: { tolerance: 365, opened: 3, fridgeOnOpen: true },
  maionese: { tolerance: 30, opened: 30, fridgeOnOpen: true },
  ketchup: { tolerance: 90, opened: 90, fridgeOnOpen: true },
  mostarda: { tolerance: 90, opened: 90, fridgeOnOpen: true },
  geleia: { tolerance: 90, opened: 30, fridgeOnOpen: true },
  // UHT milk: sealed it's shelf-stable; open it's like fresh milk
  leite: { tolerance: 7, opened: 3, fridgeOnOpen: true },
  suco: { tolerance: 7, opened: 4, fridgeOnOpen: true },
  refrigerante: { tolerance: 30, opened: 3 },
  // fresh and chilled: the printed date is a real limit
  requeijao: { tolerance: 0, opened: 7, fridgeOnOpen: true },
  iogurte: { tolerance: 0, opened: 3, fridgeOnOpen: true },
  queijo: { tolerance: 0, opened: 10, fridgeOnOpen: true },
  presunto: { tolerance: 0, opened: 4, fridgeOnOpen: true },
  manteiga: { tolerance: 15, opened: 30, fridgeOnOpen: true },
  pao: { tolerance: 0, opened: 5 },
};

const BY_CATEGORY: Record<Category, Rule> = {
  hortifruti: { tolerance: 0, opened: 3 },
  carnes: { tolerance: 0, opened: 2, fridgeOnOpen: true },
  peixes: { tolerance: 0, opened: 1, fridgeOnOpen: true },
  laticinios: { tolerance: 0, opened: 5, fridgeOnOpen: true },
  padaria: { tolerance: 0, opened: 5 },
  graos: { tolerance: 120, opened: 120 },
  enlatados: { tolerance: 365, opened: 3, fridgeOnOpen: true },
  temperos: { tolerance: 180, opened: 180 },
  bebidas: { tolerance: 30, opened: 5, fridgeOnOpen: true },
  congelados: { tolerance: 0, opened: 2 },
  lanches: { tolerance: 30, opened: 14 },
  outros: { tolerance: 0, opened: 7 },
};

export function ruleFor(item: Pick<FoodItem, "name" | "category" | "location">): Rule {
  for (const t of tokens(item.name).map(canonical)) {
    if (t in BY_ITEM) return BY_ITEM[t];
  }
  return BY_CATEGORY[item.category] ?? BY_CATEGORY.outros;
}

type Dated = Pick<FoodItem, "name" | "category" | "location" | "expiryDate" | "openedAt">;

/** The date that actually matters: for opened items, the earlier of "opened + keeps" and the printed date. */
export function effectiveDate(item: Dated): string {
  if (!item.openedAt) return item.expiryDate;
  const afterOpen = addDays(item.openedAt, ruleFor(item).opened);
  if (!item.expiryDate) return afterOpen;
  return afterOpen < item.expiryDate ? afterOpen : item.expiryDate;
}

/** Days until the effective date (negative = past). null when there's no date. */
export function daysLeft(item: Dated, ref = today()): number | null {
  const d = effectiveDate(item);
  return d ? daysBetween(ref, d) : null;
}

/** Sealed item past its printed date but within the usual tolerance. */
function withinTolerance(item: Dated, days: number): boolean {
  return !item.openedAt && days < 0 && -days <= ruleFor(item).tolerance;
}

export function itemStatus(item: Dated, ref = today()): ExpiryStatus {
  const d = daysLeft(item, ref);
  if (d == null) return "sem-data";
  if (d < 0) return withinTolerance(item, d) ? "passou" : "vencido";
  if (d === 0) return "hoje";
  if (d <= 3) return "urgente";
  if (d <= 7) return "breve";
  return "ok";
}

/** Still fit for recipes/suggestions (not really expired, has quantity). */
export function isUsable(item: Dated & Pick<FoodItem, "quantity">, ref = today()): boolean {
  return item.quantity > 0 && itemStatus(item, ref) !== "vencido";
}

export function itemLabel(item: Dated, ref = today()): string {
  const date = effectiveDate(item);
  if (!date) return "sem validade";
  const d = daysBetween(ref, date);
  const opened = !!item.openedAt && date !== item.expiryDate;
  if (d < 0 && withinTolerance(item, d)) return d === -1 ? "passou ontem" : `passou há ${-d} dias`;
  if (d < -1) return `venceu há ${-d} dias`;
  if (d === -1) return "venceu ontem";
  const verb = opened ? "use até" : "vence";
  if (d === 0) return opened ? "use hoje" : "vence hoje";
  if (d === 1) return opened ? "use até amanhã" : "vence amanhã";
  if (d <= 30) return opened ? `use em ${d} dias` : `vence em ${d} dias`;
  return `${verb} ${formatBR(date)}`;
}

/** Explanation shown in the item details. */
export function freshnessNote(item: Dated, ref = today()): string | null {
  const r = ruleFor(item);
  const st = itemStatus(item, ref);
  if (st === "passou") {
    return `Passou da data impressa, mas ${item.name.toLowerCase()} fechado costuma durar mais. Antes de usar, confira cheiro, cor e se a embalagem está intacta.`;
  }
  if (item.openedAt) {
    const days = r.opened >= 365 ? `${Math.round(r.opened / 365)} ano(s)` : `${r.opened} dia(s)`;
    return `Aberto em ${formatBR(item.openedAt)}. Depois de aberto costuma durar ${days}${r.fridgeOnOpen ? " na geladeira" : ""}.`;
  }
  return null;
}

/** Suggested place after opening (e.g. condensed milk goes to the fridge). */
export function locationAfterOpening(item: Pick<FoodItem, "name" | "category" | "location">): Location {
  return ruleFor(item).fridgeOnOpen && item.location !== "freezer" ? "geladeira" : item.location;
}

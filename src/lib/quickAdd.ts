import { normalize } from "./normalize";

/**
 * Parses free text like "6 ovos, 1kg arroz e 2 litros de leite" (typed or
 * dictated) into items. Quantity and unit are optional; defaults to 1 un.
 */
export interface QuickItem {
  name: string;
  quantity: number;
  unit: string;
}

const NUMBER_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, quinze: 15, vinte: 20, trinta: 30, meio: 0.5, meia: 0.5,
};

// unit word (normalized) → app unit, with an optional multiplier (dúzia = 12 un is kept as "dz")
const UNIT_WORDS: Record<string, string> = {
  kg: "kg", kgs: "kg", quilo: "kg", quilos: "kg", kilo: "kg", kilos: "kg",
  g: "g", gr: "g", grs: "g", grama: "g", gramas: "g",
  l: "L", lt: "L", lts: "L", litro: "L", litros: "L",
  ml: "ml", mls: "ml",
  un: "un", und: "un", unid: "un", unidade: "un", unidades: "un",
  pct: "pct", pacote: "pct", pacotes: "pct",
  cx: "cx", caixa: "cx", caixas: "cx", caixinha: "cx", caixinhas: "cx",
  lata: "lata", latas: "lata", latinha: "lata", latinhas: "lata",
  dz: "dz", duzia: "dz", duzias: "dz",
  maco: "maço", macos: "maço",
  garrafa: "un", garrafas: "un", pote: "un", potes: "un", vidro: "un", vidros: "un", bandeja: "un", bandejas: "un", saco: "pct", sacos: "pct",
};

const FILLER = new Set(["de", "do", "da", "dos", "das"]);

function toNumber(tok: string): number | null {
  const n = normalize(tok);
  if (n in NUMBER_WORDS) return NUMBER_WORDS[n];
  const m = tok.replace(",", ".").match(/^\d+(\.\d+)?$/);
  return m ? Number(m[0]) : null;
}

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function parseOne(raw: string): QuickItem | null {
  // Split glued forms: "1kg" → "1 kg", "500g" → "500 g", "2L" → "2 L"
  const text = raw.trim().replace(/(\d)([a-zA-Zç]+)/g, "$1 $2").replace(/\s+/g, " ");
  if (!text) return null;
  const toks = text.split(" ");
  let quantity: number | null = null;
  let unit: string | null = null;
  const nameToks: string[] = [];

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const num: number | null = quantity == null ? toNumber(t) : null;
    if (num != null) {
      quantity = num;
      continue;
    }
    const u = UNIT_WORDS[normalize(t)];
    // A unit word right after a number (or at the start, e.g. "pacote de café")
    if (u && unit == null && (quantity != null || nameToks.length === 0)) {
      unit = u;
      if (FILLER.has(normalize(toks[i + 1] ?? ""))) i++;
      continue;
    }
    if (FILLER.has(normalize(t)) && nameToks.length === 0) continue;
    nameToks.push(t);
  }
  // "meia dúzia de ovos" → 0.5 dz → 6 un; "dúzia de ovos" → 1 dz → 12 un
  if (unit === "dz") {
    quantity = (quantity ?? 1) * 12;
    unit = "un";
  }
  const name = nameToks.join(" ").replace(/^(de|do|da)\s+/i, "").trim();
  if (!name) return null;
  return { name: cap(name.toLowerCase()), quantity: quantity ?? 1, unit: unit ?? "un" };
}

/**
 * Splits on commas (but not decimal commas like "1,5 kg"), semicolons, new
 * lines and the word "e" ("arroz e feijão").
 */
export function parseQuickAdd(text: string): QuickItem[] {
  return text
    .split(/(?<!\d),|,(?!\d)|[;\n]+|\s+e\s+/i)
    .map(parseOne)
    .filter((x): x is QuickItem => x != null);
}

/**
 * Product from a photo of its package (when the barcode isn't in any
 * database): the biggest food-looking text is the name, plus the net weight
 * and, if printed with a VAL/VENC label, the expiry date.
 */
import type { FoodItem } from "./types";
import { canonical, normalize, tokens } from "./normalize";
import { guessCategory } from "./shopping";
import { defaultLocation, suggestShelfLifeDays } from "./shelfLife";
import { packageSize, simplifyProductName } from "./productName";
import { parseExpiryFromText } from "./expiryOcr";
import { addDays, today } from "./dates";

export interface LabelLine {
  text: string;
  height: number;
}

const NOT_A_NAME = /(valor energ|informa[cç][aã]o nutricional|ingredientes|cont[eé]m|al[eé]rgico|gl[uú]ten|lactose|ind[uú]stria|cnpj|sac\b|0800|www\.|\.com|peso l[ií]quido|conte[uú]do|lote|fabrica|validade|venc|conservar|modo de|prepar|por[cç][aã]o|kcal|kj\b|%vd|registro|ms\s?\d|imagem ilustrativa|sugest[aã]o|produto de|origem|distribu[ií]do|embalado|aten[cç][aã]o)/i;

function looksLikeFood(text: string): boolean {
  return tokens(text).map(canonical).some((t) => guessCategory(t) !== "outros");
}

function scoreLine(l: LabelLine, maxH: number): number {
  const t = l.text.trim();
  const letters = (t.match(/\p{L}/gu) ?? []).length;
  if (letters < 3 || t.length > 42 || NOT_A_NAME.test(t)) return -Infinity;
  if (letters / t.replace(/\s/g, "").length < 0.6) return -Infinity; // mostly digits/symbols
  let s = maxH > 0 ? (l.height / maxH) * 10 : 0; // bigger letters → more likely the name
  if (looksLikeFood(t)) s += 8;
  if (t.split(/\s+/).length > 6) s -= 3;
  return s;
}

export interface PhotoProduct {
  prefill: Partial<FoodItem>;
  /** the raw line chosen as the name (shown as "Nome na embalagem") */
  rawName: string;
}

export function productFromLabel(lines: LabelLine[], ref = today()): PhotoProduct | null {
  const clean = lines.map((l) => ({ text: l.text.replace(/\s+/g, " ").trim(), height: l.height })).filter((l) => l.text);
  if (clean.length === 0) return null;
  const maxH = Math.max(...clean.map((l) => l.height), 0);
  const ranked = clean.map((l) => ({ l, s: scoreLine(l, maxH) })).filter((x) => x.s > -Infinity).sort((a, b) => b.s - a.s);
  if (ranked.length === 0) return null;

  let rawName = ranked[0].l.text;
  // Names often wrap over two big lines ("ARROZ" / "INTEGRAL"): join a similar-size neighbour.
  const idx = clean.indexOf(ranked[0].l);
  const next = clean[idx + 1];
  if (next && rawName.split(/\s+/).length === 1 && ranked.some((r) => r.l === next) && Math.abs(next.height - ranked[0].l.height) <= ranked[0].l.height * 0.25 && (rawName + " " + next.text).length <= 42) {
    rawName = `${rawName} ${next.text}`;
  }

  const all = clean.map((l) => l.text).join("\n");
  const weight = all.match(/(peso l[ií]quido|conte[uú]do( l[ií]quido)?|peso|net wt)\s*:?\s*(\d+([.,]\d+)?\s*(kg|g|ml|l)\b)/i)?.[3]
    ?? all.match(/(?<![\d.,])(\d+([.,]\d+)?\s?(kg|ml|l)\b|\d{2,4}\s?g\b)/i)?.[1];
  const pkg = packageSize(weight);

  const name = simplifyProductName(rawName);
  const category = guessCategory(name);
  const location = defaultLocation(category, name);
  const expiry = /\b(VAL|VALIDADE|VENC|VCTO|CONSUMIR)/i.test(normalize(all).toUpperCase()) ? parseExpiryFromText(all, ref).best : null;

  return {
    rawName,
    prefill: {
      name,
      fullName: rawName,
      category,
      location,
      quantity: pkg?.quantity ?? 1,
      unit: pkg?.unit ?? "un",
      expiryDate: expiry ?? addDays(ref, suggestShelfLifeDays(name, category, location)),
      ...(weight && !pkg ? { notes: `Embalagem: ${weight.trim()}` } : {}),
    },
  };
}

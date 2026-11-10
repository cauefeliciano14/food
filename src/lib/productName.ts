/**
 * Package names from barcode databases are long ("Arroz Saboroso Integral
 * Tipo 1 Longo Fino 5kg"). The pantry shows a short, popular name
 * ("Arroz integral"); the original is kept as fullName.
 */
import { normalize } from "./normalize";

const NOISE_WORDS = new Set([
  "tipo", "t1", "t2", "premium", "especial", "extra", "original", "gourmet", "select", "selecao", "selecionado",
  "qualidade", "longo", "fino", "agulhinha", "nobre", "polido", "pacote", "pct", "embalagem", "emb", "un", "und",
  "unidade", "unidades", "kg", "g", "gr", "ml", "l", "lt", "litro", "litros", "grs", "novo", "nova", "classic",
  "classico", "tradicional", "pote", "lata", "caixa", "garrafa", "sache", "refil", "zero", "light", "de", "do", "da",
]);
const KEEP_TAIL = new Set(["de", "do", "da", "e", "com"]); // allowed inside the name ("leite de coco"), not at the end

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function simplifyProductName(full: string, brands: string[] = []): string {
  // A word repeated in the name is usually the brand glued at the end ("Arroz Saboroso ... Saboroso").
  const counts = new Map<string, number>();
  full.split(/\s+/).forEach((w, i) => { if (i > 0 && w.length > 2) counts.set(normalize(w), (counts.get(normalize(w)) ?? 0) + 1); });
  const repeated = full.split(/\s+/).filter((w, i) => i > 0 && (counts.get(normalize(w)) ?? 0) >= 2);
  brands = [...brands, ...new Set(repeated)];
  let text = ` ${full} `;
  for (const b of brands.map((x) => x.trim()).filter((x) => x.length > 1)) {
    text = text.replace(new RegExp(`\\s${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "gi"), " ");
  }
  text = text
    .replace(/\(.*?\)/g, " ")
    .replace(/\b\d+\s*x\s*\d+([.,]\d+)?\s*(kg|g|gr|ml|l|lt)?\b/gi, " ")
    .replace(/\b\d+([.,]\d+)?\s*(kg|g|gr|grs|ml|l|lt|litros?|un|und)\b/gi, " ")
    .replace(/\btipo\s*\d\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(" ").filter((w) => w && !/^\d+$/.test(w));
  const out: string[] = [];
  for (const w of words) {
    const n = normalize(w);
    if (NOISE_WORDS.has(n) && !(KEEP_TAIL.has(n) && out.length > 0)) continue;
    out.push(w.toLowerCase());
    if (out.length >= 3) break;
  }
  while (out.length && KEEP_TAIL.has(normalize(out[out.length - 1]))) out.pop();
  const simple = cap(out.join(" "));
  return simple || cap(full.split(/\s+/).slice(0, 3).join(" ").toLowerCase());
}

/**
 * Package size → pantry quantity. Bulk sizes become the real quantity
 * ("5 kg" → 5 kg, "1 L" → 1 L, "12 x 200 ml" → 12 un); small packages stay
 * counted by unit (a 395 g can is "1 un").
 */
export function packageSize(raw: string | undefined | null): { quantity: number; unit: string } | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(",", ".").replace(/\s+/g, " ").trim();
  const multi = s.match(/^(\d+)\s*x\s*\d/);
  if (multi) return { quantity: Number(multi[1]), unit: "un" };
  const m = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|grs|ml|l|lt|litros?)\b/);
  if (!m) return null;
  const v = Number(m[1]);
  const u = m[2];
  if (u === "kg") return { quantity: v, unit: "kg" };
  if (["l", "lt", "litro", "litros"].includes(u)) return { quantity: v, unit: "L" };
  if (["g", "gr", "grs"].includes(u) && v >= 1000) return { quantity: v / 1000, unit: "kg" };
  if (u === "ml" && v >= 1000) return { quantity: v / 1000, unit: "L" };
  return null;
}

import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { normalize } from "./normalize";

/**
 * NFC-e (cupom fiscal eletrônico) via QR code: the QR holds a link to the
 * state SEFAZ page that lists every item with quantity and price. Reading it
 * is free and exact — no OCR, no AI.
 *
 * Browsers block reading that page from another site (CORS), so this works in
 * the Android app, where the request is made natively.
 */

export function isNfceUrl(text: string): boolean {
  return /^https?:\/\//i.test(text) && /(nfce|nfe|fazenda|sefaz|sef\.|fiscal)/i.test(text) && /[?&](p|chNFe)=/i.test(text);
}

export class NfceNeedsAppError extends Error {
  constructor() {
    super("No navegador a SEFAZ bloqueia a leitura da nota. Use o app Android (APK) — lá funciona.");
  }
}

export async function fetchNfceHtml(url: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.get({
      url,
      responseType: "text",
      headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "pt-BR,pt;q=0.9" },
      connectTimeout: 15000,
      readTimeout: 20000,
    });
    if (res.status >= 400) throw new Error(`A SEFAZ respondeu com erro (${res.status}). Tente de novo em alguns minutos.`);
    return typeof res.data === "string" ? res.data : String(res.data ?? "");
  }
  try {
    const res = await fetch(url);
    return await res.text();
  } catch {
    throw new NfceNeedsAppError();
  }
}

export interface NfceItem {
  rawName: string;
  quantity: number;
  unit: string; // as printed: UN, KG, ...
  unitPrice: number;
  total: number;
}

export interface NfceData {
  store: string;
  purchaseDate: string; // YYYY-MM-DD or ""
  items: NfceItem[];
}

/** "1.234,56" → 1234.56 */
export function brNumber(s: string | null | undefined): number {
  if (!s) return 0;
  const m = s.replace(/\s/g, "").match(/-?[\d.]*,?\d+/);
  if (!m) return 0;
  const v = m[0].includes(",") ? m[0].replace(/\./g, "").replace(",", ".") : m[0];
  return Number(v) || 0;
}

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** Text of an element after its "Label:" part, e.g. "Qtde.:1,5" → "1,5". */
function afterLabel(el: Element | null): string {
  if (!el) return "";
  const t = clean(el.textContent);
  const i = t.indexOf(":");
  return clean(i >= 0 ? t.slice(i + 1) : t);
}

/**
 * Parses the national NFC-e consultation layout (SP, RS, PR, SC, BA, GO, PE,
 * RJ and most other states): a #tabResult table whose rows carry spans
 * .txtTit (name), .Rqtd (quantity), .RUN (unit), .RvlUnit (unit price) and
 * .valor (line total).
 */
export function parseNfceHtml(html: string): NfceData {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = [...doc.querySelectorAll("#tabResult tr, table.tabResult tr")];
  const candidates = rows.length ? rows : [...doc.querySelectorAll("tr")].filter((r) => r.querySelector(".Rqtd"));
  const items: NfceItem[] = [];
  for (const row of candidates) {
    const nameEl = [...row.querySelectorAll(".txtTit")].find((e) => !e.classList.contains("noWrap") && !e.querySelector(".valor"));
    const rawName = clean(nameEl?.textContent);
    if (!rawName) continue;
    const quantity = brNumber(afterLabel(row.querySelector(".Rqtd")));
    const unit = afterLabel(row.querySelector(".RUN")).toUpperCase() || "UN";
    const unitPrice = brNumber(afterLabel(row.querySelector(".RvlUnit")));
    const total = brNumber(row.querySelector(".valor")?.textContent);
    items.push({ rawName, quantity: quantity > 0 ? quantity : 1, unit, unitPrice: unitPrice || (quantity ? total / quantity : 0), total });
  }
  if (items.length === 0) {
    throw new Error("Não reconheci a página desta nota (o layout da SEFAZ do seu estado pode ser diferente). Use a foto com IA ou adicione manualmente.");
  }
  const store = clean(doc.querySelector("#u20, .txtTopo")?.textContent);
  const text = clean(doc.body?.textContent);
  const m = text.match(/Emiss[ãa]o:?\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  return { store, purchaseDate: m ? `${m[3]}-${m[2]}-${m[1]}` : "", items };
}

const UNIT_MAP: Record<string, string> = {
  UN: "un", UND: "un", UNID: "un", UNI: "un", U: "un", PC: "un", PÇ: "un",
  KG: "kg", KGS: "kg", G: "g", GR: "g", GRS: "g",
  L: "L", LT: "L", LTS: "L", LITRO: "L", ML: "ml",
  PCT: "pct", PT: "pct", PACOTE: "pct", CX: "cx", CAIXA: "cx", LATA: "lata", DZ: "dz", DUZIA: "dz", MC: "maço", MAÇO: "maço", MACO: "maço",
  BDJ: "un", BJ: "un", FD: "pct", SC: "pct",
};

export function mapUnit(u: string): string {
  return UNIT_MAP[u.toUpperCase().replace(/[^A-ZÇ]/g, "")] ?? "un";
}

/** Common receipt abbreviations → readable words (keys are normalized). */
const ABBR: Record<string, string> = {
  fgo: "frango", frgo: "frango", fr: "frango", pto: "peito", sobrecx: "sobrecoxa", cx: "", qjo: "queijo", qj: "queijo",
  muss: "mussarela", mus: "mussarela", muc: "mussarela", mucar: "mussarela", req: "requeijão", iog: "iogurte",
  mant: "manteiga", marg: "margarina", cr: "creme", lte: "leite", leit: "leite", lt: "leite", int: "integral", desn: "desnatado",
  semid: "semidesnatado", cond: "condensado", bisc: "biscoito", refrig: "refrigerante", refri: "refrigerante",
  mac: "macarrão", macarr: "macarrão", esp: "espaguete", feij: "feijão", fj: "feijão", arr: "arroz", acuc: "açúcar", acucar: "açúcar",
  far: "farinha", trig: "trigo", tom: "tomate", ceb: "cebola", bat: "batata", ban: "banana", lim: "limão", alf: "alface",
  cen: "cenoura", ovos: "ovos", ovo: "ovos", bco: "branco", vml: "vermelho", carn: "carne", bov: "bovina", moid: "moída",
  ling: "linguiça", calab: "calabresa", pres: "presunto", azeit: "azeite", oleo: "óleo", sard: "sardinha",
  choc: "chocolate", achoc: "achocolatado", cafe: "café", suc: "suco", agua: "água", min: "mineral", cong: "congelado",
  hig: "higiênico", pap: "papel", det: "detergente", deterg: "detergente", sab: "sabão", amac: "amaciante",
};

const NON_FOOD = [
  "detergente", "sabao", "papel higienico", "higienico", "amaciante", "desinfetante", "esponja", "shampoo", "condicionador",
  "sabonete", "creme dental", "escova", "saco lixo", "saco p lixo", "alcool", "agua sanitaria", "alvejante", "limpador",
  "guardanapo", "fralda", "absorvente", "desodorante", "pilha", "vela", "fosforo", "inseticida", "multiuso", "lustra",
  "papel toalha", "aluminio", "filme pvc", "racao", "sacola", "lampada", "cotonete", "fio dental",
];

/** "PTO FGO SADIA KG 1KG" → "Peito frango sadia" */
export function prettyName(raw: string): string {
  const words = raw
    .replace(/\(.*?\)/g, " ")
    .replace(/\b\d+[.,]?\d*\s?(KG|G|GR|ML|L|LT|UN|UND|CX|PCT|M)\b/gi, " ")
    .replace(/\b(KG|UN|UND|PCT|CX)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !/^\d+$/.test(w))
    .map((w) => {
      const key = normalize(w);
      return key in ABBR ? ABBR[key] : w.toLowerCase();
    })
    .filter(Boolean);
  const s = words.join(" ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : clean(raw);
}

export function looksLikeFood(name: string): boolean {
  const n = normalize(name);
  return !NON_FOOD.some((w) => n.includes(w));
}

/** Text normalization + ingredient matching between pantry items and recipes. */

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "com", "sem", "em", "a", "o", "as", "os", "para",
  "tipo", "kg", "g", "gr", "ml", "l", "lt", "un", "und", "pct", "pc", "cx", "c", "s",
  "integral", "tradicional", "extra", "fresco", "fresca", "frescos", "frescas", "picado",
  "picada", "ralado", "ralada", "moido", "moida", "inteiro", "inteira", "grande", "pequeno",
  "pequena", "media", "medio", "maduro", "madura", "bandeja", "pacote", "lata", "vidro",
  "refinado", "refinada", "especial", "premium", "light", "zero", "natural",
]);

/** Very small Portuguese singularizer — good enough for food words. */
export function singular(w: string): string {
  if (w.length <= 3) return w;
  if (w.endsWith("oes") || w.endsWith("aes")) return w.slice(0, -3) + "ao";
  if (w.endsWith("ais")) return w.slice(0, -3) + "al";
  if (w.endsWith("eis")) return w.slice(0, -3) + "el";
  if (w.endsWith("ns")) return w.slice(0, -2) + "m";
  if (w.endsWith("res") || w.endsWith("zes")) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/** Multi-word products that must not be confused with their parts. */
const PHRASES: [RegExp, string][] = [
  [/\bleite condensado\b/g, "leitecondensado"],
  [/\bcreme de leite\b/g, "cremedeleite"],
  [/\bleite de coco\b/g, "leitedecoco"],
  [/\b(molho|extrato|polpa|passata) de tomate\b/g, "molhodetomate"],
  [/\b(molho|extrato|polpa) tomate\b/g, "molhodetomate"],
  [/\bcheiro verde\b/g, "cheiroverde"],
  [/\bpao de forma\b/g, "pao"],
  [/\bcaldo de (galinha|carne|legumes)\b/g, "caldo"],
  [/\bfarinha de mandioca\b/g, "farinhademandioca"],
  [/\bfarinha de rosca\b/g, "farinhaderosca"],
  [/\bmilho verde\b/g, "milho"],
  [/\bbatata doce\b/g, "batatadoce"],
];

export function tokens(s: string): string[] {
  let n = normalize(s);
  for (const [re, rep] of PHRASES) n = n.replace(re, rep);
  return n
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w) && !/^\d+$/.test(w))
    .map(singular);
}

/** Synonyms / common receipt abbreviations, mapped to a canonical token. */
const ALIASES: Record<string, string> = {
  tomate: "tomate",
  tom: "tomate",
  cebol: "cebola",
  bat: "batata",
  frango: "frango",
  fgo: "frango",
  peito: "frango",
  coxa: "frango",
  sobrecoxa: "frango",
  mussarela: "queijo",
  mucarela: "queijo",
  muçarela: "queijo",
  parmesao: "queijo",
  prato: "queijo",
  requeijao: "requeijao",
  leite: "leite",
  manteiga: "manteiga",
  margarina: "manteiga",
  macarrao: "macarrao",
  espaguete: "macarrao",
  penne: "macarrao",
  parafuso: "macarrao",
  massa: "macarrao",
  arroz: "arroz",
  feijao: "feijao",
  carioca: "feijao",
  ovo: "ovo",
  ovos: "ovo",
  alho: "alho",
  cenoura: "cenoura",
  banana: "banana",
  pao: "pao",
  bisnaguinha: "pao",
  carne: "carne",
  patinho: "carne",
  acem: "carne",
  alcatra: "carne",
  maminha: "carne",
  coxao: "carne",
  musculo: "carne",
  picanha: "carne",
  bovina: "carne",
  bovino: "carne",
  linguica: "linguica",
  calabresa: "linguica",
  presunto: "presunto",
  atum: "atum",
  sardinha: "sardinha",
  tilapia: "peixe",
  salmao: "peixe",
  merluza: "peixe",
  peixe: "peixe",
  creme: "cremedeleite",
  iogurte: "iogurte",
  farinha: "farinha",
  trigo: "farinha",
  acucar: "acucar",
  oleo: "oleo",
  azeite: "azeite",
  limao: "limao",
  laranja: "laranja",
  abobrinha: "abobrinha",
  brocolis: "brocolis",
  brocoli: "brocolis",
  espinafre: "espinafre",
  alface: "alface",
  pimentao: "pimentao",
  milho: "milho",
  ervilha: "ervilha",
  salsinha: "cheiroverde",
  cebolinha: "cheiroverde",
  salsa: "cheiroverde",
  coentro: "coentro",
  mandioca: "mandioca",
  aipim: "mandioca",
  macaxeira: "mandioca",
  aveia: "aveia",
  chocolate: "chocolate",
  cacau: "chocolate",
  achocolatado: "chocolate",
  bacon: "bacon",
  cogumelo: "cogumelo",
  champignon: "cogumelo",
  shimeji: "cogumelo",
  abobora: "abobora",
  morango: "morango",
  maca: "maca",
  mamao: "mamao",
  // Head words of processed products — present so that e.g. "SUCO DE LARANJA"
  // is not treated as laranja, nor "MOLHO DE ALHO" as alho.
  molho: "molho",
  cafe: "cafe",
  mel: "mel",
  fuba: "fuba",
  polvilho: "polvilho",
  lentilha: "lentilha",
  maionese: "maionese",
  ketchup: "ketchup",
  catchup: "ketchup",
  mostarda: "mostarda",
  fermento: "fermento",
  vinagre: "vinagre",
  suco: "suco",
  bolo: "bolo",
  biscoito: "biscoito",
  bolacha: "biscoito",
  sorvete: "sorvete",
  tempero: "tempero",
  refrigerante: "refrigerante",
  refri: "refrigerante",
  gelatina: "gelatina",
  doce: "doce",
  geleia: "geleia",
  salgadinho: "salgadinho",
  chips: "salgadinho",
};

export function canonical(word: string): string {
  return ALIASES[word] ?? word;
}

/** Ingredients we assume every home has, so they never block a recipe. */
const STAPLES = new Set(["sal", "agua", "pimenta", "oleo", "acucar", "azeite", "vinagre"]);

export function isStaple(ingredientName: string): boolean {
  const t = tokens(ingredientName).map(canonical);
  return t.length > 0 && t.length <= 2 && STAPLES.has(t[0]);
}

/** Key token of a recipe ingredient = first meaningful word ("peito de frango" → frango). */
export function ingredientKeys(name: string): string[] {
  return tokens(name).map(canonical);
}

const KNOWN = new Set(Object.values(ALIASES));

/**
 * True when a pantry item satisfies a recipe ingredient.
 * Rule: the ingredient's primary token (first canonical word) must appear among
 * the item's canonical tokens. E.g. ingredient "queijo mussarela" → "queijo";
 * item "MUCARELA FATIADA 200G" → ["queijo", "fatiada"] ✓.
 */
export function itemMatchesIngredient(itemName: string, ingredientName: string): boolean {
  const ing = ingredientKeys(ingredientName);
  if (ing.length === 0) return false;
  const itemTokens = tokens(itemName).map(canonical);
  if (!itemTokens.includes(ing[0])) return false;
  // "FILE DE PEITO DE FRANGO" matches "frango", but "MOLHO DE ALHO" must not
  // match "alho": if the item starts with a different known food word, reject.
  const head = itemTokens[0];
  return head === ing[0] || !KNOWN.has(head);
}

/**
 * Turns text read from cookbook pages (OCR) — or pasted from the Claude app —
 * into a recipe draft: title, ingredients (name + amount), steps, servings, time.
 */
import type { RecipeIngredient } from "./types";

export interface RecipeDraft {
  title: string;
  minutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
}

const ING_HEAD = /^\s*(ingredientes?|voc[eê] vai precisar( de)?|lista de ingredientes)\s*:?\s*$/i;
const STEP_HEAD = /^\s*(modo de (preparo|fazer)|preparo|como (fazer|preparar)|instru[cç][oõ]es|prepara[cç][aã]o|passo a passo)\s*:?\s*$/i;
const SUB_HEAD = /^\s*(massa|recheio|cobertura|calda|molho|montagem|para (a|o) \w+|creme|farofa|base)\s*:?\s*$/i;
const NOISE = /^\s*(\d{1,3}|p[aá]g(ina)?\.?\s*\d+|dica:?.*|rendimento:?.*|tempo de preparo:?.*|rende:?.*|por[cç](ões|ão).*)\s*$/i;
const BULLET = /^\s*([•·●▪◦*\-–—]|o(?=\s)|\d{1,2}\s*[.)]|\(\d{1,2}\))\s*/;

const UNIT = String.raw`(x[ií]caras?( \(ch[aá]\))?|colher(es)?( \(?de )?(sopa|ch[aá]|caf[eé]|sobremesa)?\)?|latas?|caixas?|caixinhas?|copos?( americanos?)?|pacotes?|potes?|vidros?|kg|g|gr|gramas?|ml|l|litros?|pitadas?|dentes?|unidades?|fatias?|ma[cç]os?|pedacos?|peda[cç]os?|ramos?|folhas?|tabletes?|envelopes?|sach[eê]s?|punhados?|fio|xic\.?|c\. ?\(?sopa\)?|c\. ?\(?ch[aá]\)?)`;
const QTY = String.raw`((\d+\s+)?\d+([.,]\d+)?(\s*/\s*\d+)?|[½¼¾⅓⅔]|meia|meio|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis)`;
const ING_RE = new RegExp(String.raw`^${QTY}\s*(?:${UNIT}\.?(?:\s*\([^)]{1,14}\))?)?\s*(?:\b(de|do|da|dos|das)\b\s+)?(.+)$`, "i");

export function parseIngredientLine(raw: string): RecipeIngredient | null {
  let line = raw.replace(BULLET, "").replace(/\s+/g, " ").trim();
  if (!line) return null;
  let optional = false;
  if (/\(?\s*opcional\s*\)?/i.test(line)) {
    optional = true;
    line = line.replace(/\(?\s*opcional\s*\)?/i, "").trim();
  }
  let amount = "";
  const gosto = line.match(/^(.*?)[,\s]+(a gosto|q\.?\s?b\.?|quanto baste|para untar|para polvilhar)\.?$/i);
  if (gosto) {
    line = gosto[1].trim();
    amount = gosto[2].toLowerCase();
  }
  const m = line.match(ING_RE);
  if (m) {
    const name = m[m.length - 1].trim();
    const head = line.slice(0, line.length - name.length).replace(/\s+(de|do|da|dos|das)\s*$/i, "").trim();
    if (name && head) return { name: cleanName(name), amount: [head, amount].filter(Boolean).join(" "), ...(optional ? { optional } : {}) };
  }
  return { name: cleanName(line), ...(amount ? { amount } : {}), ...(optional ? { optional } : {}) };
}

function cleanName(s: string) {
  const t = s.replace(/[.;:,]+$/, "").trim();
  return t ? t[0].toLowerCase() + t.slice(1) : t;
}

/** Joins OCR lines that are continuations (start in lowercase or after a hyphenated break). */
function joinContinuations(lines: string[], isItemStart: (l: string) => boolean): string[] {
  const out: string[] = [];
  for (const l of lines) {
    const prev = out[out.length - 1];
    if (prev != null && !isItemStart(l) && (/^[a-zà-ú(]/.test(l) || /-$/.test(prev))) {
      out[out.length - 1] = /-$/.test(prev) ? prev.slice(0, -1) + l : `${prev} ${l}`;
    } else out.push(l);
  }
  return out;
}

function splitSteps(lines: string[]): string[] {
  const numbered = lines.filter((l) => /^\s*(\d{1,2}\s*[.)]|\(\d{1,2}\)|passo \d+)/i.test(l)).length;
  if (numbered >= 2) {
    return joinContinuations(lines, (l) => /^\s*(\d{1,2}\s*[.)]|\(\d{1,2}\)|passo \d+|[•·●*\-–])/i.test(l))
      .map((l) => l.replace(/^\s*(\d{1,2}\s*[.)]|\(\d{1,2}\)|passo \d+:?|[•·●*\-–])\s*/i, "").trim())
      .filter(Boolean);
  }
  // Prose: one paragraph → one step per sentence.
  const text = lines.join(" ").replace(/-\s+(?=[a-zà-ú])/g, "").replace(/\s+/g, " ").trim();
  return text
    .split(/(?<=[.!])\s+(?=[A-ZÀ-Ú])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function toNumber(word: string): number {
  const map: Record<string, number> = { uma: 1, um: 1, duas: 2, dois: 2, tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, oito: 8, dez: 10, doze: 12 };
  return Number(word) || map[word.toLowerCase()] || 0;
}

export function parseRecipeText(text: string): RecipeDraft {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const iIng = lines.findIndex((l) => ING_HEAD.test(l));
  const iStep = lines.findIndex((l, i) => i > iIng && STEP_HEAD.test(l));

  const all = lines.join("\n");
  const servingsM = all.match(/(rende|rendimento|serve|por[cç][oõ]es)\s*:?\s*(aprox\.?\s*)?(\d+|uma|um|duas|dois|tr[eê]s|quatro|cinco|seis|oito|dez|doze)/i);
  const hours = all.match(/(\d+)\s*h(ora)?s?\b/i);
  const mins = all.match(/(\d+)\s*min(uto)?s?\b/i);
  const minutes = (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);

  let titleLines = lines.slice(0, iIng > 0 ? iIng : 1).filter((l) => !NOISE.test(l) && !BULLET.test(l) && l.length <= 70);
  if (titleLines.length === 0) titleLines = lines.slice(0, 1);
  const title = titleLines[0] ?? "";

  let ingLines: string[] = [];
  let stepLines: string[] = [];
  if (iIng >= 0) {
    ingLines = lines.slice(iIng + 1, iStep > iIng ? iStep : undefined);
    stepLines = iStep > iIng ? lines.slice(iStep + 1) : [];
  } else if (iStep >= 0) {
    ingLines = lines.slice(1, iStep);
    stepLines = lines.slice(iStep + 1);
  }
  ingLines = ingLines.filter((l) => !SUB_HEAD.test(l) && !NOISE.test(l));
  stepLines = stepLines.filter((l) => !NOISE.test(l) && !SUB_HEAD.test(l));

  const ingredients = joinContinuations(ingLines, (l) => BULLET.test(l) || /^\s*[\d½¼¾⅓⅔]/.test(l) || /^[A-ZÀ-Ú]/.test(l))
    .map(parseIngredientLine)
    .filter((x): x is RecipeIngredient => !!x && !!x.name);

  return {
    title: title.replace(/[.:]+$/, "").replace(/^(\w)(.*)$/, (_, a: string, b: string) => a.toUpperCase() + (b === b.toUpperCase() ? b.toLowerCase() : b)),
    minutes: minutes || 30,
    servings: servingsM ? toNumber(servingsM[3]) || 4 : 4,
    ingredients,
    steps: splitSteps(stepLines),
    tags: [],
  };
}

/** Reading order for OCR lines across blocks/columns: top to bottom, left to right. */
export function orderLines(lines: { text: string; top: number; left: number }[]): string {
  return [...lines].sort((a, b) => (Math.abs(a.top - b.top) < 12 ? a.left - b.left : a.top - b.top)).map((l) => l.text).join("\n");
}

/* ---------- Claude app bridge ---------- */

export const CLAUDE_RECIPE_PROMPT = `Transcreva a receita das fotos anexadas (página(s) de um livro de receitas) para eu importar no meu app de despensa.

Responda APENAS com um bloco JSON neste formato, sem texto antes ou depois:

\`\`\`json
{
  "title": "Nome da receita",
  "minutes": 40,
  "servings": 4,
  "ingredients": [
    { "name": "farinha de trigo", "amount": "2 xícaras", "optional": false }
  ],
  "steps": ["Primeiro passo.", "Segundo passo."],
  "tags": ["doce", "forno"]
}
\`\`\`

Regras:
- "name" é só o ingrediente em minúsculas e simples (ex.: "ovo", "leite condensado", "peito de frango"); quantidade e medida vão em "amount" (ex.: "3", "1 lata", "a gosto").
- Marque "optional": true quando o livro disser opcional.
- Se houver partes (massa, recheio, cobertura), junte todos os ingredientes numa lista só e mantenha a ordem dos passos.
- "minutes" e "servings": use o que o livro informar; se não informar, estime.
- "tags": escolha entre: doce, salgado, forno, rápido, massa, proteína, vegetariano, café da manhã, lanche, acompanhamento, bebida.
- Transcreva fielmente; não invente ingredientes ou passos que não estão nas fotos.`;

/** Accepts Claude's reply (JSON, possibly inside a code block) — falls back to the text parser. */
export function parseClaudeReply(reply: string): RecipeDraft {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1);
  try {
    const j = JSON.parse(candidate);
    if (j && typeof j === "object" && (j.title || j.ingredients)) {
      const ingredients: RecipeIngredient[] = (Array.isArray(j.ingredients) ? j.ingredients : [])
        .map((i: unknown) => {
          if (typeof i === "string") return parseIngredientLine(i);
          const o = i as { name?: unknown; amount?: unknown; optional?: unknown };
          const name = String(o?.name ?? "").trim();
          if (!name) return null;
          const amount = String(o?.amount ?? "").trim();
          return { name, ...(amount ? { amount } : {}), ...(o?.optional === true ? { optional: true } : {}) };
        })
        .filter((x: RecipeIngredient | null): x is RecipeIngredient => !!x);
      return {
        title: String(j.title ?? "").trim(),
        minutes: Math.max(0, Math.round(Number(j.minutes) || 30)),
        servings: Math.max(1, Math.round(Number(j.servings) || 4)),
        ingredients,
        steps: (Array.isArray(j.steps) ? j.steps : []).map((s: unknown) => String(s).trim()).filter(Boolean),
        tags: (Array.isArray(j.tags) ? j.tags : []).map((t: unknown) => String(t).trim()).filter(Boolean),
      };
    }
  } catch {
    /* not JSON — try as plain text below */
  }
  return parseRecipeText(reply.replace(/```[a-z]*|```/gi, ""));
}

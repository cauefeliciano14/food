import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { parseIngredientLine, type RecipeDraft } from "./recipeOcr";
import { netAllowed } from "./settings";

/**
 * Recipe from a link (TudoGostoso, Panelinha, Receitas Nestlé…).
 * Most recipe sites publish the recipe in a standard machine-readable block
 * (schema.org "Recipe" in JSON-LD) — reading it is free and exact. Only when a
 * page doesn't have it does the app fall back to the AI (if allowed).
 */

export class LinkNeedsAppError extends Error {
  constructor() {
    super("No navegador o site bloqueia a leitura. Use o app no celular.");
  }
}

export function normalizeUrl(input: string): string | null {
  const m = input.match(/https?:\/\/[^\s"'<>]+/i);
  const raw = m ? m[0] : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(input.trim()) ? `https://${input.trim()}` : null;
  if (!raw) return null;
  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

export async function fetchPage(url: string): Promise<string> {
  if (!netAllowed("links")) throw new Error("Abrir links de receita está desligado em Ajustes → Internet.");
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.get({
      url,
      responseType: "text",
      headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "pt-BR,pt;q=0.9" },
      connectTimeout: 15000,
      readTimeout: 20000,
    });
    if (res.status >= 400) throw new Error(`O site respondeu com erro (${res.status}).`);
    return typeof res.data === "string" ? res.data : String(res.data ?? "");
  }
  try {
    const res = await fetch(url);
    return await res.text();
  } catch {
    throw new LinkNeedsAppError();
  }
}

type Json = Record<string, unknown>;

function findRecipe(node: unknown): Json | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n);
      if (r) return r;
    }
    return null;
  }
  const o = node as Json;
  const type = o["@type"];
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) return o;
  return findRecipe(o["@graph"]) ?? findRecipe(o["mainEntity"]);
}

const decode = (s: string) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const clean = (s: unknown) => decode(String(s ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** ISO 8601 duration ("PT1H30M") → minutes. */
export function isoMinutes(d: unknown): number {
  const m = String(d ?? "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function steps(instr: unknown): string[] {
  if (!instr) return [];
  if (typeof instr === "string") {
    return decode(instr.replace(/<\/(p|li)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
      .split(/\n+/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  if (Array.isArray(instr)) return instr.flatMap(steps);
  const o = instr as Json;
  if (o.itemListElement) return steps(o.itemListElement); // HowToSection
  return o.text ? [clean(o.text)] : o.name ? [clean(o.name)] : [];
}

/** The recipe in a page's JSON-LD, or null when the site doesn't publish one. */
export function recipeFromHtml(html: string): RecipeDraft | null {
  const blocks = html.match(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const b of blocks) {
    const body = b.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      continue;
    }
    const r = findRecipe(data);
    if (!r) continue;
    const ingredients = ([] as unknown[]).concat(r.recipeIngredient ?? r.ingredients ?? [])
      .map((x) => parseIngredientLine(clean(x)))
      .filter((x): x is NonNullable<typeof x> => !!x);
    const st = steps(r.recipeInstructions);
    if (!ingredients.length && !st.length) continue;
    const yieldRaw = ([] as unknown[]).concat(r.recipeYield ?? []).map(String).join(" ");
    const servings = Number(yieldRaw.match(/\d+/)?.[0] ?? 0);
    const keywords = ([] as unknown[]).concat(r.recipeCategory ?? [], typeof r.keywords === "string" ? r.keywords.split(",") : r.keywords ?? [])
      .map((k) => clean(k).toLowerCase()).filter((k) => k && k.length <= 20);
    return {
      title: clean(r.name) || "Receita",
      minutes: isoMinutes(r.totalTime) || isoMinutes(r.cookTime) + isoMinutes(r.prepTime) || 30,
      servings: servings || 4,
      ingredients,
      steps: st,
      tags: [...new Set(keywords)].slice(0, 4),
    };
  }
  return null;
}

/** Readable text of the page's main content, for the AI fallback. */
export function pageText(html: string): string {
  const main = html.match(/<(main|article)[\s\S]*?<\/\1>/i)?.[0] ?? html;
  return decode(
    main
      .replace(/<(script|style|noscript|svg|nav|header|footer|form|iframe)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|li|h\d|div|tr)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

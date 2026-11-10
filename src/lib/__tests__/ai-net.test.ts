import { beforeEach, describe, expect, it } from "vitest";
import { isoMinutes, normalizeUrl, pageText, recipeFromHtml } from "../recipeLink";
import { addSpend, aiAllowed, loadSettings, loadSpend, saveSettings } from "../settings";
import { assertAi, AiLimitError, AiOffError } from "../ai";

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

describe("recipe from a link", () => {
  const html = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Recipe","name":"Bolo de Cenoura &amp; Chocolate","totalTime":"PT1H10M","recipeYield":"12 porções","recipeCategory":"Bolos","keywords":"bolo, cenoura",
    "recipeIngredient":["3 cenouras médias","4 ovos","1 xícara (chá) de óleo","2 xícaras de açúcar","fermento a gosto"],
    "recipeInstructions":[{"@type":"HowToSection","name":"Massa","itemListElement":[{"@type":"HowToStep","text":"Bata a cenoura, os ovos e o óleo."},{"@type":"HowToStep","text":"Asse por 40 minutos."}]}]}]}</script></head><body>…</body></html>`;

  it("reads the standard recipe block for free", () => {
    const r = recipeFromHtml(html)!;
    expect(r.title).toBe("Bolo de Cenoura & Chocolate");
    expect(r.minutes).toBe(70);
    expect(r.servings).toBe(12);
    expect(r.ingredients).toHaveLength(5);
    expect(r.ingredients[0].name).toMatch(/cenoura/);
    expect(r.steps).toEqual(["Bata a cenoura, os ovos e o óleo.", "Asse por 40 minutos."]);
    expect(r.tags).toContain("bolos");
  });

  it("handles instructions as plain text and pages without a recipe", () => {
    const r = recipeFromHtml(`<script type="application/ld+json">[{"@type":["Recipe"],"name":"Pudim","recipeIngredient":["1 lata de leite condensado"],"recipeInstructions":"<p>Bata tudo.</p><p>Asse em banho-maria.</p>"}]</script>`)!;
    expect(r.steps).toEqual(["Bata tudo.", "Asse em banho-maria."]);
    expect(recipeFromHtml("<html><p>sem receita</p></html>")).toBeNull();
    expect(recipeFromHtml(`<script type="application/ld+json">{not json</script>`)).toBeNull();
  });

  it("helpers", () => {
    expect(isoMinutes("PT45M")).toBe(45);
    expect(isoMinutes("PT2H")).toBe(120);
    expect(normalizeUrl("olha essa: https://www.tudogostoso.com.br/receita/23-bolo.html")).toBe("https://www.tudogostoso.com.br/receita/23-bolo.html");
    expect(normalizeUrl("panelinha.com.br/receita/arroz")).toBe("https://panelinha.com.br/receita/arroz");
    expect(normalizeUrl("bolo de cenoura")).toBeNull();
    expect(pageText("<nav>menu</nav><main><h1>Bolo</h1><script>x()</script><p>2 ovos</p></main>")).toBe("Bolo\n2 ovos");
  });
});

describe("AI switches and monthly cap", () => {
  beforeEach(() => store.clear());

  it("is off until turned on with a key", () => {
    expect(aiAllowed("produto")).toBe(false);
    expect(() => assertAi("produto")).toThrow(AiOffError);
    saveSettings({ ...loadSettings(), aiEnabled: true, apiKey: "sk-ant-test" });
    expect(aiAllowed("produto")).toBe(true);
    saveSettings({ ...loadSettings(), ai: { ...loadSettings().ai, produto: false } });
    expect(aiAllowed("produto")).toBe(false);
    expect(aiAllowed("validade")).toBe(true);
  });

  it("keeps the key users already had (AI stays on after the update)", () => {
    store.set("despensa:settings", JSON.stringify({ apiKey: "sk-ant-old", theme: "escuro" }));
    const s = loadSettings();
    expect(s.aiEnabled).toBe(true);
    expect(s.net.produtos).toBe(true);
    expect(s.theme).toBe("escuro");
  });

  it("stops at the monthly limit", () => {
    saveSettings({ ...loadSettings(), aiEnabled: true, apiKey: "sk-ant-test", aiMonthlyLimit: 1 });
    expect(assertAi("nota")).toBe("sk-ant-test");
    addSpend(0.6);
    addSpend(0.5);
    expect(loadSpend()).toMatchObject({ calls: 2, usd: 1.1 });
    expect(() => assertAi("nota")).toThrow(AiLimitError);
  });
});

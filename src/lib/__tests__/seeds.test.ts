import { describe, expect, it } from "vitest";
import { SEED_RECIPES } from "../seedRecipes";
import { SEED_RECIPES_2 } from "../seedRecipes2";
import { SEED_RECIPES_3 } from "../seedRecipes3";
import { normalize } from "../normalize";

const ALL = [...SEED_RECIPES, ...SEED_RECIPES_2, ...SEED_RECIPES_3];
const TAGS = new Set(["proteína", "salgado", "doce", "sobremesa", "massa", "forno", "rápido", "básico", "acompanhamento", "salada", "vegetariano", "leve", "lanche", "panela de pressão", "air fryer", "aproveitamento", "festa", "café da manhã", "bebida"]);

describe("built-in recipe book", () => {
  it("has no duplicate titles", () => {
    const seen = new Map<string, string>();
    for (const r of ALL) {
      const k = normalize(r.title);
      expect(seen.has(k), `duplicada: ${r.title}`).toBe(false);
      seen.set(k, r.title);
    }
  });

  it("every recipe is complete", () => {
    for (const r of SEED_RECIPES_3) {
      expect(r.title.trim(), r.title).not.toBe("");
      expect(r.minutes, r.title).toBeGreaterThan(0);
      expect(r.servings, r.title).toBeGreaterThan(0);
      expect(r.ingredients.length, r.title).toBeGreaterThanOrEqual(2);
      expect(r.steps.length, r.title).toBeGreaterThanOrEqual(2);
      for (const t of r.tags) expect(TAGS.has(t), `${r.title}: tag ${t}`).toBe(true);
      for (const i of r.ingredients) expect(i.name, r.title).toBe(i.name.toLowerCase());
    }
  });
});

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Category, Location, RecipeIngredient } from "./types";
import { CATEGORIES } from "./types";
import { today } from "./dates";

const MODEL = "claude-opus-5-5";

function client(apiKey: string) {
  if (!apiKey) throw new Error("Configure sua chave da API da Anthropic em Ajustes para usar a leitura de nota fiscal.");
  // The key lives only on this device (localStorage) and is sent straight to the Anthropic API.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

const categoryValues = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];

const ReceiptSchema = z.object({
  store: z.string().describe("Nome do estabelecimento, ou string vazia"),
  purchaseDate: z.string().describe("Data da compra em YYYY-MM-DD, ou string vazia se ilegível"),
  items: z.array(
    z.object({
      rawName: z.string().describe("Descrição exatamente como impressa na nota"),
      name: z.string().describe("Nome amigável e curto em português, ex.: 'Peito de frango', 'Leite integral'"),
      quantity: z.number().describe("Quantidade comprada (peso em kg para itens pesados)"),
      unit: z.string().describe("Uma de: un, kg, g, L, ml, pct, cx, lata, dz, maço"),
      category: z.enum(categoryValues),
      location: z.enum(["geladeira", "freezer", "despensa"]),
      shelfLifeDays: z.number().describe("Estimativa de dias até vencer a partir da compra, considerando o local"),
      unitPrice: z.number().describe("Preço pago por 1 unidade da `unit` escolhida (ex.: R$/kg para itens pesados), após descontos; 0 se ilegível"),
      isFood: z.boolean().describe("false para produtos de limpeza, higiene, utilidades etc."),
    }),
  ),
});

export type ReceiptResult = z.infer<typeof ReceiptSchema>;

const RECEIPT_PROMPT = `Esta é a foto de um cupom/nota fiscal de compra (normalmente uma NFC-e brasileira de supermercado).
Extraia todos os produtos comprados.

- Abreviações de cupom devem virar nomes legíveis (ex.: "PTO FGO SADIA KG" → "Peito de frango"; "LT INT PIRAC 1L" → "Leite integral").
- Se a mesma linha tiver quantidade e unidade (ex.: "2 UN", "0,856 KG"), use-as. Para itens pesados use kg.
- Agrupe linhas repetidas do mesmo produto somando a quantidade.
- unitPrice é o preço por unidade da unit (ex.: 0,856 kg a R$ 22,90/kg → unitPrice 22.90; 2 un a R$ 4,50 cada → 4.50). Considere descontos da linha.
- Estime shelfLifeDays de forma realista e conservadora para o local de armazenamento sugerido (carne fresca na geladeira ≈ 2–3 dias; congelados ≈ 90; grãos/enlatados ≈ 180–365).
- Marque isFood=false para itens que não são comida nem bebida.
- Não invente itens que não estão legíveis.`;

export async function readReceipt(apiKey: string, jpegBase64: string): Promise<ReceiptResult> {
  const res = await client(apiKey).beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpegBase64 } },
          { type: "text", text: `Data de hoje: ${today()}.\n\n${RECEIPT_PROMPT}` },
        ],
      },
    ],
    output_config: { effort: "low", format: betaZodOutputFormat(ReceiptSchema) },
  });
  if (res.stop_reason === "refusal") throw new Error("A IA não conseguiu processar esta imagem.");
  if (res.stop_reason === "max_tokens") throw new Error("A nota é muito longa — tente fotografar em partes.");
  if (!res.parsed_output) throw new Error("Não consegui ler a nota. Tente uma foto mais nítida e bem iluminada.");
  return res.parsed_output;
}

const RecipeSchema = z.object({
  title: z.string(),
  minutes: z.number(),
  servings: z.number(),
  ingredients: z.array(z.object({ name: z.string(), amount: z.string(), optional: z.boolean() })),
  steps: z.array(z.string()),
  tags: z.array(z.string()),
});

export type GeneratedRecipe = {
  title: string;
  minutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
};

export async function suggestRecipe(
  apiKey: string,
  pantry: { name: string; quantity: number; unit: string; location: Location; expiresInDays: number | null }[],
  wish: string,
): Promise<GeneratedRecipe> {
  const list = pantry
    .map((p) => `- ${p.name} (${p.quantity} ${p.unit}, ${p.location}${p.expiresInDays != null ? `, vence em ${p.expiresInDays} dias` : ""})`)
    .join("\n");
  const res = await client(apiKey).beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [
      {
        role: "user",
        content: `Sou um cozinheiro caseiro no Brasil. Sugira UMA receita em português usando principalmente o que tenho em casa, priorizando o que vence primeiro. Pode assumir que tenho sal, óleo, açúcar, pimenta e água. Use nomes de ingredientes simples (ex.: "cebola", "peito de frango").${wish ? `\n\nPedido: ${wish}` : ""}\n\nO que tenho:\n${list || "(despensa vazia)"}`,
      },
    ],
    output_config: { effort: "low", format: betaZodOutputFormat(RecipeSchema) },
  });
  if (res.stop_reason === "refusal") throw new Error("A IA recusou este pedido.");
  if (!res.parsed_output) throw new Error("Não consegui gerar a receita. Tente novamente.");
  return res.parsed_output;
}

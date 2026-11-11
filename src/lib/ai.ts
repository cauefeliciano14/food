import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Category, FoodItem, Location, RecipeIngredient } from "./types";
import { CATEGORIES, UNITS } from "./types";
import { today } from "./dates";
import { addSpend, aiAllowed, loadSettings, loadSpend, type AiUses } from "./settings";
import type { RecipeDraft } from "./recipeOcr";

const MODEL = "claude-opus-5-5";

// US$ per token. Opus 5.5 is $4 in / $20 out per million; we count a little
// above that ($5 / $25, the price of the fallback model) so the monthly cap
// is never under-counted.
const PRICE_IN = 5 / 1e6;
const PRICE_OUT = 25 / 1e6;

export class AiOffError extends Error {}
export class AiLimitError extends Error {}

/**
 * Check the switches and the monthly cap before any call.
 * Throws a friendly error when the AI can't be used for this.
 */
export function assertAi(use: keyof AiUses) {
  const s = loadSettings();
  if (!s.apiKey) throw new AiOffError("Para usar a IA, cole sua chave da Anthropic em Ajustes → IA.");
  if (!aiAllowed(use, s)) throw new AiOffError("A IA está desligada para isto em Ajustes → IA.");
  const spent = loadSpend().usd;
  if (spent >= s.aiMonthlyLimit) {
    throw new AiLimitError(`Limite de IA do mês atingido (US$ ${s.aiMonthlyLimit.toFixed(2)}). Aumente em Ajustes ou espere o mês virar.`);
  }
  return s.apiKey;
}

function client(apiKey: string) {
  // The key lives only on this device and is sent straight to the Anthropic API.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
}

type Content = Anthropic.Beta.BetaContentBlockParam[] | string;

/** One structured-output call: switch check → request → cost recorded → typed result. */
async function ask<S extends z.ZodType>(use: keyof AiUses, schema: S, content: Content, failMsg: string): Promise<z.infer<S>> {
  const key = assertAi(use);
  let res;
  try {
    res = await client(key).beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content }],
      output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error("A chave da IA não foi aceita (pode ter vencido ou sido apagada). Crie uma nova em console.anthropic.com → Chaves de API e cole em Ajustes → IA.");
    if (e instanceof Anthropic.PermissionDeniedError) throw new Error("A chave não tem permissão (crédito esgotado ou limite da conta Anthropic).");
    if (e instanceof Anthropic.RateLimitError) throw new Error("A IA está ocupada agora. Tente de novo em instantes.");
    if (e instanceof Anthropic.APIConnectionError) throw new Error("Sem internet para falar com a IA.");
    if (e instanceof Anthropic.APIError) throw new Error(`A IA respondeu com erro (${e.status}). Tente de novo.`);
    throw e;
  }
  const u = res.usage;
  addSpend(((u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) * 1.25 + (u.cache_read_input_tokens ?? 0) * 0.1) * PRICE_IN + (u.output_tokens ?? 0) * PRICE_OUT);
  if (res.stop_reason === "refusal") throw new Error("A IA não conseguiu processar este pedido.");
  if (res.stop_reason === "max_tokens") throw new Error("Conteúdo grande demais — tente em partes.");
  if (!res.parsed_output) throw new Error(failMsg);
  return res.parsed_output as z.infer<S>;
}

const jpeg = (data: string): Anthropic.Beta.BetaContentBlockParam => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });

const categoryValues = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];
const UNIT_LIST = UNITS.join(", ");

// ---------- receipt (nota fiscal) photo ----------

const ReceiptSchema = z.object({
  store: z.string().describe("Nome do estabelecimento, ou string vazia"),
  purchaseDate: z.string().describe("Data da compra em YYYY-MM-DD, ou string vazia se ilegível"),
  items: z.array(
    z.object({
      rawName: z.string().describe("Descrição exatamente como impressa na nota"),
      name: z.string().describe("Nome amigável e curto em português, ex.: 'Peito de frango', 'Leite integral'"),
      quantity: z.number().describe("Quantidade comprada (peso em kg para itens pesados)"),
      unit: z.string().describe(`Uma de: ${UNIT_LIST}`),
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

export function readReceipt(jpegBase64: string): Promise<ReceiptResult> {
  return ask("nota", ReceiptSchema, [jpeg(jpegBase64), { type: "text", text: `Data de hoje: ${today()}.\n\n${RECEIPT_PROMPT}` }],
    "Não consegui ler a nota. Tente uma foto mais nítida e bem iluminada.");
}

// ---------- product from a package photo ----------

const ProductSchema = z.object({
  isFood: z.boolean().describe("false se a foto não mostra um alimento ou bebida"),
  name: z.string().describe("Nome popular e simples em português, até 3 palavras, sem marca. Ex.: 'Arroz integral', 'Leite condensado', 'Biscoito recheado'"),
  fullName: z.string().describe("Nome como está na embalagem, com marca e variedade. Ex.: 'Arroz Integral Tio João Tipo 1'"),
  category: z.enum(categoryValues),
  location: z.enum(["geladeira", "freezer", "despensa", "armario"]).describe("Onde guardar fechado: geladeira, freezer, despensa (prateleira) ou armario (armário da cozinha)"),
  quantity: z.number().describe("Conteúdo da embalagem: kg ou L para 1 kg/L ou mais; para pacotes menores use 1 com unit 'un' (ou 'lata', 'cx', 'pct')"),
  unit: z.string().describe(`Uma de: ${UNIT_LIST}`),
  packageSize: z.string().describe("Peso/volume impresso, ex.: '395 g', '1 L'; vazio se não aparece"),
  expiryDate: z.string().describe("Validade em YYYY-MM-DD se estiver visível e marcada como validade (VAL/VENC); senão string vazia. Não use a data de fabricação"),
});

export async function readProductPhoto(jpegBase64: string): Promise<Partial<FoodItem> | null> {
  const r = await ask("produto", ProductSchema, [
    jpeg(jpegBase64),
    { type: "text", text: `Data de hoje: ${today()}. Foto da embalagem de um produto que vou guardar na despensa de casa. Identifique o produto.` },
  ], "Não consegui identificar o produto na foto.");
  if (!r.isFood || !r.name.trim()) return null;
  const unit = (UNITS as readonly string[]).includes(r.unit) ? r.unit : "un";
  return {
    name: r.name.trim(),
    ...(r.fullName.trim() && r.fullName.trim() !== r.name.trim() ? { fullName: r.fullName.trim() } : {}),
    category: r.category,
    location: r.location as Location,
    quantity: r.quantity > 0 ? r.quantity : 1,
    unit,
    ...(r.packageSize && unit === "un" ? { notes: `Embalagem: ${r.packageSize}` } : {}),
    ...(/^\d{4}-\d{2}-\d{2}$/.test(r.expiryDate) ? { expiryDate: r.expiryDate } : {}),
  };
}

// ---------- expiry date from a photo ----------

const ExpirySchema = z.object({
  expiryDate: z.string().describe("Data de validade em YYYY-MM-DD; string vazia se não houver data de validade legível"),
});

export async function readExpiryPhoto(jpegBase64: string): Promise<string | null> {
  const r = await ask("validade", ExpirySchema, [
    jpeg(jpegBase64),
    { type: "text", text: `Data de hoje: ${today()}. Qual é a data de VALIDADE impressa nesta embalagem? Ignore a data de fabricação (FAB) e o lote. Se só tiver mês e ano, use o último dia do mês.` },
  ], "Não consegui ler a validade.");
  return /^\d{4}-\d{2}-\d{2}$/.test(r.expiryDate) ? r.expiryDate : null;
}

// ---------- recipes ----------

const RecipeSchema = z.object({
  title: z.string(),
  minutes: z.number().describe("Tempo total em minutos (estime se não estiver escrito)"),
  servings: z.number().describe("Porções (estime se não estiver escrito)"),
  ingredients: z.array(z.object({
    name: z.string().describe("Ingrediente em nome simples, ex.: 'cebola', 'peito de frango', 'farinha de trigo'"),
    amount: z.string().describe("Quantidade como escrita, ex.: '2 xícaras', '1 colher (sopa)', 'a gosto'; vazio se não houver"),
    optional: z.boolean(),
  })),
  steps: z.array(z.string()).describe("Modo de preparo, um passo por item, como escrito"),
  tags: z.array(z.string()).describe("2 a 4 etiquetas em minúsculas, ex.: 'doce', 'salgado', 'rápido', 'forno', 'lanche', 'massa', 'proteína'"),
});

function toDraft(r: z.infer<typeof RecipeSchema>): RecipeDraft {
  return {
    title: r.title.trim(),
    minutes: Math.max(0, Math.round(r.minutes)) || 30,
    servings: Math.max(0, Math.round(r.servings)) || 4,
    ingredients: r.ingredients.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), ...(i.amount.trim() ? { amount: i.amount.trim() } : {}), ...(i.optional ? { optional: true } : {}) })),
    steps: r.steps.map((s) => s.trim()).filter(Boolean),
    tags: r.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
  };
}

export async function readRecipePhotos(pagesJpegBase64: string[]): Promise<RecipeDraft> {
  const r = await ask("receita", RecipeSchema, [
    ...pagesJpegBase64.map(jpeg),
    { type: "text", text: "Estas são as fotos (em ordem) de uma receita de um livro ou caderno de receitas. Transcreva fielmente em português, sem inventar ingredientes ou passos." },
  ], "Não consegui montar a receita a partir das fotos.");
  return toDraft(r);
}

export async function recipeFromPageText(pageText: string, url: string): Promise<RecipeDraft> {
  const r = await ask("link", RecipeSchema,
    `Abaixo está o texto de uma página de receita (${url}). Extraia a receita principal em português, sem inventar nada que não esteja no texto.\n\n<pagina>\n${pageText}\n</pagina>`,
    "Não encontrei uma receita nessa página.");
  return toDraft(r);
}

export type GeneratedRecipe = {
  title: string;
  minutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
};

export async function suggestRecipe(
  pantry: { name: string; quantity: number; unit: string; location: Location; expiresInDays: number | null }[],
  wish: string,
): Promise<GeneratedRecipe> {
  const list = pantry
    .map((p) => `- ${p.name} (${p.quantity} ${p.unit}, ${p.location}${p.expiresInDays != null ? `, vence em ${p.expiresInDays} dias` : ""})`)
    .join("\n");
  const r = await ask("sugestao", RecipeSchema,
    `Sou um cozinheiro caseiro no Brasil. Sugira UMA receita em português usando principalmente o que tenho em casa, priorizando o que vence primeiro. Pode assumir que tenho sal, óleo, açúcar, pimenta e água. Use nomes de ingredientes simples (ex.: "cebola", "peito de frango").${wish ? `\n\nPedido: ${wish}` : ""}\n\nO que tenho:\n${list || "(despensa vazia)"}`,
    "Não consegui gerar a receita. Tente novamente.");
  return toDraft(r);
}

// ---------- "Organizar com IA": review the pantry list on demand ----------

const LOCATION_VALUES = ["geladeira", "freezer", "despensa", "armario"] as const;

const OrganizeSchema = z.object({
  items: z.array(z.object({
    id: z.number().describe("o id recebido, sem alterar"),
    name: z.string().describe("Nome prático e curto em português (até 3 palavras, sem marca). Mantenha o atual se já for bom"),
    category: z.enum(categoryValues),
    location: z.enum(LOCATION_VALUES).describe("Onde está guardado. Mantenha o informado, a não ser que seja claramente impossível (ex.: sorvete na despensa)"),
    expiryDate: z.string().describe("Validade em YYYY-MM-DD considerando o local e se está aberto; repita a atual se não houver motivo para mudar"),
    changedExpiry: z.boolean().describe("true só se a validade sugerida for diferente da atual"),
    reason: z.string().describe("Se mudou a validade: o motivo em uma frase curta. Senão, vazio"),
    tip: z.string().describe("Uma dica curta e prática de conservação para este item (até 120 caracteres)"),
  })),
});

export type OrganizeSuggestion = z.infer<typeof OrganizeSchema>["items"][number];

const ORGANIZE_PROMPT = `Você ajuda a organizar a despensa de uma casa no Brasil. Para cada item da lista (JSON), devolva:
- name: nome prático, popular e curto (ex.: "ARROZ TIO JOAO T1 5KG" → "Arroz"; "Bebida láctea fermentada morango" → "Iogurte de morango"). O nome original continua guardado no app, então simplifique sem medo, mas não troque o produto.
- category: a categoria correta.
- location: onde está guardado (use o informado; só corrija se for impossível).
- expiryDate: a validade realista PARA O LOCAL ONDE ESTÁ e considerando se foi aberto:
  • Itens industrializados FECHADOS com data impressa (origem "codigo" ou "nota" com data conferida): mantenha a data, exceto se estiverem abertos.
  • Itens ABERTOS: use o prazo depois de aberto, contado de openedAt, sem passar da data atual quando ela for menor.
  • Frutas, verduras, carnes, pães e itens sem data impressa (data estimada): estime a partir da data de compra e do local. Geladeira prolonga frutas/verduras/carnes cruas (carne crua na geladeira: 2–3 dias; no freezer: ~3 meses); pão de forma dura mais fora da geladeira mas mofa menos dentro; banana escurece na geladeira mas a polpa dura mais.
  • Não invente prazos longos para perecíveis; prefira o conservador.
- changedExpiry/reason: diga por que mudou (ex.: "Na geladeira o tomate dura cerca de 10 dias").
- tip: dica curta de conservação.
Hoje é DATA. Devolva um item para cada id recebido, na mesma ordem.`;

export async function organizePantry(items: FoodItem[]): Promise<OrganizeSuggestion[]> {
  const list = items.map((it) => ({
    id: it.id, nome: it.name, nomeOriginal: it.fullName ?? "", quantidade: `${it.quantity} ${it.unit}`,
    categoria: it.category, local: it.location, compra: it.purchaseDate, validadeAtual: it.expiryDate,
    abertoEm: it.openedAt ?? "", origem: it.barcode ? "codigo" : "manual", obs: it.notes ?? "",
  }));
  const r = await ask("organizar", OrganizeSchema,
    `${ORGANIZE_PROMPT.replace("DATA", today())}\n\n<itens>\n${JSON.stringify(list)}\n</itens>`,
    "Não consegui analisar a lista agora. Tente de novo.");
  return r.items;
}

import { useState } from "react";
import { db } from "../lib/db";
import type { GeneratedRecipe } from "../lib/ai";
import { loadSettings } from "../lib/settings";
import { today } from "../lib/dates";
import { ingredientsToText } from "./RecipeForm";
import { Sparkles } from "lucide-react";
import { daysLeft, isUsable } from "../lib/freshness";

export function AISuggest({ onSaved, onNeedKey }: { onSaved: (id: number) => void; onNeedKey: () => void }) {
  const [wish, setWish] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedRecipe | null>(null);
  const apiKey = loadSettings().apiKey;

  if (!apiKey) {
    return (
      <div className="stack">
        <div className="notice">Cadastre sua chave da API da Anthropic em Ajustes para receber sugestões de receitas com base no que você tem.</div>
        <button className="btn primary block" onClick={onNeedKey}>Ir para Ajustes</button>
      </div>
    );
  }

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const ref = today();
      const items = (await db.items.toArray()).filter((i) => isUsable(i, ref));
      const { suggestRecipe } = await import("../lib/ai");
      const r = await suggestRecipe(
        apiKey,
        items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, location: i.location, expiresInDays: daysLeft(i, ref) })),
        wish.trim(),
      );
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <p className="small muted">A IA olha sua despensa (priorizando o que vence primeiro) e cria uma receita. Você pode salvá-la no seu livro.</p>
      <input type="text" value={wish} onChange={(e) => setWish(e.target.value)} placeholder="Opcional: algo leve, jantar rápido, sobremesa…" />
      <button className="btn primary block" onClick={run} disabled={loading}>{loading ? "Pensando…" : <><Sparkles size={18} />Sugerir receita</>}</button>
      {loading && <div className="spinner" />}
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="card stack">
          <b>{result.title}</b>
          <div className="small muted">{result.minutes} min · {result.servings} porções</div>
          <pre className="small" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{ingredientsToText(result.ingredients)}</pre>
          <ol className="steps small">{result.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <div className="grid-2">
            <button className="btn" onClick={run}>Outra</button>
            <button className="btn primary" onClick={async () => {
              const id = await db.recipes.add({ ...result, source: "ia", createdAt: Date.now() });
              onSaved(id as number);
            }}>Salvar no livro</button>
          </div>
        </div>
      )}
    </div>
  );
}

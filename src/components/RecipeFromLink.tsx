import { useState } from "react";
import { ClipboardPaste, Link2 } from "lucide-react";
import { fetchPage, normalizeUrl, pageText, recipeFromHtml } from "../lib/recipeLink";
import type { RecipeDraft } from "../lib/recipeOcr";
import { aiAllowed, netAllowed } from "../lib/settings";

/** Paste a recipe link (TudoGostoso, Panelinha…) → recipe ready to review. */
export function RecipeFromLink({ onDraft }: { onDraft: (d: RecipeDraft) => void }) {
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const url = normalizeUrl(link);

  if (!netAllowed("links")) {
    return <p className="small muted" style={{ margin: 0 }}>Receita por link está desligada em Ajustes → Internet.</p>;
  }

  async function paste() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setLink(t.trim());
    } catch {
      setError("Não consegui ler a área de transferência. Toque e segure na caixa e escolha Colar.");
    }
  }

  async function go() {
    if (!url) return;
    setError("");
    try {
      setBusy("Abrindo a página…");
      const html = await fetchPage(url);
      const free = recipeFromHtml(html);
      if (free) return onDraft(free);
      if (!aiAllowed("link")) {
        setError("Esse site não publica a receita num formato que o app lê sozinho. Ligue a IA para links em Ajustes → IA, ou copie o texto e use Nova receita.");
        return;
      }
      const text = pageText(html);
      if (text.length < 200) {
        setError("A página veio quase vazia (talvez peça login). Tente outro link.");
        return;
      }
      if (text.length > 60000) {
        setError("A página é grande demais para enviar à IA. Tente o link direto da receita.");
        return;
      }
      setBusy("A IA está lendo a página…");
      const { recipeFromPageText } = await import("../lib/ai");
      onDraft(await recipeFromPageText(text, url));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <input type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Cole o link da receita" aria-label="Link da receita" />
        <button className="btn" onClick={paste} aria-label="Colar"><ClipboardPaste size={18} /></button>
      </div>
      <button className="btn primary block" onClick={go} disabled={!url || !!busy}><Link2 size={18} />{busy || "Importar receita"}</button>
      {busy && <div className="spinner" />}
      {error && <div className="error small">{error}</div>}
      <p className="small muted" style={{ margin: 0 }}>Funciona de graça com a maioria dos sites (TudoGostoso, Panelinha, Receitas Nestlé…). Sem formato padrão, usa a IA se estiver ligada.</p>
    </div>
  );
}

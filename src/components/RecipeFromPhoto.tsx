import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { BookImage, Camera, ClipboardPaste, Copy, Images, ScanText, Send, X } from "lucide-react";
import { canReadText, choosePhotos, PhotoCanceled, readText, takePhoto } from "../lib/ocr";
import { CLAUDE_RECIPE_PROMPT, orderLines, parseClaudeReply, parseRecipeText, type RecipeDraft } from "../lib/recipeOcr";
import { isNative, shareText } from "../lib/native";
import { IconTile } from "./icons";

/**
 * Recipe from cookbook photos. Two ways:
 *  1. read the pages on the phone (ML Kit, free, offline) and split into a recipe;
 *  2. send the photos to the user's own Claude app with a ready-made prompt,
 *     then paste the answer back — uses their Claude subscription, no API key.
 */
export function RecipeFromPhoto({ onDraft }: { onDraft: (d: RecipeDraft) => void }) {
  const [pages, setPages] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"pages" | "claude">(canReadText() ? "pages" : "claude");
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);

  async function add(fromGallery: boolean) {
    setError("");
    try {
      const uris = fromGallery ? await choosePhotos(6) : [await takePhoto()];
      setPages((p) => [...p, ...uris].slice(0, 8));
    } catch (e) {
      if (!(e instanceof PhotoCanceled)) setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function readOnPhone() {
    setError("");
    try {
      const texts: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        setBusy(`Lendo página ${i + 1} de ${pages.length}…`);
        const { lines, text } = await readText(pages[i]);
        texts.push(lines.length ? orderLines(lines) : text);
      }
      const draft = parseRecipeText(texts.join("\n"));
      if (draft.ingredients.length === 0 && draft.steps.length === 0) {
        setError("Não consegui separar ingredientes e modo de preparo nessa foto. Tente uma foto mais reta e nítida, ou peça ao seu Claude (abaixo).");
        return;
      }
      onDraft(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function sendToClaude() {
    setError("");
    try {
      if (isNative() && pages.length) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ title: "Receita", text: CLAUDE_RECIPE_PROMPT, files: pages, dialogTitle: "Escolha o app do Claude" });
      } else if ((await shareText(CLAUDE_RECIPE_PROMPT)) === "copied") {
        setCopied(true);
      }
    } catch (e) {
      if (!/cancel/i.test(String((e as Error)?.message ?? e))) setError(e instanceof Error ? e.message : String(e));
    }
    setMode("claude");
  }

  async function pasteFromClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setReply(t);
    } catch {
      setError("Não consegui ler a área de transferência. Toque e segure na caixa abaixo e escolha Colar.");
    }
  }

  function buildFromReply() {
    setError("");
    const draft = parseClaudeReply(reply);
    if (!draft.title && draft.ingredients.length === 0) {
      setError("Não reconheci uma receita nessa resposta. Copie a resposta inteira do Claude e cole de novo.");
      return;
    }
    onDraft(draft);
  }

  return (
    <div className="stack">
      {canReadText() && (
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={mode === "pages"} className={mode === "pages" ? "active" : ""} onClick={() => setMode("pages")}><ScanText size={16} />Ler no celular</button>
          <button role="tab" aria-selected={mode === "claude"} className={mode === "claude" ? "active" : ""} onClick={() => setMode("claude")}><Send size={16} />Pelo meu Claude</button>
        </div>
      )}

      {(mode === "pages" || isNative()) && (
        <>
          <p className="small muted" style={{ margin: 0 }}>
            Fotografe a página da receita, reta e com boa luz. Se a receita continua em outra página, adicione mais fotos na ordem.
          </p>
          {pages.length > 0 && (
            <div className="pages">
              {pages.map((p, i) => (
                <div key={p + i} className="page-thumb">
                  <img src={Capacitor.convertFileSrc(p)} alt={`Página ${i + 1}`} />
                  <span className="page-n">{i + 1}</span>
                  <button className="page-x" aria-label={`Remover página ${i + 1}`} onClick={() => setPages(pages.filter((_, j) => j !== i))}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {isNative() && (
            <div className="grid-2">
              <button className="btn" onClick={() => add(false)} disabled={!!busy}><Camera size={18} />{pages.length ? "Mais uma página" : "Tirar foto"}</button>
              <button className="btn" onClick={() => add(true)} disabled={!!busy}><Images size={18} />Da galeria</button>
            </div>
          )}
        </>
      )}

      {mode === "pages" && canReadText() && (
        <>
          <button className="btn primary block" onClick={readOnPhone} disabled={!pages.length || !!busy}>
            <ScanText size={18} />{busy || "Montar receita (grátis)"}
          </button>
          {busy && <div className="spinner" />}
        </>
      )}

      {mode === "claude" && (
        <div className="card stack">
          <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
            <IconTile icon={BookImage} hue={25} size={40} />
            <div className="small">
              Usa o <b>seu app do Claude</b> (sua assinatura, sem chave de API). Melhor para letra cursiva, páginas tortas ou em colunas.
            </div>
          </div>
          <ol className="steps small" style={{ marginTop: 0 }}>
            <li>{isNative() ? "Toque em Enviar e escolha o app do Claude. As fotos e as instruções vão juntas." : "Copie as instruções, abra o Claude, cole e anexe a foto da receita."}</li>
            <li>No Claude, envie e espere a resposta. Toque em <b>copiar</b> na resposta.</li>
            <li>Volte aqui e cole a resposta.</li>
          </ol>
          <button className="btn block" onClick={sendToClaude} disabled={isNative() && pages.length === 0}>
            {isNative() ? <><Send size={18} />Enviar {pages.length ? `${pages.length} foto(s)` : "fotos"} para o Claude</> : <><Copy size={18} />{copied ? "Instruções copiadas" : "Copiar instruções"}</>}
          </button>
          <textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Cole aqui a resposta do Claude" aria-label="Resposta do Claude" />
          <div className="grid-2">
            <button className="btn" onClick={pasteFromClipboard}><ClipboardPaste size={18} />Colar</button>
            <button className="btn primary" onClick={buildFromReply} disabled={!reply.trim()}>Montar receita</button>
          </div>
        </div>
      )}

      {error && <div className="error small">{error}</div>}
    </div>
  );
}

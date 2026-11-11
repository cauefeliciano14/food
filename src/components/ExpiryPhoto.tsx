import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { canReadText, photoToJpegBase64, PhotoCanceled, readText, takePhoto } from "../lib/ocr";
import { aiAllowed } from "../lib/settings";
import { parseExpiryFromText } from "../lib/expiryOcr";
import { formatBR } from "../lib/dates";

/** "Ler validade pela foto": snap the date printed on the package and fill it in. */
export function ExpiryPhoto({ onDate, itemName, big = false }: {
  onDate: (iso: string) => void;
  /** for screen readers when there are many on one screen ("Ler validade de Leite pela foto") */
  itemName?: string;
  /** large button (guided one-by-one check) */
  big?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [others, setOthers] = useState<string[]>([]);
  if (!canReadText()) return null;

  async function run() {
    setMsg(null);
    setOthers([]);
    setBusy(true);
    try {
      const uri = await takePhoto();
      setMsg({ text: "Lendo a data…" });
      const { text } = await readText(uri);
      const r = parseExpiryFromText(text);
      if (!r.best && aiAllowed("validade")) {
        // Free reader didn't find it: ask the AI (counts toward the monthly cap).
        setMsg({ text: "Pedindo ajuda à IA…" });
        const { readExpiryPhoto } = await import("../lib/ai");
        const d = await readExpiryPhoto(await photoToJpegBase64(uri, 1200));
        if (d) {
          onDate(d);
          setMsg({ text: `Validade lida pela IA: ${formatBR(d)}` });
          return;
        }
      }
      if (!r.best) {
        setMsg({ text: "Não encontrei a data na foto. Chegue mais perto, com boa luz, só no trecho da validade.", error: true });
        return;
      }
      onDate(r.best);
      setMsg({ text: `Validade lida: ${formatBR(r.best)}` });
      setOthers(r.candidates);
    } catch (e) {
      if (e instanceof PhotoCanceled) setMsg(null);
      else setMsg({ text: e instanceof Error ? e.message : String(e), error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ marginTop: 6 }}>
      <button type="button" className={big ? "btn primary block" : "btn sm"} onClick={run} disabled={busy}
        style={big ? { minHeight: 56 } : { alignSelf: "flex-start" }}
        aria-label={itemName ? `Ler validade de ${itemName} pela foto` : undefined}>
        <CalendarClock size={big ? 20 : 16} />{busy ? "Lendo…" : big ? "Tirar foto da validade" : "Ler validade pela foto"}
      </button>
      <div aria-live="polite" role="status">{msg && <div className={`small ${msg.error ? "error" : "muted"}`}>{msg.text}</div>}</div>
      {others.length > 0 && (
        <div className="chips wrapped">
          <span className="small muted" style={{ alignSelf: "center" }}>Era outra?</span>
          {others.map((d) => (
            <button key={d} type="button" className="chip" onClick={() => { onDate(d); setMsg({ text: `Validade: ${formatBR(d)}` }); setOthers(others.filter((x) => x !== d)); }}>
              {formatBR(d)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

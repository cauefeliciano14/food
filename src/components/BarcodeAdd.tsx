import { useCallback, useState } from "react";
import { BarcodeScanner } from "./BarcodeScanner";
import { ItemForm } from "./ItemForm";
import { lookupBarcode, type BarcodeLookup } from "../lib/barcode";

/** Scan → look up → prefilled form → (optionally) scan the next one. */
export function BarcodeAdd({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<"scan" | "lookup" | "form">("scan");
  const [result, setResult] = useState<BarcodeLookup | null>(null);
  const [added, setAdded] = useState(0);
  const [round, setRound] = useState(0);

  const onCode = useCallback(async (code: string) => {
    setStage("lookup");
    setResult(await lookupBarcode(code));
    setStage("form");
  }, []);

  if (stage === "lookup") return <div className="stack" style={{ textAlign: "center" }}><div className="spinner" /><p className="muted">Procurando o produto…</p></div>;

  if (stage === "form" && result) {
    return (
      <div className="stack">
        <div className={result.found ? "notice small" : "error small"}>
          {result.source === "memoria" && "✔ Você já cadastrou este produto antes."}
          {result.source === "openfoodfacts" && "✔ Produto encontrado no Open Food Facts. Confira os dados."}
          {result.source === "nenhum" && `Código ${result.prefill.barcode} não encontrado. Preencha o nome — da próxima vez o app vai lembrar.`}
        </div>
        <ItemForm
          key={round}
          initial={result.prefill}
          onDone={onDone}
          onNext={() => { setAdded((n) => n + 1); setRound((r) => r + 1); setResult(null); setStage("scan"); }}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      {added > 0 && <div className="notice small">✔ {added} item(ns) adicionado(s). Próximo:</div>}
      <BarcodeScanner key={round} onCode={onCode} />
    </div>
  );
}

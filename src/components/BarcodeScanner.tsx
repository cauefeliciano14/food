import { useEffect, useRef, useState } from "react";
import { isValidBarcode } from "../lib/barcode";

/**
 * Camera reader. mode "produto": EAN/UPC barcodes on packages.
 * mode "qr": QR codes (NFC-e receipts). Calls onCode once with the first valid read.
 */
export function BarcodeScanner({ onCode, mode = "produto" }: { onCode: (code: string) => void; mode?: "produto" | "qr" }) {
  const valid = (t: string) => (mode === "qr" ? t.trim().length > 10 : isValidBarcode(t));
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const doneRef = useRef(false);

  useEffect(() => {
    let controls: { stop: () => void } | undefined;
    let cancelled = false;
    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        const hints = new Map();
        hints.set(
          DecodeHintType.POSSIBLE_FORMATS,
          mode === "qr" ? [BarcodeFormat.QR_CODE] : [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E],
        );
        const reader = new BrowserMultiFormatReader(hints);
        // The callback can fire before decodeFromConstraints resolves (a code
        // already in view), so the controls may not exist yet at that point.
        const c = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            const text = result?.getText();
            if (!text || doneRef.current || !valid(text)) return;
            doneRef.current = true;
            navigator.vibrate?.(60);
            controls?.stop();
            onCode(text);
          },
        );
        controls = c;
        if (cancelled || doneRef.current) c.stop();
      } catch (e) {
        const name = (e as Error)?.name;
        setError(
          name === "NotAllowedError"
            ? "Sem permissão para usar a câmera. Libere o acesso nas configurações do navegador, ou digite o código abaixo."
            : "Não consegui abrir a câmera. Digite o código abaixo.",
        );
      }
    })();
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [onCode, mode]);

  return (
    <div className="stack">
      {!error && (
        <div className="scanner">
          <video ref={videoRef} muted playsInline />
          <div className={`scanner-frame ${mode === "qr" ? "qr" : ""}`} />
        </div>
      )}
      {error ? <div className="error small">{error}</div> : (
        <p className="small muted" style={{ margin: 0 }}>
          {mode === "qr" ? "Aponte para o QR code impresso no fim do cupom." : "Aponte para o código de barras da embalagem."}
        </p>
      )}
      <form className="row" onSubmit={(e) => {
        e.preventDefault();
        const code = mode === "qr" ? manual.trim() : manual.replace(/\D/g, "");
        if (valid(code)) onCode(code);
      }}>
        <input type="text" inputMode={mode === "qr" ? "url" : "numeric"} value={manual} onChange={(e) => setManual(e.target.value)}
          placeholder={mode === "qr" ? "Ou cole o link da nota" : "Ou digite o código (EAN)"} aria-label={mode === "qr" ? "Link da nota" : "Código de barras"} />
        <button className="btn" type="submit" disabled={!valid(mode === "qr" ? manual.trim() : manual.replace(/\D/g, ""))}>OK</button>
      </form>
    </div>
  );
}

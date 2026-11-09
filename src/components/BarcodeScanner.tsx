import { useEffect, useRef, useState } from "react";
import { isValidBarcode } from "../lib/barcode";

/** Camera barcode reader (EAN/UPC). Calls onCode once with the first valid code. */
export function BarcodeScanner({ onCode }: { onCode: (code: string) => void }) {
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
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]);
        const reader = new BrowserMultiFormatReader(hints);
        // The callback can fire before decodeFromConstraints resolves (a code
        // already in view), so the controls may not exist yet at that point.
        const c = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            const text = result?.getText();
            if (!text || doneRef.current || !isValidBarcode(text)) return;
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
  }, [onCode]);

  return (
    <div className="stack">
      {!error && (
        <div className="scanner">
          <video ref={videoRef} muted playsInline />
          <div className="scanner-frame" />
        </div>
      )}
      {error ? <div className="error small">{error}</div> : <p className="small muted" style={{ margin: 0 }}>Aponte para o código de barras da embalagem.</p>}
      <form className="row" onSubmit={(e) => {
        e.preventDefault();
        const code = manual.replace(/\D/g, "");
        if (isValidBarcode(code)) onCode(code);
      }}>
        <input type="text" inputMode="numeric" placeholder="Ou digite o código (EAN)" value={manual} onChange={(e) => setManual(e.target.value)} aria-label="Código de barras" />
        <button className="btn" type="submit" disabled={!isValidBarcode(manual.replace(/\D/g, ""))}>OK</button>
      </form>
    </div>
  );
}

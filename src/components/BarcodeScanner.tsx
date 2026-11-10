import { useCallback, useEffect, useRef, useState } from "react";
import { isValidBarcode } from "../lib/barcode";
import { nativeScan, ScanCanceled, useNativeScanner } from "../lib/nativeScanner";
import { QrCode, ScanBarcode } from "lucide-react";

/**
 * Camera reader. mode "produto": EAN/UPC barcodes on packages.
 * mode "qr": QR codes (NFC-e receipts). Calls onCode once with the first valid read.
 */
export function BarcodeScanner(props: { onCode: (code: string) => void; mode?: "produto" | "qr" }) {
  return useNativeScanner() ? <NativeScanner {...props} /> : <WebScanner {...props} />;
}

/** Android app: opens Google's scanner screen right away; manual entry as a fallback. */
function NativeScanner({ onCode, mode = "produto" }: { onCode: (code: string) => void; mode?: "produto" | "qr" }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const open = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      const code = await nativeScan(mode, setStatus);
      const ok = mode === "qr" ? code.trim().length > 10 : isValidBarcode(code);
      if (!ok) {
        setError(mode === "qr" ? "Isso não parece um QR code de nota." : `Código lido (${code}) não é de produto. Tente de novo.`);
        return;
      }
      onCode(code);
    } catch (e) {
      if (!(e instanceof ScanCanceled)) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStatus("");
    }
  }, [mode, onCode]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    open();
  }, [open]);

  return (
    <div className="stack">
      {status && <div className="notice small">{status}</div>}
      {error && <div className="error small">{error}</div>}
      <button className="btn primary block" style={{ minHeight: 56 }} onClick={open} disabled={busy}>
        {mode === "qr" ? <><QrCode size={20} />Abrir leitor de QR code</> : <><ScanBarcode size={20} />Abrir leitor de código de barras</>}
      </button>
      <ManualEntry mode={mode} onCode={onCode} />
    </div>
  );
}

function ManualEntry({ onCode, mode }: { onCode: (code: string) => void; mode: "produto" | "qr" }) {
  const [manual, setManual] = useState("");
  const value = mode === "qr" ? manual.trim() : manual.replace(/\D/g, "");
  const ok = mode === "qr" ? value.length > 10 : isValidBarcode(value);
  return (
    <form className="row" onSubmit={(e) => { e.preventDefault(); if (ok) onCode(value); }}>
      <input type="text" inputMode={mode === "qr" ? "url" : "numeric"} value={manual} onChange={(e) => setManual(e.target.value)}
        placeholder={mode === "qr" ? "Ou cole o link da nota" : "Ou digite o código (EAN)"} aria-label={mode === "qr" ? "Link da nota" : "Código de barras"} />
      <button className="btn" type="submit" disabled={!ok}>OK</button>
    </form>
  );
}

/** Browser: ZXing on the camera stream. */
function WebScanner({ onCode, mode = "produto" }: { onCode: (code: string) => void; mode?: "produto" | "qr" }) {
  const valid = (t: string) => (mode === "qr" ? t.trim().length > 10 : isValidBarcode(t));
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
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
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(
          DecodeHintType.POSSIBLE_FORMATS,
          mode === "qr" ? [BarcodeFormat.QR_CODE] : [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E],
        );
        const reader = new BrowserMultiFormatReader(hints);
        // The callback can fire before decodeFromConstraints resolves (a code
        // already in view), so the controls may not exist yet at that point.
        const c = await reader.decodeFromConstraints(
          // Higher resolution makes a huge difference for 1D barcodes.
          { video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
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
      <ManualEntry mode={mode} onCode={onCode} />
    </div>
  );
}

import { isNative } from "./native";

export type ScanMode = "produto" | "qr";

export class ScanCanceled extends Error {}

/**
 * Android app: Google's ML Kit code scanner (the same one many apps use).
 * Fast, reliable with real packages, works offline and needs no camera
 * permission — Google Play Services owns the camera screen.
 */
export async function nativeScan(mode: ScanMode, onStatus?: (msg: string) => void): Promise<string> {
  const { BarcodeScanner, BarcodeFormat, GoogleBarcodeScannerModuleInstallState } = await import("@capacitor-mlkit/barcode-scanning");

  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    // One-time download of the scanner module through Play Services.
    onStatus?.("Preparando o leitor do Google (só na primeira vez)…");
    await new Promise<void>(async (resolve, reject) => {
      const handle = await BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress", (ev) => {
        if (ev.progress != null) onStatus?.(`Preparando o leitor do Google… ${ev.progress}%`);
        if (ev.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) {
          handle.remove();
          resolve();
        } else if (ev.state === GoogleBarcodeScannerModuleInstallState.FAILED || ev.state === GoogleBarcodeScannerModuleInstallState.CANCELED) {
          handle.remove();
          reject(new Error("Não consegui baixar o leitor do Google. Confira a internet e tente de novo."));
        }
      });
      try {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
      } catch (e) {
        handle.remove();
        reject(e);
      }
    });
    onStatus?.("");
  }

  const formats =
    mode === "qr"
      ? [BarcodeFormat.QrCode]
      : [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE];
  try {
    const { barcodes } = await BarcodeScanner.scan({ formats });
    const value = barcodes[0]?.rawValue ?? barcodes[0]?.displayValue;
    if (!value) throw new ScanCanceled();
    return value;
  } catch (e) {
    if (e instanceof ScanCanceled || /cancel/i.test(String((e as Error)?.message ?? e))) throw new ScanCanceled();
    throw e;
  }
}

export const useNativeScanner = isNative;

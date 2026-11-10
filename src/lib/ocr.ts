import { isNative } from "./native";

/** On-device text reading (Google ML Kit): free, offline, Android app only. */
export const canReadText = isNative;

export class PhotoCanceled extends Error {}

function isCancel(e: unknown) {
  return /cancel/i.test(String((e as Error)?.message ?? e));
}

export async function takePhoto(): Promise<string> {
  const { Camera } = await import("@capacitor/camera");
  try {
    const r = await Camera.takePhoto({ quality: 85, targetWidth: 2000, correctOrientation: true });
    if (!r.uri) throw new Error("A câmera não devolveu a foto.");
    return r.uri;
  } catch (e) {
    if (isCancel(e)) throw new PhotoCanceled();
    throw e;
  }
}

export async function choosePhotos(limit = 6): Promise<string[]> {
  const { Camera } = await import("@capacitor/camera");
  try {
    const r = await Camera.chooseFromGallery({ allowMultipleSelection: limit > 1, limit, quality: 85, targetWidth: 2000, correctOrientation: true });
    return r.results.map((x) => x.uri).filter((u): u is string => !!u);
  } catch (e) {
    if (isCancel(e)) throw new PhotoCanceled();
    throw e;
  }
}

export interface OcrLine {
  text: string;
  /** vertical position, for keeping reading order across blocks */
  top: number;
  left: number;
  /** line height in pixels — bigger letters usually mean the product name */
  height: number;
}

export async function readText(uri: string): Promise<{ text: string; lines: OcrLine[] }> {
  const { TextRecognition, Script } = await import("@capacitor-mlkit/text-recognition");
  const r = await TextRecognition.processImage({ path: uri, script: Script.Latin });
  const lines: OcrLine[] = [];
  for (const b of r.blocks) for (const l of b.lines) lines.push({
    text: l.text,
    top: l.boundingBox?.top ?? 0,
    left: l.boundingBox?.left ?? 0,
    height: l.boundingBox ? l.boundingBox.bottom - l.boundingBox.top : 0,
  });
  return { text: r.text, lines };
}

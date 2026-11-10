import { isNative } from "./native";
import { fileToJpegBase64 } from "./image";

/** On-device text reading (Google ML Kit): free, offline, Android app only. */
export const canReadText = isNative;

export class PhotoCanceled extends Error {}

/**
 * The camera plugin hands back a bare file path ("/data/user/0/…/photo.jpg").
 * Google's text reader and Android's share sheet both need a real URI
 * ("file:///data/…") — with a bare path they fail with "image could not be loaded".
 */
export function toFileUri(path: string): string {
  return path.startsWith("/") ? `file://${path}` : path;
}

function isCancel(e: unknown) {
  return /cancel/i.test(String((e as Error)?.message ?? e));
}

export async function takePhoto(): Promise<string> {
  const { Camera } = await import("@capacitor/camera");
  try {
    const r = await Camera.takePhoto({ quality: 85, targetWidth: 2000, correctOrientation: true });
    if (!r.uri) throw new Error("A câmera não devolveu a foto.");
    return toFileUri(r.uri);
  } catch (e) {
    if (isCancel(e)) throw new PhotoCanceled();
    throw e;
  }
}

export async function choosePhotos(limit = 6): Promise<string[]> {
  const { Camera } = await import("@capacitor/camera");
  try {
    const r = await Camera.chooseFromGallery({ allowMultipleSelection: limit > 1, limit, quality: 85, targetWidth: 2000, correctOrientation: true });
    return r.results.map((x) => x.uri).filter((u): u is string => !!u).map(toFileUri);
  } catch (e) {
    if (isCancel(e)) throw new PhotoCanceled();
    throw e;
  }
}

/** Load a photo taken in the app and shrink it for sending to the AI. */
export async function photoToJpegBase64(uri: string, maxSide = 1600): Promise<string> {
  const { Capacitor } = await import("@capacitor/core");
  const res = await fetch(Capacitor.convertFileSrc(toFileUri(uri)));
  const blob = await res.blob();
  return fileToJpegBase64(new File([blob], "foto.jpg", { type: blob.type || "image/jpeg" }), maxSide);
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
  const r = await TextRecognition.processImage({ path: toFileUri(uri), script: Script.Latin });
  const lines: OcrLine[] = [];
  for (const b of r.blocks) for (const l of b.lines) lines.push({
    text: l.text,
    top: l.boundingBox?.top ?? 0,
    left: l.boundingBox?.left ?? 0,
    height: l.boundingBox ? l.boundingBox.bottom - l.boundingBox.top : 0,
  });
  return { text: r.text, lines };
}

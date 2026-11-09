import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();

/** Share plain text: Android share sheet in the app, Web Share / clipboard in the browser. Returns how it went. */
export async function shareText(text: string): Promise<"shared" | "copied" | "cancelled"> {
  try {
    if (isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ text });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ text });
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "cancelled";
  }
}

/** Save a text file: download in the browser; in the app, write to cache and open the share sheet (Drive, WhatsApp, Files…). */
export async function saveTextFile(filename: string, content: string, mime = "application/json") {
  if (isNative()) {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const { uri } = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: filename, files: [uri] });
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

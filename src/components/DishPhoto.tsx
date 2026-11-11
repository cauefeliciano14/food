import { useRef, useState } from "react";
import { Camera, Images, Trash2 } from "lucide-react";
import { db } from "../lib/db";
import { fileToJpegBase64 } from "../lib/image";
import { isNative } from "../lib/native";
import { choosePhotos, photoToJpegBase64, PhotoCanceled, takePhoto } from "../lib/ocr";
import type { Recipe } from "../lib/types";

/** Small JPEG (≈60–120 KB) so hundreds of recipes still fit comfortably on the phone. */
const SIDE = 900;

/** Add / change / remove the photo of the finished dish. */
export function DishPhoto({ recipe }: { recipe: Recipe }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(b64: string) {
    await db.recipes.update(recipe.id!, { photo: `data:image/jpeg;base64,${b64}` });
  }

  async function pick(camera: boolean) {
    setError("");
    if (!isNative()) return fileRef.current?.click();
    setBusy(true);
    try {
      const uri = camera ? await takePhoto() : (await choosePhotos(1))[0];
      if (uri) await save(await photoToJpegBase64(uri, SIDE));
    } catch (e) {
      if (!(e instanceof PhotoCanceled)) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        if (f) await save(await fileToJpegBase64(f, SIDE, 0.8));
        e.target.value = "";
      }} />
      <div className={recipe.photo ? "grid-3" : "grid-2"}>
        <button className="btn" onClick={() => pick(true)} disabled={busy}><Camera size={18} />{recipe.photo ? "Nova foto" : "Foto do prato"}</button>
        {isNative() && <button className="btn" onClick={() => pick(false)} disabled={busy}><Images size={18} />Galeria</button>}
        {recipe.photo && <button className="btn" onClick={() => db.recipes.update(recipe.id!, { photo: undefined })} aria-label="Remover foto"><Trash2 size={18} />Remover</button>}
      </div>
      {error && <div className="error small">{error}</div>}
    </div>
  );
}

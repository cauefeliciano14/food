import { useRef, useState } from "react";
import { db, exportBackup, importBackup } from "../lib/db";
import { applyTheme, loadSettings, saveSettings, type Theme } from "../lib/settings";
import { today } from "../lib/dates";
import { isNative, saveTextFile } from "../lib/native";
import { Bell, Download, Palette, Save, Sparkles } from "lucide-react";

export function Settings() {
  const [s, setS] = useState(loadSettings());
  const [msg, setMsg] = useState("");
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");
  const fileRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<typeof s>) {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  }

  async function doExport() {
    try {
      await saveTextFile(`despensa-backup-${today()}.json`, JSON.stringify(await exportBackup(), null, 2));
    } catch {
      /* share sheet dismissed */
    }
  }

  async function doImport(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!confirm("Importar vai SUBSTITUIR todos os dados atuais. Continuar?")) return;
      await importBackup(data);
      setMsg("Backup restaurado");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Arquivo inválido.");
    }
  }

  return (
    <>
      <header className="page-header"><h1>Ajustes</h1></header>
      <div className="page stack">
        <div className="card stack">
          <b className="icon-label"><Palette size={18} />Aparência</b>
          <div className="segmented" role="radiogroup" aria-label="Tema">
            {([
              ["auto", "Automático"],
              ["claro", "Claro"],
              ["escuro", "Escuro"],
            ] as [Theme, string][]).map(([v, label]) => (
              <button key={v} role="radio" aria-checked={s.theme === v} className={s.theme === v ? "active" : ""}
                onClick={() => { update({ theme: v }); applyTheme(v); }}>{label}</button>
            ))}
          </div>
          <span className="small muted">Automático segue o modo claro/escuro do celular.</span>
        </div>

        <div className="card stack">
          <b className="icon-label"><Sparkles size={18} />IA (opcional, paga)</b>
          <p className="small muted" style={{ margin: 0 }}>
            Não é necessária para o QR code da nota nem para o código de barras, que são grátis. Usa o Claude (Anthropic). Crie uma chave em <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a> e cole aqui.
            A chave fica salva apenas neste aparelho e é enviada só para a API da Anthropic. Cada leitura de nota custa alguns centavos.
          </p>
          <input type="password" autoComplete="off" placeholder="sk-ant-…" value={s.apiKey} onChange={(e) => update({ apiKey: e.target.value.trim() })} />
        </div>

        <div className="card stack">
          <b className="icon-label"><Bell size={18} />Avisos de validade</b>
          <p className="small muted" style={{ margin: 0 }}>
            Ao abrir o app, ele avisa (uma vez por dia) o que vence nos próximos dias.
          </p>
          <label className="field">
            <span>Avisar com quantos dias de antecedência</span>
            <select value={s.notifyDays} onChange={(e) => update({ notifyDays: Number(e.target.value) })}>
              {[1, 2, 3, 5, 7].map((d) => <option key={d} value={d}>{d} dia(s)</option>)}
            </select>
          </label>
          {isNative() && <span className="small muted">No app Android, o aviso aparece na tela inicial ao abrir.</span>}
          {perm !== "granted" && typeof Notification !== "undefined" && (
            <button className="btn" onClick={async () => setPerm(await Notification.requestPermission())}>Permitir notificações</button>
          )}
          {perm === "granted" && <span className="small muted">Notificações permitidas</span>}
        </div>

        <div className="card stack">
          <b className="icon-label"><Save size={18} />Backup</b>
          <p className="small muted" style={{ margin: 0 }}>Seus dados ficam só neste aparelho/navegador. Exporte de vez em quando para não perder.</p>
          <div className="grid-2">
            <button className="btn" onClick={doExport}>Exportar</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>Importar</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
          {msg && <div className="small">{msg}</div>}
        </div>

        <div className="card stack">
          <b>Zona de perigo</b>
          <button className="btn danger" onClick={async () => {
            if (!confirm("Apagar TODOS os itens da despensa?")) return;
            await db.items.clear();
            setMsg("Despensa esvaziada.");
          }}>Esvaziar despensa</button>
        </div>
        {isNative() && (
          <div className="card stack">
            <b className="icon-label"><Download size={18} />Atualizar o app</b>
            <p className="small muted" style={{ margin: 0 }}>Baixe o APK mais novo e instale por cima — seus dados continuam.</p>
            <a className="btn" href="https://github.com/cauefeliciano14/food/releases/latest" target="_blank" rel="noreferrer">Ver versão mais recente</a>
          </div>
        )}
        <p className="small muted" style={{ textAlign: "center" }}>Despensa{import.meta.env.VITE_APP_VERSION ? ` ${import.meta.env.VITE_APP_VERSION}` : ""}</p>
      </div>
    </>
  );
}

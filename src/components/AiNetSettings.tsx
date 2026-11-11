import { useEffect, useState } from "react";
import { Globe, Sparkles } from "lucide-react";
import { keyDaysLeft, loadSpend, type AiUses, type NetUses, type Settings } from "../lib/settings";

export function Switch({ on, onChange, label, hint, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={`switch-row ${disabled ? "disabled" : ""}`} onClick={() => !disabled && onChange(!on)} disabled={disabled}>
      <span className="switch-text">
        <span>{label}</span>
        {hint && <span className="small muted">{hint}</span>}
      </span>
      <span className={`switch ${on ? "on" : ""}`} aria-hidden="true"><span /></span>
    </button>
  );
}

const AI_USES: [keyof AiUses, string, string][] = [
  ["produto", "Foto do produto", "Nome, categoria e tamanho quando o código não é achado"],
  ["validade", "Foto da validade", "Só quando a leitura grátis do celular não acha a data"],
  ["receita", "Receita por foto", "Letra cursiva, colunas, páginas tortas"],
  ["link", "Receita por link", "Só quando o site não publica a receita em formato padrão"],
  ["nota", "Nota sem QR code", "Lê a foto do cupom"],
  ["sugestao", "Sugestões de receita", "Cria receitas com o que você tem"],
];

const NET_USES: [keyof NetUses, string, string][] = [
  ["produtos", "Base de produtos", "Nome do produto pelo código de barras (Open Food Facts) — grátis"],
  ["sefaz", "Nota fiscal (SEFAZ)", "Lista de compras pelo QR code do cupom — grátis"],
  ["links", "Sites de receita", "Só a página do link que você colar — grátis"],
];

const LIMITS = [1, 2, 3, 5, 10, 20];

const usd = (n: number) => `US$ ${n.toFixed(2).replace(".", ",")}`;

export function AiSettings({ s, update }: { s: Settings; update: (p: Partial<Settings>) => void }) {
  const [spend, setSpend] = useState(loadSpend);
  useEffect(() => {
    const on = () => setSpend(loadSpend());
    window.addEventListener("despensa:spend", on);
    return () => window.removeEventListener("despensa:spend", on);
  }, []);
  const pct = Math.min(100, (spend.usd / Math.max(0.01, s.aiMonthlyLimit)) * 100);
  const ready = s.aiEnabled && !!s.apiKey;

  return (
    <div className="card stack">
      <b className="icon-label"><Sparkles size={18} />IA (Claude)</b>
      <Switch on={s.aiEnabled} onChange={(v) => update({ aiEnabled: v })} label="Usar IA"
        hint="Desligada, o app usa só a leitura grátis do celular." />
      {s.aiEnabled && (
        <>
          <label className="field">
            <span>Chave da API da Anthropic</span>
            <input type="password" autoComplete="off" placeholder="sk-ant-…" value={s.apiKey} onChange={(e) => update({ apiKey: e.target.value.trim(), apiKeyExpires: "" })} />
          </label>
          <label className="field">
            <span>A chave vence em (a data em “Expira” no Console)</span>
            <input type="date" value={s.apiKeyExpires} onChange={(e) => update({ apiKeyExpires: e.target.value })} />
          </label>
          <KeyExpiryNote s={s} />
          <p className="small muted" style={{ margin: 0 }}>
            Crie em <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a>. A chave fica só neste celular e vai direto para a Anthropic.
            Para segurança extra, defina também um limite de gasto lá no Console (Limits).
          </p>
          <label className="field">
            <span>Limite de gasto por mês</span>
            <select value={s.aiMonthlyLimit} onChange={(e) => update({ aiMonthlyLimit: Number(e.target.value) })}>
              {LIMITS.map((l) => <option key={l} value={l}>{usd(l)}</option>)}
            </select>
          </label>
          <div className="stack" style={{ gap: 6 }}>
            <div className="row small" style={{ justifyContent: "space-between" }}>
              <span>Gasto este mês</span>
              <b>{usd(spend.usd)} de {usd(s.aiMonthlyLimit)}</b>
            </div>
            <div className="progress"><div style={{ width: `${pct}%`, background: pct >= 100 ? "var(--danger)" : undefined }} /></div>
            <span className="small muted">{spend.calls} {spend.calls === 1 ? "uso" : "usos"}. Ao chegar no limite, a IA para até o mês virar. Valor estimado pelo app, um pouco acima do real.</span>
          </div>
          <b className="small" style={{ marginTop: 4 }}>Onde usar a IA</b>
          <div className="switch-list">
            {AI_USES.map(([k, label, hint]) => (
              <Switch key={k} on={s.ai[k]} disabled={!ready} label={label} hint={hint} onChange={(v) => update({ ai: { ...s.ai, [k]: v } })} />
            ))}
          </div>
          {!s.apiKey && <span className="small muted">Cole a chave para ativar.</span>}
        </>
      )}
    </div>
  );
}

export function KeyExpiryNote({ s, onOpen }: { s: Settings; onOpen?: () => void }) {
  const d = keyDaysLeft(s);
  if (d == null || d > 3) {
    return s.aiEnabled && s.apiKey && !s.apiKeyExpires && !onOpen
      ? <span className="small muted">Informe a data para o app avisar antes de a chave vencer.</span>
      : null;
  }
  const text = d < 0 ? "A chave da IA venceu." : d === 0 ? "A chave da IA vence hoje." : `A chave da IA vence em ${d} ${d === 1 ? "dia" : "dias"}.`;
  const body = (
    <>
      <b>{text}</b> Crie outra em console.anthropic.com → Chaves de API (escolha um prazo longo) e cole em Ajustes → IA.
    </>
  );
  return onOpen
    ? <button type="button" className={`notice small ${d < 0 ? "error" : ""}`} style={{ textAlign: "left", width: "100%", border: "none", cursor: "pointer", marginBottom: 12, font: "inherit", color: "inherit" }} onClick={onOpen}>{body}</button>
    : <div className={`notice small ${d < 0 ? "error" : ""}`} role="status">{body}</div>;
}

export function NetSettings({ s, update }: { s: Settings; update: (p: Partial<Settings>) => void }) {
  return (
    <div className="card stack">
      <b className="icon-label"><Globe size={18} />Internet</b>
      <p className="small muted" style={{ margin: 0 }}>
        Seus dados ficam no celular. O app só acessa a internet para o que estiver ligado aqui{s.aiEnabled ? " e para a IA" : ""}. Tudo desligado, ele funciona offline.
      </p>
      <div className="switch-list">
        {NET_USES.map(([k, label, hint]) => (
          <Switch key={k} on={s.net[k]} label={label} hint={hint} onChange={(v) => update({ net: { ...s.net, [k]: v } })} />
        ))}
      </div>
    </div>
  );
}

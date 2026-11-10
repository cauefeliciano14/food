const KEY = "despensa:settings";

export type Theme = "auto" | "claro" | "escuro";

/** Where the AI may be used. Each one is a switch in Ajustes. */
export interface AiUses {
  produto: boolean; // product name from a package photo
  validade: boolean; // expiry date when the free reader can't find it
  receita: boolean; // recipe from cookbook photos
  link: boolean; // recipe from a site that doesn't publish it in a readable format
  nota: boolean; // receipt photo without QR code
  sugestao: boolean; // "what can I cook" suggestions
}

/** What the app may reach on the internet. Everything else stays on the phone. */
export interface NetUses {
  produtos: boolean; // Open Food Facts (barcode names) — free
  sefaz: boolean; // receipt QR code page — free
  links: boolean; // recipe sites, when you paste a link — free
}

export interface Settings {
  apiKey: string;
  notifyDays: number;
  theme: Theme;
  /** master switch for the AI */
  aiEnabled: boolean;
  /** monthly spending cap in US$ (what Anthropic charges); the app stops calling the AI past it */
  aiMonthlyLimit: number;
  ai: AiUses;
  net: NetUses;
}

const DEFAULTS: Settings = {
  apiKey: "", notifyDays: 3, theme: "auto",
  aiEnabled: false, aiMonthlyLimit: 3,
  ai: { produto: true, validade: true, receita: true, link: true, nota: true, sugestao: true },
  net: { produtos: true, sefaz: true, links: true },
};

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    // Before 1.13 having a key meant "AI on".
    const aiEnabled = saved.aiEnabled ?? !!saved.apiKey;
    return {
      ...DEFAULTS, ...saved, aiEnabled,
      ai: { ...DEFAULTS.ai, ...saved.ai }, net: { ...DEFAULTS.net, ...saved.net },
    };
  } catch {
    return { ...DEFAULTS, ai: { ...DEFAULTS.ai }, net: { ...DEFAULTS.net } };
  }
}

/** Is the AI on, with a key, for this use? */
export function aiAllowed(use: keyof AiUses, s: Settings = loadSettings()): boolean {
  return s.aiEnabled && !!s.apiKey && s.ai[use];
}

export function netAllowed(use: keyof NetUses, s: Settings = loadSettings()): boolean {
  return s.net[use];
}

// ---------- AI spending (kept on the phone, per calendar month) ----------

const SPEND_KEY = "despensa:aiSpend";

export interface Spend { month: string; usd: number; calls: number }

const thisMonth = () => new Date().toISOString().slice(0, 7);

export function loadSpend(): Spend {
  try {
    const s = JSON.parse(localStorage.getItem(SPEND_KEY) || "null") as Spend | null;
    if (s && s.month === thisMonth()) return s;
  } catch { /* ignore */ }
  return { month: thisMonth(), usd: 0, calls: 0 };
}

export function addSpend(usd: number) {
  const s = loadSpend();
  const next = { month: s.month, usd: +(s.usd + usd).toFixed(6), calls: s.calls + 1 };
  try {
    localStorage.setItem(SPEND_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("despensa:spend"));
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked — ignore */
  }
}

const THEME_COLORS = { claro: "#2f7d4f", escuro: "#121513" };

/** Apply the theme to <html data-theme> and the browser/status-bar color. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "auto") delete root.dataset.theme;
  else root.dataset.theme = theme;
  const dark = theme === "escuro" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? THEME_COLORS.escuro : THEME_COLORS.claro);
}

/** Keep the status-bar color right when the system theme flips while in "auto". */
export function watchSystemTheme() {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (loadSettings().theme === "auto") applyTheme("auto");
  });
}

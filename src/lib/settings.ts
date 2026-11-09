const KEY = "despensa:settings";

export type Theme = "auto" | "claro" | "escuro";

export interface Settings {
  apiKey: string;
  notifyDays: number;
  theme: Theme;
}

const DEFAULTS: Settings = { apiKey: "", notifyDays: 3, theme: "auto" };

export function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
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

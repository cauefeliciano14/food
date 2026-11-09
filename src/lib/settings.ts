const KEY = "despensa:settings";

export interface Settings {
  apiKey: string;
  notifyDays: number;
}

const DEFAULTS: Settings = { apiKey: "", notifyDays: 3 };

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

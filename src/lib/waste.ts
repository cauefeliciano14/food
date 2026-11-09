import type { Category, HistoryEntry } from "./types";
import { daysBetween, today } from "./dates";
import { normalize } from "./normalize";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export interface MonthStat {
  key: string; // YYYY-MM
  label: string;
  used: number;
  wasted: number;
  wastedValue: number;
  /** 0..1, null when nothing happened that month */
  wasteRate: number | null;
}

/** Last `months` calendar months (oldest first), counting history events. */
export function monthlyStats(history: HistoryEntry[], months = 6, ref = today()): MonthStat[] {
  const [y, m] = ref.split("-").map(Number);
  const out: MonthStat[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const evs = history.filter((h) => h.date.startsWith(key));
    const used = evs.filter((h) => h.action === "consumido").length;
    const wastedEvs = evs.filter((h) => h.action === "descartado");
    const wasted = wastedEvs.length;
    out.push({
      key,
      label: `${MONTHS[d.getMonth()]}${d.getFullYear() !== y ? `/${String(d.getFullYear()).slice(2)}` : ""}`,
      used,
      wasted,
      wastedValue: +wastedEvs.reduce((s, h) => s + (h.value ?? 0), 0).toFixed(2),
      wasteRate: used + wasted ? wasted / (used + wasted) : null,
    });
  }
  return out;
}

export interface WastedItem {
  name: string;
  category: Category;
  count: number;
  value: number;
  lastDate: string;
}

/** What got thrown away most in the last `days` days. */
export function topWasted(history: HistoryEntry[], days = 90, ref = today()): WastedItem[] {
  const groups = new Map<string, WastedItem>();
  for (const h of history) {
    if (h.action !== "descartado" || daysBetween(h.date, ref) > days) continue;
    const key = normalize(h.itemName);
    const g = groups.get(key) ?? { name: h.itemName, category: h.category, count: 0, value: 0, lastDate: h.date };
    g.count++;
    g.value = +(g.value + (h.value ?? 0)).toFixed(2);
    if (h.date > g.lastDate) g.lastDate = h.date;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || b.value - a.value || a.name.localeCompare(b.name));
}

export function wastedByCategory(history: HistoryEntry[], days = 90, ref = today()) {
  const counts = new Map<Category, number>();
  for (const h of history) {
    if (h.action !== "descartado" || daysBetween(h.date, ref) > days) continue;
    counts.set(h.category, (counts.get(h.category) ?? 0) + 1);
  }
  return [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
}

const TIPS: Partial<Record<Category, string>> = {
  hortifruti: "compre menos por vez, ou congele picado antes de estragar",
  carnes: "congele no dia da compra o que não for usar em 2 dias",
  peixes: "congele no dia da compra o que não for usar logo",
  padaria: "congele fatiado e toste direto do freezer",
  laticinios: "compre embalagens menores ou planeje uma receita para usar",
};

export function tipFor(item: WastedItem): string {
  const base = TIPS[item.category] ?? "compre menor quantidade ou planeje uma receita para usar antes";
  return item.count >= 2 ? `Jogou fora ${item.count}x — ${base}.` : `${base[0].toUpperCase()}${base.slice(1)}.`;
}

export function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

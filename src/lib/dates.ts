/** Date helpers that work on local YYYY-MM-DD strings (no timezone surprises). */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const a = parseISODate(from).getTime();
  const b = parseISODate(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export type ExpiryStatus = "vencido" | "hoje" | "urgente" | "breve" | "ok" | "sem-data";

/** urgente: até 3 dias; breve: até 7 dias. */
export function expiryStatus(expiryDate: string, ref: string = today()): ExpiryStatus {
  if (!expiryDate) return "sem-data";
  const d = daysBetween(ref, expiryDate);
  if (d < 0) return "vencido";
  if (d === 0) return "hoje";
  if (d <= 3) return "urgente";
  if (d <= 7) return "breve";
  return "ok";
}

export function expiryLabel(expiryDate: string, ref: string = today()): string {
  if (!expiryDate) return "sem validade";
  const d = daysBetween(ref, expiryDate);
  if (d < -1) return `venceu há ${-d} dias`;
  if (d === -1) return "venceu ontem";
  if (d === 0) return "vence hoje";
  if (d === 1) return "vence amanhã";
  if (d <= 30) return `vence em ${d} dias`;
  return `vence em ${formatBR(expiryDate)}`;
}

export function formatBR(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Finds the expiry date in text read from a package photo (OCR).
 * Handles "VAL 12/03/27", "VENC: 12.03.2027", "12 MAR 2027", "MAR/27",
 * "03/2027", and the date of manufacture printed next to it ("FAB ...").
 */
import { today } from "./dates";

const MONTHS: Record<string, number> = {
  JAN: 1, FEV: 2, FEB: 2, MAR: 3, ABR: 4, APR: 4, MAI: 5, MAY: 5, JUN: 6, JUL: 7,
  AGO: 8, AUG: 8, SET: 9, SEP: 9, OUT: 10, OCT: 10, NOV: 11, DEZ: 12, DEC: 12,
};
const EXPIRY_WORDS = /\b(VAL(IDADE)?|VALID|VENC(IMENTO)?|VCTO|VTO|V|EXP|CONSUMIR|CONS\.?\s*ATE|BEST\s*BEFORE|BB)\b\.?:?/g;
const OTHER_WORDS = /\b(FAB(RICA[CÇ][AÃ]O)?|FABR|F|PROD|EMB(ALAD[OA])?|L(OTE)?|LOT)\b\.?:?/g;

export interface ExpiryReading {
  best: string | null;
  /** other plausible dates, most likely first (to let the user pick) */
  candidates: string[];
}

interface Hit { iso: string; index: number; precise: boolean }

const pad = (n: number) => String(n).padStart(2, "0");

function fullYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}

function lastDay(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function validDate(y: number, m: number, d: number): boolean {
  return m >= 1 && m <= 12 && d >= 1 && d <= lastDay(y, m);
}

/**
 * Undo common OCR confusions (O→0, I/L→1, S→5, B→8, Z→2) only inside tokens
 * that are mostly digits, so words like "VAL" or "FAB" stay intact.
 */
function fixDigits(s: string): string {
  return s.replace(/[A-Z0-9|]+/g, (tok) => {
    const digits = (tok.match(/\d/g) ?? []).length;
    if (digits === 0 || digits * 2 < tok.length) return tok;
    return tok.replace(/[OQD]/g, "0").replace(/[IL|]/g, "1").replace(/S/g, "5").replace(/B/g, "8").replace(/Z/g, "2");
  });
}

function collectDates(text: string): Hit[] {
  const hits: Hit[] = [];
  const add = (y: number, m: number, d: number, index: number, precise: boolean) => {
    y = fullYear(y);
    if (validDate(y, m, d)) hits.push({ iso: `${y}-${pad(m)}-${pad(d)}`, index, precise });
  };
  let m: RegExpExecArray | null;
  // dd/mm/yyyy, dd.mm.yy, dd-mm-yy, dd mm yyyy
  const dmy = /(?<!\d)(\d{1,2})\s?[/.\-\s]\s?(\d{1,2})\s?[/.\-\s]\s?(\d{4}|\d{2})(?!\d)/g;
  while ((m = dmy.exec(text))) add(+m[3], +m[2], +m[1], m.index, true);
  // dd MMM yyyy / ddMMMyy / dd/MMM/yy
  const dMy = /(?<!\d)(\d{1,2})\s?[/.\-]?\s?([A-Z]{3})[A-Z]*\.?\s?[/.\-]?\s?(\d{4}|\d{2})(?!\d)/g;
  while ((m = dMy.exec(text))) if (MONTHS[m[2]]) add(+m[3], MONTHS[m[2]], +m[1], m.index, true);
  // MMM/yyyy, MMM yy → end of month
  const My = /(?<![A-Z\d])([A-Z]{3})[A-Z]*\.?\s?[/.\-]?\s?(\d{4}|\d{2})(?!\d)/g;
  while ((m = My.exec(text))) if (MONTHS[m[1]]) add(+m[2], MONTHS[m[1]], lastDay(fullYear(+m[2]), MONTHS[m[1]]), m.index, false);
  // mm/yyyy → end of month (only 4-digit years, to avoid matching dd/mm)
  const my = /(?<![\d/.\-])(\d{1,2})\s?[/.\-]\s?(\d{4})(?![\d/.\-])/g;
  while ((m = my.exec(text))) add(+m[2], +m[1], lastDay(+m[2], +m[1]), m.index, false);
  return hits;
}

function positions(re: RegExp, text: string): number[] {
  const out: number[] = [];
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(text))) out.push(m.index + m[0].length);
  return out;
}

export function parseExpiryFromText(raw: string, ref: string = today()): ExpiryReading {
  const text = fixDigits(raw.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "));
  const hits = collectDates(text);
  if (hits.length === 0) return { best: null, candidates: [] };

  const expiryMarks = positions(EXPIRY_WORDS, text);
  const otherMarks = positions(OTHER_WORDS, text);
  const refYear = Number(ref.slice(0, 4));

  const scored = new Map<string, number>();
  for (const h of hits) {
    const year = Number(h.iso.slice(0, 4));
    if (year < refYear - 2 || year > refYear + 12) continue;
    let score = h.precise ? 1 : 0;
    // closest preceding label decides: "VAL ..." vs "FAB ..."
    const prevExp = Math.max(-1, ...expiryMarks.filter((p) => p <= h.index + 1));
    const prevOther = Math.max(-1, ...otherMarks.filter((p) => p <= h.index + 1));
    if (prevExp >= 0 && prevExp > prevOther && h.index - prevExp < 25) score += 6;
    if (prevOther >= 0 && prevOther > prevExp && h.index - prevOther < 25) score -= 6;
    if (h.iso >= ref) score += 2; // expiry dates are usually in the future
    scored.set(h.iso, Math.max(scored.get(h.iso) ?? -Infinity, score));
  }
  const ranked = [...scored.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0])).map(([iso]) => iso);
  return { best: ranked[0] ?? null, candidates: ranked.slice(1, 4) };
}

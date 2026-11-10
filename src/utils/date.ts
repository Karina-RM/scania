export const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export interface YearMonth {
  year: number;
  month: number; // 1 a 12
}

const pad = (n: number) => String(n).padStart(2, '0');

// Datas do app trafegam como texto AAAA-MM-DD (evita bugs de fuso horário).
export function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toISO(new Date(y, m - 1, d + days));
}

export function isoToBr(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// "25/12/2026" -> "2026-12-25". Retorna null se a data não existir.
export function brToISO(br: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const check = new Date(year, month - 1, day);
  const valid =
    check.getFullYear() === year &&
    check.getMonth() === month - 1 &&
    check.getDate() === day;
  return valid ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

// Máscara DD/MM/AAAA enquanto o usuário digita.
export function maskBrDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function currentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function shiftMonth(ym: YearMonth, delta: number): YearMonth {
  const index = ym.year * 12 + (ym.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

// Intervalo [start, endExclusive) do mês, em AAAA-MM-DD.
export function monthRange(ym: YearMonth): { start: string; endExclusive: string } {
  const next = shiftMonth(ym, 1);
  return {
    start: `${ym.year}-${pad(ym.month)}-01`,
    endExclusive: `${next.year}-${pad(next.month)}-01`,
  };
}

export function monthLabel(ym: YearMonth): string {
  return `${MONTHS_PT[ym.month - 1]} ${ym.year}`;
}

export function dayLabel(iso: string, today: string = todayISO()): string {
  if (iso === today) return 'Hoje';
  if (iso === addDaysISO(today, -1)) return 'Ontem';
  return isoToBr(iso).slice(0, 5);
}

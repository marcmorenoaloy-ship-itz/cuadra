export function eur(n: number, decimals = 2): string {
  return n.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Convierte "1.234,56", "1234.56" o "12,5" en número. */
export function parseAmount(text: string): number {
  const clean = text.replace(/[^\d.,-]/g, '');
  if (!clean) return NaN;
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');
  if (lastComma > lastDot) return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  // Solo puntos: si hay exactamente 3 cifras detrás del último punto, es separador de miles.
  if (lastDot >= 0 && lastComma < 0 && clean.length - lastDot - 1 === 3) return parseFloat(clean.replace(/\./g, ''));
  return parseFloat(clean.replace(/,/g, ''));
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function monthKey(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthName(d: Date = new Date()): string {
  return d.toLocaleDateString('es-ES', { month: 'long' });
}

export function daysUntil(dayOfMonth: number, from: Date = new Date()): number {
  const target = new Date(from.getFullYear(), from.getMonth(), dayOfMonth);
  if (target <= from) target.setMonth(target.getMonth() + 1);
  return Math.ceil((target.getTime() - from.getTime()) / 86_400_000);
}

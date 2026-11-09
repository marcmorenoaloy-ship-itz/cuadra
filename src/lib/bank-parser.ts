import { guessCategory, type MovementType } from './categories';
import { parseAmount } from './format';

export type ParsedMovement = {
  type: MovementType;
  amount: number;
  merchant: string;
  categoryId: string | null;
};

const AMOUNT =
  /(?:€\s?)?(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s?(?:€|eur\b|euros\b)|€\s?(\d+(?:[.,]\d{1,2})?)/i;
const INCOME = /ingreso|ingresado|recibido|abono|te han (enviado|pagado|hecho)|nómina|nomina|devoluci|reembolso/i;
const PROMO = /consigue|gana hasta|oferta|promoci|sorteo|descuento de/i;
const MOVEMENT =
  /pago|pagado|compra|cargo|recibo|adeudo|retirada|reintegro|bizum|transferencia|ingreso|ingresado|recibido|abono|has enviado|nómina|nomina|domiciliaci|devoluci/i;

const BANK_NAMES: Record<string, string> = {
  'com.bbva.bbvacontigo': 'BBVA',
  'es.lacaixa.mobile.android.newwapicon': 'CaixaBank',
  'com.imaginbank.app': 'imagin',
  'es.bancosantander.apps': 'Santander',
  'es.openbank.mobile': 'Openbank',
  'www.ingdirect.nativeframe': 'ING',
  'com.bankinter.launcher': 'Bankinter',
  'net.inverline.bancosabadell.officelocator.android': 'Sabadell',
  'com.revolut.revolut': 'Revolut',
  'de.number26.android': 'N26',
  'com.google.android.apps.walletnfcrel': 'Google Wallet',
};

export function bankName(pkg: string): string {
  return BANK_NAMES[pkg] ?? 'tu banco';
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function findMerchant(text: string, type: MovementType): string | null {
  const patterns: RegExp[] =
    type === 'ingreso'
      ? [/\bde\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.&'\- ]{1,40}?)(?=\s+(?:por|con|en|el|a las)\b|[.,:;!]|$)/, /\bfrom\s+(.{2,40}?)(?=[.,]|$)/i]
      : [
          /\ben\s+(.{2,40}?)(?=\s+(?:con|el|a las|por|desde|mediante)\b|[,:;!(]|[.](?:\s|$)|\s+\d|$)/i,
          /\b(?:recibo|adeudo|cargo)(?:\s+domiciliado)?\s+de\s+(.{2,40}?)(?=\s+(?:por|de)\b|[,:;!(]|[.](?:\s|$)|$)/i,
          /\ba\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.&'\- ]{1,40}?)(?=\s+(?:por|con|el)\b|[.,:;!]|$)/,
          /\bat\s+(.{2,40}?)(?=[.,]|$)/i,
        ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const candidate = m[1].replace(/tu tarjeta.*$/i, '').trim();
      if (candidate && !/^\d/.test(candidate) && !/^(tu|su|la|el)\b/i.test(candidate)) return titleCase(candidate);
    }
  }
  return null;
}

/**
 * Interpreta el texto de un aviso del banco. Devuelve null si no parece un movimiento.
 * Ejemplos que entiende:
 *  - "Has pagado 23,40 € en LIDL con tu tarjeta ...1234"
 *  - "Compra con tarjeta *1234 de 23,40 EUR en MERCADONA"
 *  - "Has recibido un Bizum de 20,00 € de LAURA GARCIA"
 *  - "Te han ingresado la nómina: 1.650,00 €"
 */
export function parseBankNotification(title: string, text: string, pkg = ''): ParsedMovement | null {
  const full = `${title}. ${text}`.replace(/ /g, ' ');
  if (!MOVEMENT.test(full) || PROMO.test(full)) return null;
  const m = full.match(AMOUNT);
  if (!m) return null;
  const amount = parseAmount(m[1] ?? m[2] ?? '');
  if (!(amount > 0)) return null;

  const type: MovementType = INCOME.test(full) ? 'ingreso' : 'gasto';
  // Quita el importe antes de buscar el comercio para que "de 23,40 €" no cuente como nombre.
  const withoutAmount = full.replace(m[0], ' ');
  const merchant =
    findMerchant(withoutAmount, type) ??
    (/bizum/i.test(full) ? 'Bizum' : /nómina|nomina/i.test(full) ? 'Nómina' : /transferencia/i.test(full) ? 'Transferencia' : bankName(pkg));

  const categoryId =
    guessCategory(merchant, type) ??
    guessCategory(full, type) ??
    (type === 'ingreso' && /bizum|transferencia/i.test(full) ? 'extra' : null);

  return { type, amount, merchant, categoryId };
}

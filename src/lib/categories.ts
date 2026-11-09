export type MovementType = 'gasto' | 'ingreso';

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: MovementType;
  /** Peso para repartir el presupuesto inicial a partir de lo que se cobra. */
  weight?: number;
  /** Palabras que, si aparecen en el comercio, sugieren esta categoría. */
  keywords?: string[];
};

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'super', name: 'Súper', emoji: '🛒', color: '#2f9e6e', type: 'gasto', weight: 0.18,
    keywords: ['mercadona', 'lidl', 'carrefour', 'aldi', 'dia ', 'eroski', 'alcampo', 'consum', 'bonpreu', 'caprabo', 'hipercor', 'supermerc'] },
  { id: 'casa', name: 'Casa', emoji: '🏠', color: '#5b6cd6', type: 'gasto', weight: 0.4,
    keywords: ['alquiler', 'hipoteca', 'comunidad', 'ikea', 'leroy'] },
  { id: 'facturas', name: 'Facturas', emoji: '💡', color: '#e0a21b', type: 'gasto', weight: 0.08,
    keywords: ['iberdrola', 'endesa', 'naturgy', 'repsol luz', 'movistar', 'vodafone', 'orange', 'digi', 'agua', 'aigues', 'masmovil', 'pepephone'] },
  { id: 'transporte', name: 'Transporte', emoji: '🚗', color: '#2c8fc9', type: 'gasto', weight: 0.07,
    keywords: ['repsol', 'cepsa', 'galp', 'bp ', 'shell', 'gasolin', 'renfe', 'metro', 'tmb', 'emt', 'uber', 'cabify', 'bolt', 'parking', 'peaje'] },
  { id: 'ocio', name: 'Ocio', emoji: '🍿', color: '#e0567a', type: 'gasto', weight: 0.08,
    keywords: ['glovo', 'just eat', 'uber eats', 'bar ', 'restaur', 'cine', 'burger', 'mcdonald', 'telepizza', 'starbucks'] },
  { id: 'salud', name: 'Salud', emoji: '💊', color: '#14a3a3', type: 'gasto', weight: 0.04,
    keywords: ['farmacia', 'clinica', 'dentist', 'optica', 'sanitas', 'adeslas'] },
  { id: 'compras', name: 'Compras', emoji: '🛍️', color: '#9b5bd6', type: 'gasto', weight: 0.06,
    keywords: ['amazon', 'zara', 'primark', 'shein', 'decathlon', 'el corte', 'mango', 'aliexpress'] },
  { id: 'suscr', name: 'Suscripciones', emoji: '📺', color: '#d9733b', type: 'gasto', weight: 0.03,
    keywords: ['netflix', 'spotify', 'hbo', 'max ', 'disney', 'prime', 'apple.com', 'google', 'youtube', 'dazn', 'gimnas', 'gym'] },
  { id: 'hijos', name: 'Hijos', emoji: '🧸', color: '#c2588f', type: 'gasto', weight: 0.12,
    keywords: ['colegio', 'escuela', 'guarderia', 'jugueter'] },
  { id: 'mascotas', name: 'Mascotas', emoji: '🐾', color: '#8a7a3b', type: 'gasto', weight: 0.03,
    keywords: ['kiwoko', 'tiendanimal', 'veterin'] },
  { id: 'otros', name: 'Otros', emoji: '📦', color: '#7d8a86', type: 'gasto', weight: 0.05 },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'nomina', name: 'Nómina', emoji: '💼', color: '#1a7a62', type: 'ingreso', keywords: ['nomina', 'nómina', 'salario'] },
  { id: 'freelance', name: 'Facturas cobradas', emoji: '🧾', color: '#1a7a62', type: 'ingreso', keywords: ['factura'] },
  { id: 'ayudas', name: 'Ayudas / beca', emoji: '🎓', color: '#1a7a62', type: 'ingreso', keywords: ['beca', 'sepe', 'ayuda', 'prestacion'] },
  { id: 'extra', name: 'Extra', emoji: '✨', color: '#1a7a62', type: 'ingreso', keywords: ['bizum', 'transferencia'] },
  { id: 'otros_in', name: 'Otros ingresos', emoji: '💶', color: '#1a7a62', type: 'ingreso' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const UNCLASSIFIED: Category = { id: '?', name: 'Sin clasificar', emoji: '❔', color: '#b4720f', type: 'gasto' };

export function getCategory(id: string | null | undefined): Category {
  return ALL_CATEGORIES.find((c) => c.id === id) ?? UNCLASSIFIED;
}

export type ProfileId = 'nomina' | 'autonomo' | 'estudiante' | 'familia';

export const PROFILES: Record<ProfileId, { emoji: string; title: string; description: string; categories: string[]; incomeCategories: string[] }> = {
  nomina: { emoji: '💼', title: 'Nómina fija', description: 'Cobro lo mismo cada mes',
    categories: ['super', 'casa', 'facturas', 'transporte', 'ocio', 'suscr', 'otros'], incomeCategories: ['nomina', 'extra', 'otros_in'] },
  autonomo: { emoji: '🧑‍💻', title: 'Autónomo/a', description: 'Mis ingresos varían',
    categories: ['super', 'casa', 'facturas', 'transporte', 'ocio', 'otros'], incomeCategories: ['freelance', 'extra', 'otros_in'] },
  estudiante: { emoji: '🎓', title: 'Estudiante', description: 'Beca, ayuda o trabajo parcial',
    categories: ['super', 'transporte', 'ocio', 'compras', 'suscr', 'otros'], incomeCategories: ['ayudas', 'extra', 'otros_in'] },
  familia: { emoji: '👨‍👩‍👧', title: 'Familia', description: 'Llevo la economía de casa',
    categories: ['super', 'casa', 'facturas', 'transporte', 'hijos', 'salud', 'ocio', 'otros'], incomeCategories: ['nomina', 'ayudas', 'otros_in'] },
};

/** Sugiere una categoría a partir del nombre del comercio o concepto. */
export function guessCategory(merchant: string, type: MovementType): string | null {
  const text = ` ${merchant.toLowerCase()} `;
  const pool = type === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return pool.find((c) => c.keywords?.some((k) => text.includes(k)))?.id ?? null;
}

/** Reparte lo que se puede gastar (lo cobrado menos el ahorro) entre las categorías elegidas. */
export function initialBudgets(income: number, savingsPct: number, categoryIds: string[]): Record<string, number> {
  const spendable = income * (1 - savingsPct / 100);
  const chosen = EXPENSE_CATEGORIES.filter((c) => categoryIds.includes(c.id));
  const total = chosen.reduce((sum, c) => sum + (c.weight ?? 0.05), 0);
  const budgets: Record<string, number> = {};
  for (const c of chosen) budgets[c.id] = Math.round((spendable * (c.weight ?? 0.05)) / total / 5) * 5;
  return budgets;
}

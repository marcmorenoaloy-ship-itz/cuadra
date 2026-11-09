import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { initialBudgets, PROFILES, type MovementType, type ProfileId } from './categories';
import { monthKey } from './format';

export type Movement = {
  id: string;
  type: MovementType;
  amount: number;
  merchant: string;
  /** null mientras esté pendiente de clasificar. */
  categoryId: string | null;
  /** Categoría que sugerimos al detectarlo. */
  suggestedCategoryId?: string | null;
  date: string; // ISO
  source: 'manual' | 'banco' | 'atajo';
};

export type Settings = {
  dailyReminder: boolean;
  reminderHour: number;
  paydayReminder: boolean;
  bankDetection: boolean;
  /** También detecta movimientos en apps que no están en la lista de bancos. */
  detectAnyApp: boolean;
};

type Plan = {
  profile: ProfileId;
  income: number;
  payday: number;
  savingsPct: number;
  categories: string[];
  budgets: Record<string, number>;
};

type State = {
  onboarded: boolean;
  plan: Plan;
  movements: Movement[];
  settings: Settings;
  /** Activo en modo desarrollo para probar Premium sin tienda. */
  devPremium: boolean;

  completeOnboarding: (input: Omit<Plan, 'budgets'>) => void;
  addMovement: (m: Omit<Movement, 'id'> & { id?: string }) => string;
  classify: (id: string, categoryId: string, type?: MovementType) => void;
  updateMovement: (id: string, patch: Partial<Movement>) => void;
  deleteMovement: (id: string) => void;
  setBudget: (categoryId: string, amount: number) => void;
  toggleCategory: (categoryId: string) => void;
  updatePlan: (patch: Partial<Plan>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setDevPremium: (v: boolean) => void;
  reset: () => void;
};

const DEFAULT_PLAN: Plan = {
  profile: 'nomina',
  income: 0,
  payday: 1,
  savingsPct: 10,
  categories: [],
  budgets: {},
};

const DEFAULT_SETTINGS: Settings = {
  dailyReminder: true,
  reminderHour: 21,
  paydayReminder: true,
  bankDetection: false,
  detectAnyApp: false,
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      onboarded: false,
      plan: DEFAULT_PLAN,
      movements: [],
      settings: DEFAULT_SETTINGS,
      devPremium: false,

      completeOnboarding: (input) =>
        set({
          onboarded: true,
          plan: { ...input, budgets: initialBudgets(input.income, input.savingsPct, input.categories) },
          movements: [],
        }),

      addMovement: (m) => {
        const id = m.id ?? newId();
        if (get().movements.some((x) => x.id === id)) return id;
        set((s) => ({ movements: [{ ...m, id }, ...s.movements] }));
        return id;
      },

      classify: (id, categoryId, type) =>
        set((s) => ({
          movements: s.movements.map((m) =>
            m.id === id ? { ...m, categoryId, type: type ?? m.type, suggestedCategoryId: undefined } : m,
          ),
        })),

      updateMovement: (id, patch) =>
        set((s) => ({ movements: s.movements.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      deleteMovement: (id) => set((s) => ({ movements: s.movements.filter((m) => m.id !== id) })),

      setBudget: (categoryId, amount) =>
        set((s) => ({ plan: { ...s.plan, budgets: { ...s.plan.budgets, [categoryId]: amount } } })),

      toggleCategory: (categoryId) =>
        set((s) => {
          const has = s.plan.categories.includes(categoryId);
          const categories = has ? s.plan.categories.filter((c) => c !== categoryId) : [...s.plan.categories, categoryId];
          const budgets = { ...s.plan.budgets };
          if (!has && budgets[categoryId] == null) budgets[categoryId] = 50;
          return { plan: { ...s.plan, categories, budgets } };
        }),

      updatePlan: (patch) => set((s) => ({ plan: { ...s.plan, ...patch } })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setDevPremium: (v) => set({ devPremium: v }),
      reset: () => set({ onboarded: false, plan: DEFAULT_PLAN, movements: [], settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'cuadra-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function incomeCategoriesFor(profile: ProfileId): string[] {
  return PROFILES[profile].incomeCategories;
}

export type MonthSummary = {
  income: number;
  spent: number;
  byCategory: Record<string, number>;
  saved: number;
  savingsGoal: number;
  pending: Movement[];
  movements: Movement[];
};

export function summarize(movements: Movement[], plan: Plan, month = monthKey()): MonthSummary {
  const inMonth = movements.filter((m) => monthKey(m.date) === month);
  let income = 0;
  let spent = 0;
  const byCategory: Record<string, number> = {};
  for (const m of inMonth) {
    if (!m.categoryId) continue;
    if (m.type === 'ingreso') income += m.amount;
    else {
      spent += m.amount;
      byCategory[m.categoryId] = (byCategory[m.categoryId] ?? 0) + m.amount;
    }
  }
  return {
    income,
    spent,
    byCategory,
    saved: Math.max(0, income - spent),
    savingsGoal: Math.round((plan.income * plan.savingsPct) / 100),
    pending: movements.filter((m) => !m.categoryId),
    movements: inMonth.filter((m) => m.categoryId),
  };
}

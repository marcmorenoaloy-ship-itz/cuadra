import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import type { ResumenProps } from '@/widgets/resumen';
import { eur } from './format';
import { summarize, useStore } from './store';

// El widget solo existe en iPhone con una build propia (no en Expo Go).
const available = Platform.OS === 'ios' && requireOptionalNativeModule('ExpoWidgets') != null;

/** Envía al widget de la pantalla de inicio el resumen actual del mes. */
export function syncWidget(premium: boolean) {
  if (!available) return;
  const { plan, movements } = useStore.getState();
  const sum = summarize(movements, plan);
  const left = sum.income - sum.spent;
  const props: ResumenProps = {
    locked: !premium,
    left: eur(left),
    leftShort: eur(left, 0),
    savedPct: sum.savingsGoal ? sum.saved / sum.savingsGoal : 0,
    goal: eur(sum.savingsGoal, 0),
    payday: plan.payday,
    pending: sum.pending.length,
  };
  // Una entrada por día durante un mes para que "Cobras en X días" se actualice sola.
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const entries = Array.from({ length: 31 }, (_, i) => ({
    date: i === 0 ? new Date() : new Date(start.getTime() + i * 86_400_000),
    props,
  }));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ResumenWidget } = require('@/widgets/resumen') as typeof import('@/widgets/resumen');
  ResumenWidget.updateTimeline(entries);
}

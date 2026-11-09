import { BankListener, type CapturedNotification } from '../../modules/bank-listener';
import { parseBankNotification } from './bank-parser';
import { useStore } from './store';

/**
 * Pasa las notificaciones de banco capturadas por Android a movimientos pendientes de clasificar.
 * Devuelve los ids de movimiento creados, en el mismo orden que las capturas.
 */
export function importCaptured(items: CapturedNotification[] = BankListener.getPending()): Record<string, string> {
  const created: Record<string, string> = {};
  if (!items.length) return created;
  const { addMovement } = useStore.getState();
  for (const n of items) {
    const parsed = parseBankNotification(n.title, n.text, n.package);
    if (!parsed) continue;
    created[n.id] = addMovement({
      id: `banco-${n.id}`,
      type: parsed.type,
      amount: parsed.amount,
      merchant: parsed.merchant,
      categoryId: null,
      suggestedCategoryId: parsed.categoryId,
      date: new Date(n.time).toISOString(),
      source: 'banco',
    });
  }
  BankListener.removePending(items.map((n) => n.id));
  return created;
}

export function applyDetectionSettings() {
  const { settings } = useStore.getState();
  BankListener.configure(settings.bankDetection, null, settings.detectAnyApp);
}

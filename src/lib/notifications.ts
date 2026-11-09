import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { getCategory } from './categories';
import { eur } from './format';
import type { Movement } from './store';

export const REMINDER_CHANNEL = 'recordatorios';
export const MOVEMENT_CHANNEL = 'movimientos';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Recordatorios',
      importance: AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync(MOVEMENT_CHANNEL, {
      name: 'Movimientos por clasificar',
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Acciones de la notificación: aceptar la categoría sugerida u abrir la app para elegir otra. */
async function ensureClassifyCategory(categoryId: string) {
  const c = getCategory(categoryId);
  await Notifications.setNotificationCategoryAsync(`clasificar-${categoryId}`, [
    { identifier: 'aceptar', buttonTitle: `${c.emoji} ${c.name}`, options: { opensAppToForeground: true } },
    { identifier: 'elegir', buttonTitle: 'Otra categoría', options: { opensAppToForeground: true } },
  ]);
}

/** Avisa de un movimiento pendiente de clasificar (iOS y recordatorios de Android). */
export async function notifyPending(m: Movement) {
  if (Platform.OS === 'web') return;
  const suggestion = m.suggestedCategoryId ?? null;
  if (suggestion) await ensureClassifyCategory(suggestion);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: m.type === 'gasto' ? `Has pagado ${eur(m.amount)}` : `Te han ingresado ${eur(m.amount)}`,
      body: suggestion
        ? `${m.merchant} · ¿Es ${getCategory(suggestion).name}?`
        : `${m.merchant} · Toca para clasificarlo`,
      data: { url: `/clasificar?id=${m.id}`, movementId: m.id, suggestion },
      categoryIdentifier: suggestion ? `clasificar-${suggestion}` : undefined,
    },
    trigger: Platform.OS === 'android' ? { channelId: MOVEMENT_CHANNEL } : null,
  });
}

export async function scheduleReminders(opts: {
  daily: boolean;
  hour: number;
  payday: boolean;
  paydayDay: number;
  savingsAmount: number;
}) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === 'reminder')
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  if (opts.daily) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¿Has gastado algo hoy?',
        body: 'Apúntalo en 5 segundos y sabrás cuánto te queda.',
        data: { kind: 'reminder', url: '/clasificar?nuevo=1' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: opts.hour,
        minute: 0,
        channelId: REMINDER_CHANNEL,
      },
    });
  }

  if (opts.payday && opts.savingsAmount > 0) {
    // Los meses cortos no tienen día 29-31: lo adelantamos al 28 para que llegue todos los meses.
    const day = Math.min(opts.paydayDay, 28);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hoy es día de cobro 💶',
        body: `Aparta ya ${eur(opts.savingsAmount, 0)} para tu ahorro antes de empezar a gastar.`,
        data: { kind: 'reminder', url: '/' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day,
        hour: 10,
        minute: 0,
        channelId: REMINDER_CHANNEL,
      },
    });
  }
}

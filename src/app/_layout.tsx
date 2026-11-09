import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';

import { BankListener } from '../../modules/bank-listener';
import { applyDetectionSettings, importCaptured } from '@/lib/detection';
import { scheduleReminders } from '@/lib/notifications';
import { initPurchases, usePremium } from '@/lib/purchases';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import { syncWidget } from '@/lib/widget-sync';

SplashScreen.preventAutoHideAsync();
initPurchases();

function handleResponse(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const data = response.notification.request.content.data as { url?: string; movementId?: string; suggestion?: string };
  if (response.actionIdentifier === 'aceptar' && data.movementId && data.suggestion) {
    useStore.getState().classify(data.movementId, data.suggestion);
    router.navigate('/');
    return;
  }
  if (typeof data.url === 'string') router.push(data.url as never);
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const hydrated = useHydrated();
  const settings = useStore((s) => s.settings);
  const plan = useStore((s) => s.plan);
  const onboarded = useStore((s) => s.onboarded);
  const movements = useStore((s) => s.movements);
  const premium = usePremium();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  // Toques en notificaciones (también si la app estaba cerrada).
  useEffect(() => {
    if (!hydrated || Platform.OS === 'web') return;
    handleResponse(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [hydrated]);

  // Android: recoger lo que el lector de avisos del banco haya capturado.
  useEffect(() => {
    if (!hydrated || !BankListener.isAvailable) return;
    applyDetectionSettings();
    importCaptured();
    const live = BankListener.addListener((n) => importCaptured([n]));
    const app = AppState.addEventListener('change', (s) => s === 'active' && importCaptured());
    return () => {
      live?.remove();
      app.remove();
    };
  }, [hydrated, settings.bankDetection, settings.detectAnyApp]);

  // Recordatorios diarios y de día de cobro.
  useEffect(() => {
    if (!hydrated || !onboarded) return;
    scheduleReminders({
      daily: settings.dailyReminder,
      hour: settings.reminderHour,
      payday: settings.paydayReminder,
      paydayDay: plan.payday,
      savingsAmount: (plan.income * plan.savingsPct) / 100,
    }).catch(() => {});
  }, [hydrated, onboarded, settings.dailyReminder, settings.reminderHour, settings.paydayReminder, plan.payday, plan.income, plan.savingsPct]);

  // Widget de iPhone: se actualiza cada vez que cambian los movimientos, el plan o Premium.
  useEffect(() => {
    if (hydrated && onboarded) syncWidget(premium);
  }, [hydrated, onboarded, premium, movements, plan]);

  if (!hydrated) return null;

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="clasificar"
          options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85, 1], sheetGrabberVisible: true, sheetCornerRadius: 26 }}
        />
        <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

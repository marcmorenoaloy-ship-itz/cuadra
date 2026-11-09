import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';

import { useStore } from '@/lib/store';
import { useTheme } from '@/ui/theme';

export default function TabsLayout() {
  const t = useTheme();
  const onboarded = useStore((s) => s.onboarded);
  const pending = useStore((s) => s.movements.filter((m) => !m.categoryId).length);
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs backgroundColor={t.surface} indicatorColor={t.accentSoft} labelStyle={{ selected: { color: t.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="movimientos">
        <NativeTabs.Trigger.Label>Movimientos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="receipt_long" />
        {pending > 0 && <NativeTabs.Trigger.Badge>{String(pending)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ajustes">
        <NativeTabs.Trigger.Label>Mi plan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'slider.horizontal.3', selected: 'slider.horizontal.3' }} md="tune" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

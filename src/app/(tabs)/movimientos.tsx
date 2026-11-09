import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { eur, monthKey } from '@/lib/format';
import { usePremium } from '@/lib/purchases';
import { summarize, useStore } from '@/lib/store';
import { Button, Card, MovementRow, T, tap } from '@/ui/components';
import { useTheme } from '@/ui/theme';

function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

function label(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Movimientos() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const premium = usePremium();
  const plan = useStore((s) => s.plan);
  const movements = useStore((s) => s.movements);
  const [month, setMonth] = useState(monthKey());
  const current = monthKey();
  const isPast = month < current;
  const locked = isPast && !premium;
  const sum = summarize(movements, plan, month);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 60, gap: 16 }}>
      <T variant="title">Movimientos</T>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityLabel="Mes anterior" onPress={() => { tap(); setMonth(addMonths(month, -1)); }} style={{ padding: 10 }}>
          <Text style={{ fontSize: 22, color: t.accent, fontWeight: '700' }}>‹</Text>
        </Pressable>
        <T variant="h2">{label(month)}</T>
        <Pressable
          accessibilityLabel="Mes siguiente"
          disabled={month >= current}
          onPress={() => { tap(); setMonth(addMonths(month, 1)); }}
          style={{ padding: 10, opacity: month >= current ? 0.3 : 1 }}>
          <Text style={{ fontSize: 22, color: t.accent, fontWeight: '700' }}>›</Text>
        </Pressable>
      </View>

      {locked ? (
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 34 }}>🔒</Text>
          <T variant="h2" style={{ textAlign: 'center' }}>Tu historial está en Premium</T>
          <T variant="small" style={{ textAlign: 'center' }}>
            Mira cómo te fue cada mes y compara tus gastos para ahorrar más.
          </T>
          <Button title="Ver Premium" onPress={() => router.push('/premium')} style={{ alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card style={{ flex: 1, gap: 4 }}>
              <T variant="label">Entró</T>
              <T style={{ fontWeight: '800', fontSize: 20, color: t.accent }}>{eur(sum.income, 0)}</T>
            </Card>
            <Card style={{ flex: 1, gap: 4 }}>
              <T variant="label">Salió</T>
              <T style={{ fontWeight: '800', fontSize: 20 }}>{eur(sum.spent, 0)}</T>
            </Card>
          </View>

          {month === current && sum.pending.length > 0 && (
            <Card>
              <T variant="h2">Por clasificar</T>
              <View>
                {sum.pending.map((m, i) => (
                  <MovementRow key={m.id} m={m} first={i === 0} onPress={() => router.push(`/clasificar?id=${m.id}`)} />
                ))}
              </View>
            </Card>
          )}

          <Card>
            {sum.movements.length ? (
              <View>
                {sum.movements.map((m, i) => (
                  <MovementRow key={m.id} m={m} first={i === 0} onPress={() => router.push(`/clasificar?id=${m.id}`)} />
                ))}
              </View>
            ) : (
              <T variant="small">No hay movimientos este mes.</T>
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

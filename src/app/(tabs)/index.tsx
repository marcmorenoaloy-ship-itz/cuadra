import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategory, PROFILES } from '@/lib/categories';
import { daysUntil, eur, monthName } from '@/lib/format';
import { summarize, useStore } from '@/lib/store';
import { Donut, Ring } from '@/ui/charts';
import { Card, CategoryIcon, MovementRow, ProgressBar, T, tap } from '@/ui/components';
import { radius, useTheme } from '@/ui/theme';

export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const plan = useStore((s) => s.plan);
  const movements = useStore((s) => s.movements);
  const sum = summarize(movements, plan);
  const left = sum.income - sum.spent;
  const savedPct = sum.savingsGoal ? Math.min(1, sum.saved / sum.savingsGoal) : 0;
  const legend = Object.entries(sum.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tip = makeTip(sum.byCategory, plan.budgets, plan.categories, plan.payday);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 120, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <T variant="small">Hola 👋</T>
            <T variant="title">Tu {monthName()}</T>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>{PROFILES[plan.profile].emoji}</Text>
          </View>
        </View>

        <LinearGradient
          colors={[t.heroA, t.heroB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: radius.xl, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -80, bottom: -110, backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T variant="label" style={{ color: t.onHero, opacity: 0.75 }}>
              Te queda para gastar
            </T>
            <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: t.onHero, fontSize: 36, fontWeight: '800', letterSpacing: -0.8, marginTop: 4 }}>
              {eur(left)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 12 }}>
              <Text style={{ color: t.onHero, fontSize: 13.5 }}>● +{eur(sum.income, 0)}</Text>
              <Text style={{ color: t.onHero, fontSize: 13.5, opacity: 0.85 }}>● −{eur(sum.spent, 0)}</Text>
            </View>
          </View>
          <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute' }}>
              <Ring value={savedPct} size={100} color={t.mint} track="rgba(255,255,255,0.18)" />
            </View>
            <Text style={{ color: t.onHero, fontSize: 21, fontWeight: '800' }}>{Math.round(savedPct * 100)}%</Text>
            <Text style={{ color: t.onHero, fontSize: 11, opacity: 0.8, textAlign: 'center' }}>ahorro{'\n'}{eur(sum.savingsGoal, 0)}</Text>
          </View>
        </LinearGradient>

        <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: tip.bad ? t.spendSoft : t.accentSoft }}>
          <Text style={{ fontSize: 22 }}>{tip.emoji}</Text>
          <T style={{ flex: 1 }}>{tip.text}</T>
        </View>

        {sum.pending.length > 0 && (
          <Card style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: t.warn }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T variant="h2">Por clasificar</T>
              <View style={{ backgroundColor: t.warn, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 2 }}>
                <Text style={{ color: t.surface, fontWeight: '700' }}>{sum.pending.length}</Text>
              </View>
            </View>
            <View>
              {sum.pending.slice(0, 4).map((m, i) => (
                <MovementRow key={m.id} m={m} first={i === 0} onPress={() => router.push(`/clasificar?id=${m.id}`)} />
              ))}
            </View>
          </Card>
        )}

        <Card>
          <T variant="h2">¿En qué se va tu dinero?</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute' }}>
                <Donut data={sum.byCategory} />
              </View>
              <T style={{ fontWeight: '800', fontSize: 18 }}>{eur(sum.spent, 0)}</T>
              <T variant="small">gastado</T>
            </View>
            <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
              {legend.length ? (
                legend.map(([id, v]) => (
                  <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: getCategory(id).color }} />
                    <T style={{ flex: 1, fontSize: 13.5 }} numberOfLines={1}>
                      {getCategory(id).name}
                    </T>
                    <T variant="small">{Math.round((v / sum.spent) * 100)}%</T>
                  </View>
                ))
              ) : (
                <T variant="small">Aún no hay gastos este mes. Añade el primero con el botón +.</T>
              )}
            </View>
          </View>
        </Card>

        <Card>
          <T variant="h2">Tus límites</T>
          {plan.categories.map((id) => {
            const budget = plan.budgets[id] ?? 0;
            const spent = sum.byCategory[id] ?? 0;
            const p = budget ? spent / budget : spent > 0 ? 2 : 0;
            const color = p > 1 ? t.spend : p > 0.8 ? t.warn : getCategory(id).color;
            return (
              <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CategoryIcon id={id} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T style={{ fontWeight: '600' }}>{getCategory(id).name}</T>
                    <T variant="small" style={p > 1 ? { color: t.spend, fontWeight: '700' } : undefined}>
                      {p > 1 ? `+${eur(spent - budget, 0)} de más` : `quedan ${eur(budget - spent, 0)}`}
                    </T>
                  </View>
                  <ProgressBar value={p} color={color} />
                </View>
              </View>
            );
          })}
        </Card>

        {sum.movements.length > 0 && (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T variant="h2">Últimos movimientos</T>
              <Pressable onPress={() => router.navigate('/movimientos')}>
                <Text style={{ color: t.accent, fontWeight: '700' }}>Ver todos</Text>
              </Pressable>
            </View>
            <View>
              {sum.movements.slice(0, 5).map((m, i) => (
                <MovementRow key={m.id} m={m} first={i === 0} onPress={() => router.push(`/clasificar?id=${m.id}`)} />
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir movimiento"
        onPress={() => {
          tap();
          router.push('/clasificar?nuevo=1');
        }}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 24,
          width: 62,
          height: 62,
          borderRadius: 31,
          backgroundColor: t.accent,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.93 : 1 }],
          boxShadow: '0 10px 24px rgba(26, 122, 98, 0.4)',
        })}>
        <Text style={{ color: t.surface, fontSize: 32, fontWeight: '500', marginTop: -2 }}>+</Text>
      </Pressable>
    </View>
  );
}

function makeTip(byCategory: Record<string, number>, budgets: Record<string, number>, categories: string[], payday: number) {
  const over = categories.find((c) => (byCategory[c] ?? 0) > (budgets[c] ?? Infinity));
  if (over)
    return { bad: true, emoji: '⚠️', text: `Te has pasado en ${getCategory(over).name}. Si frenas ahí lo que queda de mes, aún llegas a tu ahorro.` };
  const near = categories.find((c) => budgets[c] && (byCategory[c] ?? 0) / budgets[c] > 0.8);
  if (near) return { bad: false, emoji: '👀', text: `Ojo con ${getCategory(near).name}: llevas más del 80% de tu límite.` };
  return { bad: false, emoji: '🌱', text: `Vas bien. Quedan ${daysUntil(payday)} días hasta tu próximo cobro.` };
}

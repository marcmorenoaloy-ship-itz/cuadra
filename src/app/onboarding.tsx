import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BankListener } from '../../modules/bank-listener';
import { EXPENSE_CATEGORIES, PROFILES, type ProfileId } from '@/lib/categories';
import { eur, parseAmount } from '@/lib/format';
import { setupNotifications } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import { Button, Card, CategoryTile, T, tap } from '@/ui/components';
import { radius, useTheme } from '@/ui/theme';

const STEPS = 4;
const SAVINGS = [0, 5, 10, 15, 20, 25, 30];

export default function Onboarding() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const updateSettings = useStore((s) => s.updateSettings);
  const reminderHour = useStore((s) => s.settings.reminderHour);

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [incomeText, setIncomeText] = useState('');
  const [payday, setPayday] = useState(1);
  const [savingsPct, setSavingsPct] = useState(10);
  const [categories, setCategories] = useState<string[]>([]);

  const income = parseAmount(incomeText);
  const canNext = step === 0 ? !!profile : step === 1 ? income > 0 : step === 2 ? categories.length > 0 : true;

  const finish = async () => {
    if (!profile) return;
    completeOnboarding({ profile, income, payday, savingsPct, categories });
    await setupNotifications().catch(() => false);
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, gap: 18, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i <= step ? t.accent : t.line }} />
          ))}
        </View>

        {step === 0 && (
          <>
            <T variant="title">¿Cómo es tu situación?</T>
            <T variant="small" style={{ fontSize: 15 }}>
              Así preparamos solo las categorías que vas a usar.
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {(Object.keys(PROFILES) as ProfileId[]).map((k) => {
                const p = PROFILES[k];
                const on = profile === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      tap();
                      setProfile(k);
                      setCategories(p.categories);
                    }}
                    style={{
                      width: '48%',
                      flexGrow: 1,
                      padding: 16,
                      gap: 6,
                      borderRadius: radius.lg,
                      borderWidth: 2,
                      borderColor: on ? t.accent : 'transparent',
                      backgroundColor: on ? t.accentSoft : t.surface,
                    }}>
                    <Text style={{ fontSize: 30 }}>{p.emoji}</Text>
                    <T style={{ fontWeight: '700' }}>{p.title}</T>
                    <T variant="small">{p.description}</T>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <T variant="title">Tu dinero al mes</T>
            <View style={{ gap: 6 }}>
              <T variant="label">{profile === 'autonomo' ? 'Lo que ganas en un mes normal (€)' : 'Lo que cobras al mes (€)'}</T>
              <TextInput
                value={incomeText}
                onChangeText={setIncomeText}
                placeholder="1.400"
                placeholderTextColor={t.muted}
                keyboardType="decimal-pad"
                style={{ fontSize: 22, fontWeight: '700', color: t.ink, backgroundColor: t.surface, borderRadius: radius.md, padding: 14 }}
              />
            </View>
            <View style={{ gap: 6 }}>
              <T variant="label">Día en que cobras</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setPayday(d)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: payday === d ? t.accent : t.surface,
                    }}>
                    <Text style={{ fontWeight: '700', color: payday === d ? t.surface : t.ink }}>{d}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Card style={{ alignItems: 'center' }}>
              <T variant="label">Quiero ahorrar</T>
              <Text style={{ fontSize: 46, fontWeight: '800', color: t.accent }}>{savingsPct}%</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {SAVINGS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => {
                      tap();
                      setSavingsPct(p);
                    }}
                    style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, backgroundColor: savingsPct === p ? t.accentSoft : t.surfaceAlt }}>
                    <Text style={{ fontWeight: '700', color: savingsPct === p ? t.accent : t.muted }}>{p}%</Text>
                  </Pressable>
                ))}
              </View>
              <T variant="small" style={{ textAlign: 'center' }}>
                {income > 0
                  ? `${eur((income * savingsPct) / 100, 0)} al mes · ${eur((income * savingsPct * 12) / 100, 0)} en un año`
                  : 'Escribe lo que cobras para ver cuánto supone.'}
              </T>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <T variant="title">¿En qué gastas?</T>
            <T variant="small" style={{ fontSize: 15 }}>
              Marca solo lo que uses. Repartimos tus límites según lo que cobras y los puedes cambiar cuando quieras.
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {EXPENSE_CATEGORIES.map((c) => (
                <CategoryTile
                  key={c.id}
                  id={c.id}
                  selected={categories.includes(c.id)}
                  onPress={() =>
                    setCategories((prev) => (prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
                  }
                />
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <T variant="title">Te avisamos de cada movimiento</T>
            <Card>
              <T style={{ fontSize: 34 }}>🔔</T>
              <T>
                Cuando pagues o te ingresen dinero, Cuadra te mandará un aviso para clasificarlo en un toque. Así sabes siempre
                cuánto te queda.
              </T>
              {BankListener.isAvailable ? (
                <T variant="small">
                  En Android podemos leer los avisos de la app de tu banco para detectar los pagos solos. Tus datos no salen del
                  móvil y no te pedimos las claves del banco. Lo puedes activar en «Mi plan».
                </T>
              ) : Platform.OS === 'ios' ? (
                <T variant="small">
                  En iPhone puedes crear una automatización en la app Atajos para que se abra Cuadra con cada pago de Apple Pay.
                  Te explicamos cómo en «Mi plan».
                </T>
              ) : null}
            </Card>
            <View style={{ gap: 10 }}>
              <T variant="label">Recordatorio diario</T>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[20, 21, 22].map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => updateSettings({ reminderHour: h, dailyReminder: true })}
                    style={{ flex: 1, padding: 12, borderRadius: radius.md, alignItems: 'center', backgroundColor: reminderHour === h ? t.accentSoft : t.surface }}>
                    <Text style={{ fontWeight: '700', color: t.ink }}>{h}:00</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ flex: 1 }} />
        <View style={{ gap: 8 }}>
          <Button
            title={step === STEPS - 1 ? 'Activar avisos y empezar ✨' : 'Seguir'}
            disabled={!canNext}
            onPress={() => (step === STEPS - 1 ? finish() : setStep(step + 1))}
          />
          {step > 0 && <Button title="Atrás" variant="link" onPress={() => setStep(step - 1)} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

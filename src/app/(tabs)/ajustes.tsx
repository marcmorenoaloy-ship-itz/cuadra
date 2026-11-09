import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BankListener } from '../../../modules/bank-listener';
import { EXPENSE_CATEGORIES, getCategory } from '@/lib/categories';
import { eur, parseAmount } from '@/lib/format';
import { usePremium } from '@/lib/purchases';
import { useStore } from '@/lib/store';
import { Button, Card, CategoryIcon, Chip, T } from '@/ui/components';
import { radius, useTheme } from '@/ui/theme';

function MoneyInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const t = useTheme();
  const [text, setText] = useState(String(value));
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onEndEditing={() => {
        const n = parseAmount(text);
        if (n >= 0) onChange(Math.round(n));
        else setText(String(value));
      }}
      keyboardType="decimal-pad"
      style={{ minWidth: 84, textAlign: 'right', fontWeight: '700', fontSize: 16, color: t.ink, backgroundColor: t.surfaceAlt, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
    />
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{children}</View>;
}

export default function Ajustes() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const premium = usePremium();
  const plan = useStore((s) => s.plan);
  const settings = useStore((s) => s.settings);
  const devPremium = useStore((s) => s.devPremium);
  const { updatePlan, setBudget, toggleCategory, updateSettings, setDevPremium, reset } = useStore.getState();
  const [hasListenerPermission, setHasListenerPermission] = useState(BankListener.hasPermission());
  const [confirmReset, setConfirmReset] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Al volver de Ajustes de Android, comprobamos si ha dado el permiso.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setHasListenerPermission(BankListener.hasPermission()));
    return () => sub.remove();
  }, []);

  const totalBudget = plan.categories.reduce((s, c) => s + (plan.budgets[c] ?? 0), 0);
  const savings = (plan.income * plan.savingsPct) / 100;
  const free = plan.income - savings - totalBudget;

  const toggleDetection = (on: boolean) => {
    if (on && !premium) return router.push('/premium');
    if (on && !hasListenerPermission) BankListener.openPermissionSettings();
    updateSettings({ bankDetection: on });
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 60, gap: 16 }} keyboardShouldPersistTaps="handled">
      <T variant="title">Mi plan</T>

      {!premium && (
        <Pressable onPress={() => router.push('/premium')}>
          <Card style={{ backgroundColor: t.heroA, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 30 }}>⭐</Text>
            <View style={{ flex: 1 }}>
              <T style={{ color: t.onHero, fontWeight: '800' }}>Prueba Premium 7 días gratis</T>
              <T variant="small" style={{ color: t.onHero, opacity: 0.85 }}>
                Widget, detección de pagos e historial completo.
              </T>
            </View>
          </Card>
        </Pressable>
      )}

      <Card>
        <T variant="h2">Tu dinero</T>
        <Row>
          <T style={{ flex: 1 }}>Cobro al mes</T>
          <MoneyInput key={`i${plan.income}`} value={plan.income} onChange={(income) => updatePlan({ income })} />
        </Row>
        <Row>
          <T style={{ flex: 1 }}>Día de cobro</T>
          <MoneyInput key={`d${plan.payday}`} value={plan.payday} onChange={(d) => updatePlan({ payday: Math.min(31, Math.max(1, d)) })} />
        </Row>
        <View style={{ gap: 8 }}>
          <T>Ahorro: {plan.savingsPct}% · {eur(savings, 0)} al mes</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[0, 5, 10, 15, 20, 25, 30].map((p) => (
              <Chip key={p} label={`${p}%`} selected={plan.savingsPct === p} onPress={() => updatePlan({ savingsPct: p })} />
            ))}
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T variant="h2">Límites por categoría</T>
        </View>
        <T variant="small" style={free < 0 ? { color: t.spend, fontWeight: '700' } : undefined}>
          {free >= 0
            ? `Sin asignar: ${eur(free, 0)}. Puedes dejarlo como colchón.`
            : `Tus límites superan lo que te queda tras ahorrar en ${eur(-free, 0)}. Baja alguno.`}
        </T>
        {plan.categories.map((id) => (
          <Row key={id}>
            <CategoryIcon id={id} size={38} />
            <T style={{ flex: 1, fontWeight: '600' }}>{getCategory(id).name}</T>
            <MoneyInput key={`${id}${plan.budgets[id] ?? 0}`} value={plan.budgets[id] ?? 0} onChange={(n) => setBudget(id, n)} />
          </Row>
        ))}
        <T variant="label">Mostrar categorías</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {EXPENSE_CATEGORIES.map((c) => (
            <Chip key={c.id} label={`${c.emoji} ${c.name}`} selected={plan.categories.includes(c.id)} onPress={() => toggleCategory(c.id)} />
          ))}
        </View>
      </Card>

      <Card>
        <T variant="h2">Avisos</T>
        <Row>
          <T style={{ flex: 1 }}>Recordatorio diario</T>
          <Switch value={settings.dailyReminder} onValueChange={(v) => updateSettings({ dailyReminder: v })} trackColor={{ true: t.accent }} />
        </Row>
        {settings.dailyReminder && (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {[13, 19, 20, 21, 22].map((h) => (
              <Chip key={h} label={`${h}:00`} selected={settings.reminderHour === h} onPress={() => updateSettings({ reminderHour: h })} />
            ))}
          </View>
        )}
        <Row>
          <T style={{ flex: 1 }}>Aviso el día de cobro para apartar el ahorro</T>
          <Switch value={settings.paydayReminder} onValueChange={(v) => updateSettings({ paydayReminder: v })} trackColor={{ true: t.accent }} />
        </Row>
      </Card>

      <Card>
        <T variant="h2">Detectar pagos automáticamente {premium ? '' : '⭐'}</T>
        {BankListener.isAvailable ? (
          <>
            <T variant="small">
              Cuadra lee los avisos de la app de tu banco (BBVA, CaixaBank, Santander, ING, Revolut…) y te pregunta en qué
              categoría va cada pago. No necesita tus claves y nada sale del móvil.
            </T>
            <Row>
              <T style={{ flex: 1 }}>Activar detección</T>
              <Switch value={settings.bankDetection && premium} onValueChange={toggleDetection} trackColor={{ true: t.accent }} />
            </Row>
            {settings.bankDetection && !hasListenerPermission && (
              <View style={{ backgroundColor: t.warnSoft, padding: 12, borderRadius: radius.md, gap: 8 }}>
                <T>Falta un paso: permite a Cuadra acceder a las notificaciones.</T>
                <Button title="Abrir ajustes de Android" variant="ghost" onPress={() => BankListener.openPermissionSettings()} />
              </View>
            )}
            {settings.bankDetection && (
              <Row>
                <T style={{ flex: 1 }} variant="small">
                  Detectar también en otras apps (si tu banco no está en la lista)
                </T>
                <Switch value={settings.detectAnyApp} onValueChange={(v) => updateSettings({ detectAnyApp: v })} trackColor={{ true: t.accent }} />
              </Row>
            )}
          </>
        ) : Platform.OS === 'ios' ? (
          <>
            <T variant="small">
              En iPhone, la app Atajos puede abrir Cuadra cada vez que pagas con Apple Pay, con el importe y el comercio ya
              rellenados.
            </T>
            <Button title={showShortcutHelp ? 'Ocultar pasos' : 'Ver cómo configurarlo'} variant="ghost" onPress={() => setShowShortcutHelp(!showShortcutHelp)} />
            {showShortcutHelp && (
              <View style={{ gap: 6 }}>
                <T>1. Abre la app Atajos → Automatización → Nueva automatización.</T>
                <T>2. Elige «Transacción» y marca tus tarjetas de Apple Pay. Selecciona «Ejecutar inmediatamente».</T>
                <T>3. Añade la acción «Abrir URL» con esta dirección:</T>
                <Text selectable style={{ fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 12.5, color: t.ink, backgroundColor: t.surfaceAlt, padding: 10, borderRadius: 10 }}>
                  cuadra://clasificar?importe=[Importe]&comercio=[Comercio]
                </Text>
                <T variant="small">Sustituye [Importe] y [Comercio] por las variables de la transacción que te ofrece Atajos.</T>
              </View>
            )}
          </>
        ) : (
          <T variant="small">Disponible en la app para Android e iPhone.</T>
        )}
      </Card>

      {__DEV__ && (
        <Card>
          <T variant="h2">Desarrollo</T>
          <Row>
            <T style={{ flex: 1 }}>Simular Premium</T>
            <Switch value={devPremium} onValueChange={setDevPremium} />
          </Row>
          <Button
            title="Simular aviso del banco"
            variant="ghost"
            onPress={() => {
              const id = useStore.getState().addMovement({
                type: 'gasto',
                amount: 23.4,
                merchant: 'Lidl',
                categoryId: null,
                suggestedCategoryId: 'super',
                date: new Date().toISOString(),
                source: 'banco',
              });
              import('@/lib/notifications').then((n) => {
                const m = useStore.getState().movements.find((x) => x.id === id);
                if (m) n.notifyPending(m);
              });
            }}
          />
        </Card>
      )}

      {confirmReset ? (
        <Card>
          <T>Se borrarán tu plan y todos tus movimientos de este móvil. No se puede deshacer.</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Cancelar" variant="ghost" style={{ flex: 1 }} onPress={() => setConfirmReset(false)} />
            <Button
              title="Borrar todo"
              style={{ flex: 1, backgroundColor: t.spend }}
              onPress={() => {
                reset();
                router.replace('/onboarding');
              }}
            />
          </View>
        </Card>
      ) : (
        <Button title="Empezar de cero" variant="link" onPress={() => setConfirmReset(true)} />
      )}
    </ScrollView>
  );
}

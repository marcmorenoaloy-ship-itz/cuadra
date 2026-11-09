import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { buy, getPackages, purchasesConfigured, restore, usePremium } from '@/lib/purchases';
import { Button, T, tap } from '@/ui/components';
import { radius, useTheme } from '@/ui/theme';

const FEATURES = [
  ['🔔', 'Detección automática', 'Cada pago de tu banco te llega listo para clasificar'],
  ['📊', 'Historial completo', 'Compara meses y descubre en qué se te escapa el dinero'],
  ['🎯', 'Más fácil ahorrar', 'Avisos antes de pasarte del límite de cada categoría'],
  ['🔒', 'Tus datos, en tu móvil', 'Sin conectar el banco ni dar contraseñas'],
] as const;

// Precios de referencia mientras no estén configurados los productos en las tiendas.
const FALLBACK = [
  { id: 'anual', title: 'Anual', price: '14,99 €/año', note: '1,25 € al mes · ahorra un 37%' },
  { id: 'mensual', title: 'Mensual', price: '1,99 €/mes', note: 'Cancela cuando quieras' },
  { id: 'vida', title: 'Para siempre', price: '29,99 €', note: 'Un solo pago' },
];

export default function Premium() {
  const t = useTheme();
  const premium = usePremium();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getPackages().then(setPackages).catch(() => setMessage('No hemos podido cargar los precios. Revisa tu conexión.'));
  }, []);

  const options = packages.length
    ? packages.map((p) => ({ id: p.identifier, title: p.product.title, price: p.product.priceString, note: p.product.description }))
    : FALLBACK;

  const purchase = async () => {
    const pkg = packages[selected];
    if (!pkg) {
      setMessage('Las compras aún no están configuradas en esta versión de prueba.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (await buy(pkg)) router.back();
    } catch (e: unknown) {
      const cancelled = typeof e === 'object' && e !== null && 'userCancelled' in e && (e as { userCancelled?: boolean }).userCancelled;
      if (!cancelled) setMessage('No se ha completado la compra. No se te ha cobrado nada.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 18, paddingBottom: 48 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 48 }}>⭐</Text>
        <T variant="title" style={{ textAlign: 'center' }}>
          Cuadra Premium
        </T>
        <T variant="small" style={{ textAlign: 'center', fontSize: 15 }}>
          {premium ? 'Ya tienes Premium. ¡Gracias por apoyar la app!' : '7 días gratis. Después, elige tu plan.'}
        </T>
      </View>

      <View style={{ gap: 12 }}>
        {FEATURES.map(([emoji, title, desc]) => (
          <View key={title} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '700' }}>{title}</T>
              <T variant="small">{desc}</T>
            </View>
          </View>
        ))}
      </View>

      {!premium && (
        <>
          <View style={{ gap: 10 }}>
            {options.map((o, i) => (
              <Pressable
                key={o.id}
                onPress={() => {
                  tap();
                  setSelected(i);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: radius.lg,
                  borderWidth: 2,
                  borderColor: selected === i ? t.accent : t.line,
                  backgroundColor: selected === i ? t.accentSoft : t.surface,
                }}>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '700' }}>{o.title}</T>
                  {!!o.note && <T variant="small">{o.note}</T>}
                </View>
                <T style={{ fontWeight: '800' }}>{o.price}</T>
              </Pressable>
            ))}
          </View>
          {busy ? <ActivityIndicator color={t.accent} /> : <Button title="Empezar prueba gratis" onPress={purchase} />}
          {message && <T variant="small" style={{ textAlign: 'center', color: t.spend }}>{message}</T>}
          <Button
            title="Restaurar compras"
            variant="link"
            onPress={async () => {
              if (!purchasesConfigured()) return setMessage('Las compras aún no están configuradas en esta versión de prueba.');
              const ok = await restore().catch(() => false);
              setMessage(ok ? null : 'No hemos encontrado compras anteriores con esta cuenta.');
              if (ok) router.back();
            }}
          />
          <T variant="small" style={{ textAlign: 'center', fontSize: 11.5 }}>
            La suscripción se renueva sola salvo que la canceles al menos 24 horas antes desde los ajustes de tu cuenta de la tienda.
          </T>
        </>
      )}
      <Button title="Cerrar" variant="link" onPress={() => router.back()} />
    </ScrollView>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { EXPENSE_CATEGORIES, guessCategory, INCOME_CATEGORIES, type MovementType } from '@/lib/categories';
import { importCaptured } from '@/lib/detection';
import { eur, parseAmount, shortDate } from '@/lib/format';
import { useStore } from '@/lib/store';
import { Button, CategoryTile, T, tap } from '@/ui/components';
import { radius, useTheme } from '@/ui/theme';

type Params = {
  id?: string;
  nuevo?: string;
  /** Captura de Android pendiente (viene del aviso nativo). */
  pendiente?: string;
  /** Atajo de iPhone: cuadra://clasificar?importe=23,40&comercio=Lidl&tipo=gasto */
  importe?: string;
  comercio?: string;
  tipo?: string;
};

/**
 * Resuelve qué movimiento hay que clasificar, creándolo si viene de un aviso de Android o de un Atajo de iPhone.
 * Los ids son deterministas para que abrir el mismo enlace dos veces no duplique el movimiento.
 */
function resolveTarget(params: Params): string | null {
  const store = useStore.getState();
  if (params.id) return params.id;
  if (params.pendiente) return importCaptured()[params.pendiente] ?? `banco-${params.pendiente}`;
  if (params.importe) {
    const amount = parseAmount(params.importe);
    if (!(amount > 0)) return null;
    const type: MovementType = params.tipo === 'ingreso' ? 'ingreso' : 'gasto';
    const merchant = (params.comercio ?? '').trim() || 'Pago con Apple Pay';
    const minute = Math.floor(Date.now() / 60_000);
    return store.addMovement({
      id: `atajo-${minute}-${amount}-${merchant}`,
      type,
      amount,
      merchant,
      categoryId: null,
      suggestedCategoryId: guessCategory(merchant, type),
      date: new Date().toISOString(),
      source: 'atajo',
    });
  }
  return null;
}

export default function Clasificar() {
  const t = useTheme();
  const params = useLocalSearchParams<Params>();
  const [targetId] = useState(() => resolveTarget(params));
  const existing = useStore((s) => s.movements.find((m) => m.id === targetId));
  const plan = useStore((s) => s.plan);
  const { addMovement, updateMovement, deleteMovement } = useStore.getState();

  const isNew = !existing;
  const [type, setType] = useState<MovementType>(existing?.type ?? 'gasto');
  const [amountText, setAmountText] = useState(existing ? String(existing.amount).replace('.', ',') : '');
  const [merchant, setMerchant] = useState(existing?.merchant ?? '');
  const [category, setCategory] = useState<string | null>(existing?.categoryId ?? existing?.suggestedCategoryId ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const list =
    type === 'gasto'
      ? EXPENSE_CATEGORIES.filter((c) => plan.categories.includes(c.id) || c.id === 'otros')
      : INCOME_CATEGORIES;
  const amount = parseAmount(amountText);
  const canSave = !!category && amount > 0;

  const save = () => {
    if (!category || !(amount > 0)) return;
    const name = merchant.trim() || list.find((c) => c.id === category)?.name || 'Movimiento';
    if (existing) updateMovement(existing.id, { type, amount, merchant: name, categoryId: category, suggestedCategoryId: undefined });
    else addMovement({ type, amount, merchant: name, categoryId: category, date: new Date().toISOString(), source: 'manual' });
    router.back();
  };

  return (
    <ScrollView style={{ backgroundColor: t.surface }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {existing && !existing.categoryId && (
        <T variant="label" style={{ textAlign: 'center', color: t.warn }}>
          {existing.source === 'banco' ? 'Detectado en tu banco' : existing.source === 'atajo' ? 'Pago con Apple Pay' : 'Pendiente'} · {shortDate(existing.date)}
        </T>
      )}
      {isNew && <T variant="h2">Nuevo movimiento</T>}

      <View style={{ flexDirection: 'row', backgroundColor: t.surfaceAlt, padding: 4, borderRadius: 14, gap: 6 }}>
        {(['gasto', 'ingreso'] as const).map((k) => (
          <Pressable
            key={k}
            onPress={() => {
              tap();
              setType(k);
              setCategory(null);
            }}
            style={{ flex: 1, padding: 10, borderRadius: 11, alignItems: 'center', backgroundColor: type === k ? t.surface : 'transparent' }}>
            <Text style={{ fontWeight: '700', color: type === k ? t.ink : t.muted }}>{k === 'gasto' ? 'Gasto' : 'Ingreso'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ alignItems: 'center' }}>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          placeholder="0,00"
          placeholderTextColor={t.muted}
          keyboardType="decimal-pad"
          autoFocus={isNew}
          style={{ fontSize: 40, fontWeight: '800', color: type === 'gasto' ? t.ink : t.accent, textAlign: 'center', minWidth: 160 }}
        />
        <T variant="small">{amount > 0 ? eur(amount) : 'Importe en euros'}</T>
      </View>

      <TextInput
        value={merchant}
        onChangeText={setMerchant}
        placeholder="Concepto (ej. Panadería)"
        placeholderTextColor={t.muted}
        style={{ fontSize: 16, color: t.ink, backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 14 }}
      />

      <T variant="label">{existing?.suggestedCategoryId && !existing.categoryId ? 'Te sugerimos una categoría' : 'Categoría'}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {list.map((c) => (
          <CategoryTile key={c.id} id={c.id} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </View>

      <Button title="Guardar" onPress={save} disabled={!canSave} />

      {existing &&
        (confirmDelete ? (
          <View style={{ gap: 8 }}>
            <T variant="small" style={{ textAlign: 'center' }}>
              ¿Seguro que quieres borrar este movimiento?
            </T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Cancelar" variant="ghost" style={{ flex: 1 }} onPress={() => setConfirmDelete(false)} />
              <Button
                title="Borrar"
                style={{ flex: 1, backgroundColor: t.spend }}
                onPress={() => {
                  deleteMovement(existing.id);
                  router.back();
                }}
              />
            </View>
          </View>
        ) : (
          <Button title="Borrar movimiento" variant="link" onPress={() => setConfirmDelete(true)} />
        ))}
    </ScrollView>
  );
}

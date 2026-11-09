import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { getCategory } from '@/lib/categories';
import { eur, shortDate } from '@/lib/format';
import type { Movement } from '@/lib/store';
import { radius, useTheme } from './theme';

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

export function T({
  children,
  style,
  variant = 'body',
  numberOfLines,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: 'title' | 'h2' | 'body' | 'small' | 'label' | 'big';
  numberOfLines?: number;
}) {
  const t = useTheme();
  const base: Record<string, TextStyle> = {
    big: { fontSize: 38, fontWeight: '800', letterSpacing: -0.8, color: t.ink, fontVariant: ['tabular-nums'] },
    title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, color: t.ink },
    h2: { fontSize: 18, fontWeight: '700', color: t.ink },
    body: { fontSize: 15, color: t.ink },
    small: { fontSize: 13, color: t.muted },
    label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: t.muted },
  };
  return (
    <Text style={[base[variant], style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.surface,
          borderRadius: radius.lg,
          padding: 18,
          gap: 14,
          boxShadow: '0 6px 20px rgba(15, 40, 30, 0.07)',
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'link';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.accent : variant === 'ghost' ? t.surface : 'transparent';
  const fg = variant === 'primary' ? t.surface : variant === 'ghost' ? t.accent : t.muted;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingVertical: 15,
          paddingHorizontal: 18,
          alignItems: 'center',
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        variant === 'ghost' && { boxShadow: '0 4px 14px rgba(15, 40, 30, 0.08)' },
        style,
      ]}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

export function CategoryIcon({ id, size = 44 }: { id: string | null | undefined; size?: number }) {
  const c = getCategory(id);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: c.color + '24',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: size * 0.46 }}>{c.emoji}</Text>
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const t = useTheme();
  return (
    <View style={{ height: 8, borderRadius: 99, backgroundColor: t.line, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

export function MovementRow({ m, onPress, first }: { m: Movement; onPress: () => void; first?: boolean }) {
  const t = useTheme();
  const out = m.type === 'gasto';
  const c = getCategory(m.categoryId);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: t.line, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, opacity: pressed ? 0.6 : 1 },
      ]}>
      <CategoryIcon id={m.categoryId ?? m.suggestedCategoryId ?? null} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T style={{ fontWeight: '600' }} numberOfLines={1}>
          {m.merchant}
        </T>
        <T variant="small" numberOfLines={1}>
          {m.categoryId ? c.name : <Text style={{ color: t.warn, fontWeight: '600' }}>Toca para clasificar</Text>} · {shortDate(m.date)}
        </T>
      </View>
      <T style={{ fontWeight: '700', color: out ? t.ink : t.accent, fontVariant: ['tabular-nums'] }}>
        {out ? '−' : '+'}
        {eur(m.amount)}
      </T>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={{
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 99,
        borderWidth: 2,
        borderColor: selected ? t.accent : t.line,
        backgroundColor: selected ? t.accentSoft : t.surface,
      }}>
      <Text style={{ color: selected ? t.accent : t.ink, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function CategoryTile({ id, selected, onPress }: { id: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const c = getCategory(id);
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={{
        width: '23%',
        flexGrow: 1,
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: selected ? t.accent : 'transparent',
        backgroundColor: selected ? t.accentSoft : t.surfaceAlt,
      }}>
      <CategoryIcon id={id} size={38} />
      <Text style={{ fontSize: 11.5, fontWeight: '600', color: t.ink, textAlign: 'center' }} numberOfLines={2}>
        {c.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});

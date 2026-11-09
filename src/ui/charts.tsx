import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { getCategory } from '@/lib/categories';
import { useTheme } from './theme';

/** Anillo de progreso (ahorro del mes). */
export function Ring({ value, size = 104, stroke = 10, color, track }: { value: number; size?: number; stroke?: number; color: string; track: string }) {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={len * (1 - Math.max(0, Math.min(1, value)))}
      />
    </Svg>
  );
}

/** Gráfico circular del gasto por categoría. */
export function Donut({ data, size = 140, stroke = 18 }: { data: Record<string, number>; size?: number; stroke?: number }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const entries = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const gap = entries.length > 1 ? 2 : 0;
  let offset = 0;
  return (
    <View>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.line} strokeWidth={stroke} fill="none" />
        {total > 0 &&
          entries.map(([id, v]) => {
            const seg = (v / total) * len;
            const el = (
              <Circle
                key={id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={getCategory(id).color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${Math.max(0, seg - gap)} ${len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += seg;
            return el;
          })}
      </Svg>
    </View>
  );
}

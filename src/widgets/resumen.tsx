import { Gauge, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  gaugeStyle,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  opacity,
  padding,
  tint,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/** Datos que la app manda al widget. Todo ya formateado: el widget no puede usar funciones de la app. */
export type ResumenProps = {
  locked: boolean;
  left: string;
  leftShort: string;
  savedPct: number;
  goal: string;
  payday: number;
  pending: number;
};

export const RESUMEN_EMPTY: ResumenProps = {
  locked: false,
  left: '—',
  leftShort: '—',
  savedPct: 0,
  goal: '—',
  payday: 1,
  pending: 0,
};

/**
 * Diseño del widget. La directiva 'widget' convierte esta función en texto que se ejecuta
 * dentro del widget de iOS, así que solo puede usar sus props y los componentes de @expo/ui.
 */
const ResumenLayout = (props: ResumenProps, env: WidgetEnvironment) => {
  'widget';
  const family = env.widgetFamily ?? 'systemSmall';
  const isAccessory = family.indexOf('accessory') === 0;
  const pct = Math.max(0, Math.min(1, props.savedPct));
  const pctText = Math.round(pct * 100) + '%';

  const now = env.date ? new Date(env.date) : new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), props.payday);
  if (next.getTime() <= now.getTime()) next.setMonth(next.getMonth() + 1);
  const days = Math.ceil((next.getTime() - now.getTime()) / 86400000);
  const daysText = days === 1 ? 'Cobras mañana' : 'Cobras en ' + days + ' días';

  const green = {
    type: 'linearGradient' as const,
    colors: ['#11604F', '#1F9677'],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
  const white = '#FFFFFF';
  const mint = '#7CE3C2';
  const url = props.pending > 0 ? 'cuadra:///movimientos' : 'cuadra:///';

  if (isAccessory) {
    const bg = containerBackground('clear', 'widget');
    if (props.locked) {
      return <Text modifiers={[bg]}>Cuadra</Text>;
    }
    if (family === 'accessoryInline') {
      return <Text modifiers={[bg, widgetURL(url)]}>{'Te queda ' + props.leftShort}</Text>;
    }
    if (family === 'accessoryCircular') {
      return (
        <Gauge
          value={pct}
          min={0}
          max={1}
          modifiers={[gaugeStyle('circularCapacity'), bg, widgetURL(url)]}
          currentValueLabel={<Text modifiers={[font({ size: 13, weight: 'bold' })]}>{pctText}</Text>}>
          <Text>Ahorro</Text>
        </Gauge>
      );
    }
    return (
      <VStack alignment="leading" spacing={2} modifiers={[bg, widgetURL(url)]}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), opacity(0.8)]}>Te queda este mes</Text>
        <Text modifiers={[font({ size: 22, weight: 'bold', design: 'rounded' }), monospacedDigit(), minimumScaleFactor(0.6), lineLimit(1)]}>
          {props.leftShort}
        </Text>
        <Gauge value={pct} min={0} max={1} modifiers={[gaugeStyle('linearCapacity')]} />
      </VStack>
    );
  }

  const bg = containerBackground(green, 'widget');

  if (props.locked) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={[bg, widgetURL('cuadra:///premium')]}>
        <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(white)]}>Cuadra</Text>
        <Spacer />
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(white)]}>
          Activa Premium para ver aquí lo que te queda cada mes.
        </Text>
      </VStack>
    );
  }

  const amount = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(white), opacity(0.8)]}>TE QUEDA</Text>
      <Text
        modifiers={[
          font({ size: family === 'systemSmall' ? 26 : 32, weight: 'heavy', design: 'rounded' }),
          foregroundStyle(white),
          monospacedDigit(),
          minimumScaleFactor(0.5),
          lineLimit(1),
        ]}>
        {props.left}
      </Text>
    </VStack>
  );

  const footer = (
    <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(props.pending > 0 ? '#FFD970' : white), opacity(0.95), lineLimit(1)]}>
      {props.pending > 0 ? props.pending + ' por clasificar' : daysText}
    </Text>
  );

  if (family === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={[bg, widgetURL(url)]}>
        {amount}
        <Spacer />
        <HStack spacing={6}>
          <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(mint)]}>{'Ahorro ' + pctText}</Text>
        </HStack>
        <Gauge value={pct} min={0} max={1} modifiers={[gaugeStyle('linearCapacity'), tint(mint)]} />
        {footer}
      </VStack>
    );
  }

  return (
    <HStack spacing={14} modifiers={[bg, widgetURL(url), padding({ horizontal: 4 })]}>
      <VStack alignment="leading" spacing={6}>
        {amount}
        <Spacer />
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(white), opacity(0.85)]}>{'Meta: ' + props.goal}</Text>
        {footer}
      </VStack>
      <Spacer />
      <Gauge
        value={pct}
        min={0}
        max={1}
        modifiers={[gaugeStyle('circularCapacity'), tint(mint), foregroundStyle(white)]}
        currentValueLabel={<Text modifiers={[font({ size: 18, weight: 'heavy' }), foregroundStyle(white)]}>{pctText}</Text>}>
        <Text modifiers={[foregroundStyle(white)]}>Ahorro</Text>
      </Gauge>
    </HStack>
  );
};

export const ResumenWidget = createWidget<ResumenProps>('Resumen', ResumenLayout, RESUMEN_EMPTY);

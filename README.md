# Cuadra

App de ahorro y control de gastos para Android e iPhone, hecha con Expo (React Native).
Cada vez que pagas o cobras, te llega un aviso para clasificar el movimiento en un toque.

## Qué hay hecho

| Parte | Dónde |
|---|---|
| Configuración inicial adaptada (perfil, sueldo, día de cobro, % de ahorro, categorías) | `src/app/onboarding.tsx` |
| Inicio: lo que te queda, anillo de ahorro, gráfico de gastos, límites, consejos | `src/app/(tabs)/index.tsx` |
| Añadir / clasificar movimiento (también desde avisos y Atajos de iPhone) | `src/app/clasificar.tsx` |
| Movimientos por mes (meses anteriores = Premium) | `src/app/(tabs)/movimientos.tsx` |
| Mi plan: límites, categorías, avisos, detección automática | `src/app/(tabs)/ajustes.tsx` |
| Pantalla Premium y compras (RevenueCat) | `src/app/premium.tsx`, `src/lib/purchases.ts` |
| Lectura de avisos del banco en Android (módulo nativo Kotlin) | `modules/bank-listener/` |
| Interpretar el texto del aviso ("Has pagado 23,40 € en LIDL…") | `src/lib/bank-parser.ts` |
| Recordatorio diario y aviso el día de cobro | `src/lib/notifications.ts` |
| Plan de marketing | `docs/marketing.md` |

Los datos se guardan solo en el móvil (AsyncStorage). No hay servidor.

## Probarla

```bash
npm install
npx expo start
```

- Con **Expo Go** puedes ver las pantallas, pero no la detección de pagos de Android ni las compras.
- Para probarlo todo necesitas una **build de desarrollo**, porque la app lleva código nativo propio:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

En «Mi plan» → «Desarrollo» hay botones para simular Premium y un aviso del banco (solo en modo desarrollo).

## Cómo funciona la detección de pagos

- **Android:** `BankNotificationService` recibe las notificaciones de las apps de banco de la lista
  (`modules/bank-listener/.../CapturedStore.kt`). Si el texto tiene un importe y una palabra como
  «pago», «compra» o «recibido», lo guarda y muestra «Has pagado 23,40 € · Toca para clasificarlo».
  El usuario tiene que dar permiso de acceso a notificaciones en Ajustes de Android.
- **iPhone:** iOS no deja leer las notificaciones de otras apps. El usuario crea una automatización en
  Atajos (disparador «Transacción» de Apple Pay) que abre
  `cuadra://clasificar?importe=[Importe]&comercio=[Comercio]`. Los pasos aparecen en «Mi plan».

## Antes de publicar

1. Cambia `com.cuadra.app` en `app.json` por un identificador tuyo (no se puede cambiar después).
2. Revisa en Google Play los identificadores de las apps de banco de `CapturedStore.kt` y prueba con avisos reales de cada banco.
3. Crea los productos en App Store Connect y Google Play Console: `mensual` (1,99 €), `anual` (14,99 €)
   con 7 días de prueba, y `vida` (29,99 €, pago único).
4. En RevenueCat, crea el entitlement `premium`, añade los productos a la offering actual y copia las claves públicas en `.env` (ver `.env.example`).
5. Google Play pide justificar el permiso de acceso a notificaciones: explica en la ficha y en la política de privacidad que solo se leen los avisos de bancos para detectar pagos y que nada sale del móvil.
6. Sustituye los iconos y la pantalla de inicio de `assets/images` por los de Cuadra.
7. Build y envío: `npx eas-cli@latest build --profile production` y `npx eas-cli@latest submit`.

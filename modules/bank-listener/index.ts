import { Platform } from 'react-native';
import { requireOptionalNativeModule, type EventSubscription } from 'expo-modules-core';

export type CapturedNotification = {
  id: string;
  package: string;
  title: string;
  text: string;
  /** Milisegundos desde 1970. */
  time: number;
};

type NativeModule = {
  hasPermission(): boolean;
  openPermissionSettings(): void;
  configure(enabled: boolean, packages: string[] | null, anyApp: boolean): void;
  getDefaultPackages(): string[];
  getPending(): CapturedNotification[];
  removePending(ids: string[]): void;
  addListener(event: 'onCaptured', listener: (n: CapturedNotification) => void): EventSubscription;
};

// Solo existe en Android con una build de desarrollo o de tienda (no en Expo Go, iOS ni web).
const Native = Platform.OS === 'android' ? requireOptionalNativeModule<NativeModule>('BankListener') : null;

export const BankListener = {
  isAvailable: Native != null,
  hasPermission: () => Native?.hasPermission() ?? false,
  openPermissionSettings: () => Native?.openPermissionSettings(),
  configure: (enabled: boolean, packages: string[] | null = null, anyApp = false) =>
    Native?.configure(enabled, packages, anyApp),
  getPending: (): CapturedNotification[] => Native?.getPending() ?? [],
  removePending: (ids: string[]) => Native?.removePending(ids),
  addListener: (listener: (n: CapturedNotification) => void) => Native?.addListener('onCaptured', listener) ?? null,
};

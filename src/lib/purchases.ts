import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { useStore } from './store';

/** Nombre del "entitlement" que hay que crear en RevenueCat. */
export const ENTITLEMENT = 'premium';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configured = false;

export function initPurchases() {
  if (configured || !API_KEY || Platform.OS === 'web') return;
  Purchases.configure({ apiKey: API_KEY });
  configured = true;
}

export const purchasesConfigured = () => configured;

const isActive = (info: CustomerInfo | null) => !!info?.entitlements.active[ENTITLEMENT];

export function usePremium(): boolean {
  const devPremium = useStore((s) => s.devPremium);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let mounted = true;
    Purchases.getCustomerInfo()
      .then((info) => mounted && setActive(isActive(info)))
      .catch(() => {});
    const listener = (info: CustomerInfo) => setActive(isActive(info));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  return active || (__DEV__ && devPremium);
}

export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return isActive(customerInfo);
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  return isActive(await Purchases.restorePurchases());
}

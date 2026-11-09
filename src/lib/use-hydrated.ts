import { useSyncExternalStore } from 'react';

import { useStore } from './store';

const subscribe = (cb: () => void) => useStore.persist.onFinishHydration(cb);
const getSnapshot = () => useStore.persist.hasHydrated();

/** true cuando los datos guardados en el móvil ya se han cargado. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

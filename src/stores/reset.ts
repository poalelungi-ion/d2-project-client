import { useAuthStore } from './authStore';
import { useThemeStore } from './themeStore';
import { useToastStore } from './toastStore';
import { useSystemLogStore } from './systemLogStore';

interface Resettable<T> {
  getState: () => T;
  setState: (state: T, replace: true) => void;
}

/**
 * Snapshots a store's state at module load -- before anything has had a
 * chance to mutate it -- and hands back a thunk that puts it back.
 */
const snapshot = <T,>(store: Resettable<T>): (() => void) => {
  const initial = store.getState();
  return () => store.setState(initial, true);
};

const RESETTERS = [
  snapshot(useAuthStore),
  snapshot(useThemeStore),
  snapshot(useToastStore),
  snapshot(useSystemLogStore),
];

/**
 * Stores are module singletons, so state written by one test would otherwise
 * be visible to the next. Called from setupTests after every case.
 */
export const resetStores = (): void => {
  RESETTERS.forEach((reset) => reset());
};

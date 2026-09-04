import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Binds one URL search parameter to a value, so list filters survive
 * navigating into a detail screen and back, work with the browser's back
 * button, and can be shared as a link.
 *
 * Writes replace rather than push -- typing in a filter box should not fill
 * the back button with one entry per keystroke -- and writing the fallback
 * drops the key entirely, so an untouched screen keeps a clean URL.
 *
 * `allowed` guards against a hand-edited URL: anything outside the list falls
 * back rather than reaching a component that cannot render it.
 */
export function useQueryParam<T extends string>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
) {
  const [params, setParams] = useSearchParams();

  const raw = params.get(key) as T | null;
  const value = raw !== null && (!allowed || allowed.includes(raw)) ? raw : fallback;

  const setValue = useCallback(
    (next: T) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next === fallback) updated.delete(key);
          else updated.set(key, next);
          return updated;
        },
        { replace: true },
      );
    },
    [key, fallback, setParams],
  );

  return [value, setValue] as const;
}

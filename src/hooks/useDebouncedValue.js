import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly changing value (e.g. search input) so the
 * input stays responsive while expensive filtering/sorting runs
 * only after the user pauses typing.
 */
export function useDebouncedValue(value, delayMs = 120) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

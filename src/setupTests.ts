import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { resetStores } from './stores/reset';

/**
 * jsdom implements no ResizeObserver, and Recharts' ResponsiveContainer
 * constructs one on mount. Without this, rendering any screen that holds a
 * chart throws before its markup can be asserted on. The stub does nothing:
 * there is no layout in jsdom to observe, and no test depends on chart
 * dimensions.
 */
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;

afterEach(resetStores);

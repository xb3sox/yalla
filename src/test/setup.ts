import '@testing-library/jest-dom';
import { afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

// Avoid jsdom "Not implemented" errors related to canvas getContext
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Not implemented')) return;
  if (args[0] && args[0] instanceof Error && args[0].message.includes('Not implemented')) return;
  originalConsoleError(...args);
};

if (typeof window !== 'undefined' && window.HTMLCanvasElement) {
  window.HTMLCanvasElement.prototype.getContext = () => null;
}

// With isolate:false all test files share one environment; without explicit
// cleanup the document accumulates every prior render and queries like
// getByRole match multiple elements. Also restore mocks between files.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

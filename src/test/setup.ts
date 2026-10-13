import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// With isolate:false all test files share one environment; without explicit
// cleanup the document accumulates every prior render and queries like
// getByRole match multiple elements. Also restore mocks between files.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

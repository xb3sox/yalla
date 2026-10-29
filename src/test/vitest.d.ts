import '@testing-library/jest-dom';
import 'vitest-axe/matchers';
import type { AxeMatchers } from 'vitest-axe';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = any> extends AxeMatchers, TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

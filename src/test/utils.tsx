import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AppProvider, Action } from '../data/store';
import { ToastProvider } from '../components/Toast';
import type { Language, Role } from '../types';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  language?: Language;
  role?: Role;
  withToast?: boolean;
  extraActions?: Action[];
}

/**
 * Renders UI wrapped in AppProvider (+ optional ToastProvider) with the
 * requested language/role pre-selected. Seeding happens through the real
 * reducer via AppProvider's `initialActions`, so state shape always stays
 * in sync with the store implementation.
 */
export function renderWithProviders(ui: React.ReactElement, options: RenderWithProvidersOptions = {}) {
  const { language = 'en', role, withToast = true, extraActions = [], ...renderOptions } = options;

  const actions: Action[] = [];
  if (language !== 'en') actions.push({ type: 'SET_LANGUAGE', payload: language });
  if (role) actions.push({ type: 'SET_ROLE', payload: role });
  actions.push(...extraActions);

  function Wrapper({ children }: { children: ReactNode }) {
    const hasToastProvider = withToast && typeof ToastProvider === 'function';
    return (
      <AppProvider initialActions={actions}>
        {hasToastProvider ? <ToastProvider>{children}</ToastProvider> : children}
      </AppProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

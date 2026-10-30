import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { AppProvider } from '../data/store';

describe('KeyboardShortcutsHelp Component', () => {
  it('renders the floating keyboard shortcuts button with correct ARIA label', () => {
    render(
      <AppProvider>
        <KeyboardShortcutsHelp />
      </AppProvider>
    );

    const button = screen.getByRole('button', { name: /keyboard shortcuts/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('focus-visible:outline-2');
  });

  it('opens dialog when button is clicked', () => {
    render(
      <AppProvider>
        <KeyboardShortcutsHelp />
      </AppProvider>
    );

    const button = screen.getByRole('button', { name: /keyboard shortcuts/i });
    fireEvent.click(button);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Go to Explore')).toBeInTheDocument();
  });

  it('opens dialog when ? key is pressed', () => {
    render(
      <AppProvider>
        <KeyboardShortcutsHelp />
      </AppProvider>
    );

    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('does not open dialog when ? key is pressed inside an input', () => {
    render(
      <AppProvider>
        <input data-testid="test-input" />
        <KeyboardShortcutsHelp />
      </AppProvider>
    );

    const input = screen.getByTestId('test-input');
    fireEvent.keyDown(input, { key: '?' });

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });
});

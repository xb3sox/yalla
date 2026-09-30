import { useEffect } from 'react';
import { useApp } from '../data/store';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const { state } = useApp();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      shortcuts.forEach(shortcut => {
        if (shortcut.enabled === false) return;

        const matches = 
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!shortcut.ctrlKey === e.ctrlKey &&
          !!shortcut.shiftKey === e.shiftKey &&
          !!shortcut.altKey === e.altKey &&
          !!shortcut.metaKey === e.metaKey;

        if (matches) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, state.language]);
}

// Predefined shortcut sets
export function useNavigationShortcuts(navigate: (view: string) => void) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      description: 'Go to Explore',
      action: () => navigate('explore'),
    },
    {
      key: '2',
      description: 'Go to My Plans',
      action: () => navigate('plans'),
    },
    {
      key: '3',
      description: 'Go to Profile',
      action: () => navigate('profile'),
    },
    {
      key: 'Escape',
      description: 'Go back',
      action: () => navigate('explore'),
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

export function useActionShortcuts(actions: {
  onBook?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Enter',
      description: 'Confirm action',
      action: () => actions.onConfirm?.(),
      enabled: !!actions.onConfirm,
    },
    {
      key: 'Escape',
      description: 'Cancel action',
      action: () => actions.onCancel?.(),
      enabled: !!actions.onCancel,
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

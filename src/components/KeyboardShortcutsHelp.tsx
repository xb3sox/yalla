import { useState, useEffect } from 'react';
import { Dialog, Button } from './DesignSystem';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Keyboard } from 'lucide-react';

export function KeyboardShortcutsHelp() {
  const { state } = useApp();
  const lang = state.language;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { keys: '1', description: lang === 'ar' ? 'الذهاب إلى الاستكشاف' : 'Go to Explore' },
    { keys: '2', description: lang === 'ar' ? 'الذهاب إلى خططي' : 'Go to My Plans' },
    { keys: '3', description: lang === 'ar' ? 'الذهاب إلى الملف الشخصي' : 'Go to Profile' },
    { keys: 'Esc', description: lang === 'ar' ? 'العودة' : 'Go back' },
    { keys: '?', description: lang === 'ar' ? 'إظهار المساعدة' : 'Show this help' },
  ];

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={lang === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
        actions={
          <Button variant="primary" onClick={() => setIsOpen(false)}>
            {lang === 'ar' ? 'حسناً' : 'Got it'}
          </Button>
        }
      >
        <div className="space-y-3">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-text-secondary">{shortcut.description}</span>
              <kbd className="px-3 py-1 text-xs font-mono font-semibold bg-surface-sunken border border-border rounded-lg text-text-primary">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-4 pt-4 border-t border-border">
          {lang === 'ar' 
            ? '💡 اضغط على "?" في أي وقت لعرض هذه المساعدة'
            : '💡 Press "?" anytime to show this help'}
        </p>
      </Dialog>

      {/* Floating help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 end-5 w-10 h-10 rounded-full bg-surface-raised border border-border shadow-md flex items-center justify-center hover:bg-surface-sunken transition-colors z-30"
        aria-label={lang === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard shortcuts'}
        title={lang === 'ar' ? 'اختصارات لوحة المفاتيح (?)' : 'Keyboard shortcuts (?)'}
      >
        <Keyboard className="w-5 h-5 text-text-secondary" />
      </button>
    </>
  );
}

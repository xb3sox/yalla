import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useApp } from '../data/store';

export function BackToTop() {
  const { state } = useApp();
  const lang = state?.language;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  const label = lang === 'ar' ? 'العودة إلى الأعلى' : 'Back to top';

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-40 end-5 w-10 h-10 rounded-full bg-surface-raised border border-border shadow-md flex items-center justify-center hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-all z-30 slide-up"
      aria-label={label}
      title={label}
    >
      <ArrowUp className="w-5 h-5 text-text-secondary" />
    </button>
  );
}

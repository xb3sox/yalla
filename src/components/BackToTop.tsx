import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useApp } from '../data/store';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { state } = useApp();
  const lang = state?.language || 'en';

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

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-40 end-5 w-10 h-10 rounded-full bg-surface-raised border border-border shadow-md flex items-center justify-center hover:bg-surface-sunken transition-all z-30 slide-up focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      aria-label={lang === 'ar' ? 'العودة إلى الأعلى' : 'Back to top'}
      title={lang === 'ar' ? 'العودة إلى الأعلى' : 'Back to top'}
    >
      <ArrowUp className="w-5 h-5 text-text-secondary" aria-hidden="true" />
    </button>
  );
}

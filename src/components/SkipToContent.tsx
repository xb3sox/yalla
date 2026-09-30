import { useApp } from '../data/store';
import { t } from '../i18n';

export function SkipToContent() {
  const { state } = useApp();
  const lang = state.language;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:bg-brand-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
    >
      {lang === 'ar' ? 'تخطي إلى المحتوى' : 'Skip to content'}
    </a>
  );
}

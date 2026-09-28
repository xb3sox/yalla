import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './data/store';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { PageTransition } from './components/PageTransition';
import { BackToTop } from './components/BackToTop';
import { useNavigationShortcuts } from './hooks/useKeyboardShortcuts';
import { t } from './i18n';
import { ExplorePage } from './pages/Explore';
import { ExperienceDetailsPage } from './pages/ExperienceDetails';
import { MyPlansPage } from './pages/MyPlans';
import { ArrivalModePage } from './pages/ArrivalMode';
import { FeedbackPage } from './pages/Feedback';
import { ProfilePage } from './pages/Profile';
import { SupportPage } from './pages/Support';
import { StaffPage } from './pages/Staff';
import { Compass, Calendar, User, Globe } from 'lucide-react';
import { OnboardingPage } from './pages/Onboarding';

type View = 'explore' | 'details' | 'plans' | 'arrival' | 'feedback' | 'profile' | 'support' | 'staff';

function AppContent() {
  const { state, dispatch } = useApp();
  const lang = state.language;
  const [currentView, setCurrentView] = useState<View>('explore');
  const [selectedExperienceId, setSelectedExperienceId] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState('');

  // Apply RTL/LTR
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentView, selectedExperienceId, selectedReservationId]);

  // Keyboard shortcuts
  useNavigationShortcuts((view) => {
    if (['explore', 'plans', 'profile'].includes(view)) {
      setCurrentView(view as View);
    }
  });

  const toggleLanguage = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang === 'en' ? 'ar' : 'en' });
  };

  const handleSelectExperience = (id: string) => {
    setSelectedExperienceId(id);
    setCurrentView('details');
  };

  const handleGoToArrival = (planId: string) => {
    setSelectedExperienceId(planId);
    setCurrentView('arrival');
  };

  const handleGoToFeedback = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setCurrentView('feedback');
  };

  const isStaffView = state.role !== 'participant' && state.role !== 'visitor';

  // Show onboarding for unauthenticated users
  if (!state.isAuthenticated || state.onboardingStep !== 'complete') {
    return <OnboardingPage onComplete={() => dispatch({ type: 'COMPLETE_ONBOARDING' })} />;
  }

  // Staff view
  if (isStaffView) {
    return (
      <div className="min-h-screen bg-surface">
        {currentView === 'staff' && <StaffPage onBack={() => setCurrentView('explore')} />}
        {currentView === 'support' && <SupportPage onBack={() => setCurrentView('staff')} />}
        {currentView === 'explore' && <ExplorePage onSelectExperience={handleSelectExperience} />}
        {currentView === 'details' && (
          <ExperienceDetailsPage experienceId={selectedExperienceId} onBack={() => setCurrentView('explore')} onBookSuccess={() => setCurrentView('plans')} />
        )}

        {/* Staff bottom nav */}
        <nav className="fixed bottom-0 start-0 end-0 bg-surface-raised border-t border-border z-40 safe-bottom" aria-label="Staff navigation">
          <div className="max-w-lg mx-auto flex items-center justify-around py-2">
            <NavButton icon={<Calendar className="w-5 h-5" />} label={t('nav.staff', lang)} active={currentView === 'staff'} onClick={() => setCurrentView('staff')} />
            <NavButton icon={<User className="w-5 h-5" />} label={t('nav.support', lang)} active={currentView === 'support'} onClick={() => setCurrentView('support')} />
          </div>
        </nav>
      </div>
    );
  }

  // Participant view
  return (
    <div className="min-h-screen bg-surface max-w-lg mx-auto relative">
      {/* Minimal header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 h-14">
          <span className="text-lg font-semibold text-text-primary tracking-tight">Yalla</span>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-sunken text-xs font-medium text-text-secondary hover:bg-border transition-colors"
            aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{lang === 'en' ? 'العربية' : 'EN'}</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <PageTransition transitionKey={currentView + selectedExperienceId + selectedReservationId}>
        <main>
          {currentView === 'explore' && <ExplorePage onSelectExperience={handleSelectExperience} />}
          {currentView === 'details' && (
            <ExperienceDetailsPage experienceId={selectedExperienceId} onBack={() => setCurrentView('explore')} onBookSuccess={() => setCurrentView('plans')} />
          )}
          {currentView === 'plans' && (
            <MyPlansPage onViewExperience={handleSelectExperience} onGoToArrival={handleGoToArrival} onGoToFeedback={handleGoToFeedback} />
          )}
          {currentView === 'arrival' && <ArrivalModePage experienceId={selectedExperienceId} onBack={() => setCurrentView('plans')} />}
          {currentView === 'feedback' && <FeedbackPage reservationId={selectedReservationId} onBack={() => setCurrentView('plans')} onBookAnother={() => setCurrentView('explore')} />}
          {currentView === 'profile' && <ProfilePage onGoToSupport={() => setCurrentView('support')} />}
          {currentView === 'support' && <SupportPage onBack={() => setCurrentView('profile')} />}
        </main>
      </PageTransition>

      {/* Bottom navigation — 3 tabs only */}
      <nav className="fixed bottom-0 start-0 end-0 bg-surface-raised/95 backdrop-blur-md border-t border-border z-40 safe-bottom" aria-label="Main navigation">
        <div className="max-w-lg mx-auto flex items-center justify-around py-1.5">
          <NavButton icon={<Compass className="w-[22px] h-[22px]" />} label={t('nav.explore', lang)} active={currentView === 'explore' || currentView === 'details'} onClick={() => setCurrentView('explore')} />
          <NavButton
            icon={<Calendar className="w-[22px] h-[22px]" />}
            label={t('nav.myPlans', lang)}
            active={currentView === 'plans' || currentView === 'arrival' || currentView === 'feedback'}
            onClick={() => setCurrentView('plans')}
            badge={state.reservations.filter(r => r.participantId === 'user-1' && r.state === 'reconfirmation_required').length}
          />
          <NavButton icon={<User className="w-[22px] h-[22px]" />} label={t('nav.profile', lang)} active={currentView === 'profile' || currentView === 'support'} onClick={() => setCurrentView('profile')} />
        </div>
      </nav>

      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsHelp />

      {/* Back to top button */}
      <BackToTop />
    </div>
  );
}

/* Navigation button — clean, minimal */
function NavButton({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors min-w-[56px] min-h-[48px] relative ${
        active ? 'text-brand-600' : 'text-text-tertiary hover:text-text-secondary'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -end-1.5 w-4 h-4 bg-accent-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
      {active && <span className="absolute bottom-0.5 w-5 h-0.5 rounded-full bg-brand-500" aria-hidden="true" />}
    </button>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './data/store';
import { t } from './i18n';
import { ExplorePage } from './pages/Explore';
import { ExperienceDetailsPage } from './pages/ExperienceDetails';
import { MyPlansPage } from './pages/MyPlans';
import { ArrivalModePage } from './pages/ArrivalMode';
import { FeedbackPage } from './pages/Feedback';
import { ProfilePage } from './pages/Profile';
import { SupportPage } from './pages/Support';
import { StaffPage } from './pages/Staff';
import { Compass, Calendar, User, HeadphonesIcon, Briefcase, Globe } from 'lucide-react';
import { OnboardingPage } from './pages/Onboarding';

type View = 'explore' | 'details' | 'plans' | 'arrival' | 'feedback' | 'profile' | 'support' | 'staff';

function AppContent() {
  const { state, dispatch } = useApp();
  const lang = state.language;
  const [currentView, setCurrentView] = useState<View>('explore');
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>('');
  const [selectedReservationId, setSelectedReservationId] = useState<string>('');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Apply RTL/LTR
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang === 'en' ? 'ar' : 'en' });
  };

  const navigateToExplore = () => setCurrentView('explore');
  const navigateToPlans = () => setCurrentView('plans');
  const navigateToProfile = () => setCurrentView('profile');

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

  const handleBookSuccess = () => {
    setCurrentView('plans');
  };

  const isStaffView = state.role !== 'participant' && state.role !== 'visitor';

  // Show onboarding for visitors
  if (!state.isAuthenticated || state.onboardingStep !== 'complete') {
    return <OnboardingPage onComplete={() => dispatch({ type: 'COMPLETE_ONBOARDING' })} />;
  }

  return (
    <div className="min-h-screen bg-ivory max-w-lg mx-auto relative">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-sm border-b border-sand-100">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <span className="text-lg font-bold text-charcoal-900">Yalla</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sand-100 text-xs font-medium text-charcoal-600 hover:bg-sand-200 transition-colors"
              aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
            {state.role === 'participant' && (
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors"
                aria-label="Switch role"
              >
                <Briefcase className="w-4 h-4 text-charcoal-500" />
              </button>
            )}
          </div>
        </div>

        {/* Role Switcher Dropdown */}
        {showRoleSwitcher && (
          <div className="absolute top-14 end-5 bg-white rounded-xl shadow-lg border border-sand-200 p-2 z-50 min-w-[160px]">
            {(['participant', 'host', 'operations', 'support', 'trust_safety', 'admin'] as const).map(role => (
              <button
                key={role}
                onClick={() => { dispatch({ type: 'SET_ROLE', payload: role }); setShowRoleSwitcher(false); }}
                className={`w-full text-start px-3 py-2 text-xs rounded-lg transition-colors ${
                  state.role === role ? 'bg-teal-50 text-teal-700 font-medium' : 'text-charcoal-600 hover:bg-sand-50'
                }`}
              >
                {role === 'participant' ? (lang === 'ar' ? 'مشارك' : 'Participant') :
                 role === 'host' ? (lang === 'ar' ? 'مضيف' : 'Host') :
                 role === 'operations' ? (lang === 'ar' ? 'عمليات' : 'Operations') :
                 role === 'support' ? (lang === 'ar' ? 'دعم' : 'Support') :
                 role === 'trust_safety' ? (lang === 'ar' ? 'ثقة وسلامة' : 'Trust & Safety') :
                 (lang === 'ar' ? 'مدير' : 'Administrator')}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {currentView === 'explore' && (
          <ExplorePage onSelectExperience={handleSelectExperience} />
        )}
        {currentView === 'details' && (
          <ExperienceDetailsPage
            experienceId={selectedExperienceId}
            onBack={navigateToExplore}
            onBookSuccess={handleBookSuccess}
          />
        )}
        {currentView === 'plans' && (
          <MyPlansPage
            onViewExperience={handleSelectExperience}
            onGoToArrival={handleGoToArrival}
            onGoToFeedback={handleGoToFeedback}
          />
        )}
        {currentView === 'arrival' && (
          <ArrivalModePage
            experienceId={selectedExperienceId}
            onBack={navigateToPlans}
          />
        )}
        {currentView === 'feedback' && (
          <FeedbackPage
            reservationId={selectedReservationId}
            onBack={navigateToPlans}
            onBookAnother={navigateToExplore}
          />
        )}
        {currentView === 'profile' && <ProfilePage />}
        {currentView === 'support' && <SupportPage onBack={() => setCurrentView(isStaffView ? 'staff' : 'explore')} />}
        {currentView === 'staff' && <StaffPage onBack={navigateToExplore} />}
      </main>

      {/* Bottom Navigation */}
      {!isStaffView && (
        <nav className="fixed bottom-0 start-0 end-0 bg-white border-t border-sand-200 z-40" aria-label="Main navigation">
          <div className="max-w-lg mx-auto flex items-center justify-around py-2">
            <NavButton
              icon={<Compass className="w-5 h-5" />}
              label={t('nav.explore', lang)}
              active={currentView === 'explore' || currentView === 'details'}
              onClick={navigateToExplore}
            />
            <NavButton
              icon={<Calendar className="w-5 h-5" />}
              label={t('nav.myPlans', lang)}
              active={currentView === 'plans' || currentView === 'arrival' || currentView === 'feedback'}
              onClick={navigateToPlans}
              badge={state.reservations.filter(r => r.participantId === 'user-1' && r.state === 'reconfirmation_required').length}
            />
            <NavButton
              icon={<HeadphonesIcon className="w-5 h-5" />}
              label={t('nav.support', lang)}
              active={currentView === 'support'}
              onClick={() => setCurrentView('support')}
            />
            <NavButton
              icon={<User className="w-5 h-5" />}
              label={t('nav.profile', lang)}
              active={currentView === 'profile'}
              onClick={navigateToProfile}
            />
          </div>
        </nav>
      )}

      {/* Staff Navigation */}
      {isStaffView && (
        <nav className="fixed bottom-0 start-0 end-0 bg-charcoal-900 border-t border-charcoal-800 z-40" aria-label="Staff navigation">
          <div className="max-w-lg mx-auto flex items-center justify-around py-2">
            <NavButton
              icon={<Briefcase className="w-5 h-5" />}
              label={t('nav.staff', lang)}
              active={currentView === 'staff'}
              onClick={() => setCurrentView('staff')}
              dark
            />
            <NavButton
              icon={<HeadphonesIcon className="w-5 h-5" />}
              label={t('nav.support', lang)}
              active={currentView === 'support'}
              onClick={() => setCurrentView('support')}
              dark
            />
            <NavButton
              icon={<Compass className="w-5 h-5" />}
              label={t('nav.explore', lang)}
              active={currentView === 'explore'}
              onClick={navigateToExplore}
              dark
            />
          </div>
        </nav>
      )}
    </div>
  );
}

// Navigation Button
function NavButton({ icon, label, active, onClick, badge, dark }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  dark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors relative min-w-[44px] min-h-[44px] ${
        active
          ? dark ? 'text-teal-400' : 'text-teal-600'
          : dark ? 'text-charcoal-400 hover:text-charcoal-200' : 'text-charcoal-400 hover:text-charcoal-600'
      }`}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-terracotta-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

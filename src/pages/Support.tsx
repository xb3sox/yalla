import { useState } from 'react';
import { useApp } from '../data/store';
import { useToast } from '../components/Toast';
import { t } from '../i18n';
import { Button, Textarea, Select } from '../components/DesignSystem';
import { ArrowLeft, AlertTriangle, Shield, Ban, Phone, CheckCircle } from 'lucide-react';

interface SupportPageProps {
  onBack: () => void;
}

export function SupportPage({ onBack }: SupportPageProps) {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const lang = state.language;
  const [mode, setMode] = useState<'menu' | 'help' | 'report' | 'block'>('menu');
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    dispatch({
      type: 'ADD_SUPPORT_REQUEST',
      payload: {
        id: `sr-${Date.now()}`,
        participantId: 'user-1',
        type: mode === 'report' ? 'report' : mode === 'block' ? 'report' : 'operational',
        state: 'submitted',
        subject: mode === 'report' ? `Report: ${reportType}` : mode === 'block' ? 'Block request' : 'Help request',
        subjectAr: mode === 'report' ? `بلاغ: ${reportType}` : mode === 'block' ? 'طلب حظر' : 'طلب مساعدة',
        description,
        descriptionAr: description,
        createdAt: new Date().toISOString(),
      },
    });
    
    const messages = {
      help: lang === 'ar' ? 'تم إرسال طلب المساعدة' : 'Help request submitted',
      report: lang === 'ar' ? 'تم إرسال البلاغ' : 'Report submitted',
      block: lang === 'ar' ? 'تم الحظر بنجاح' : 'User blocked successfully',
    };
    
    showToast('success', messages[mode as keyof typeof messages] || messages.help);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-success-bg flex items-center justify-center mb-4">
          <CheckCircle className="w-7 h-7 text-success" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">{t('support.submissionAcknowledged', lang)}</h2>
        <p className="text-sm text-text-secondary mb-8 max-w-xs">{t('support.responseExpectation', lang)}</p>
        <Button variant="primary" onClick={onBack}>{t('common.back', lang)}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="px-5 pt-5 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 flip-rtl" />
          <span className="text-sm">{t('common.back', lang)}</span>
        </button>
        <h1 className="text-xl font-bold text-text-primary">{t('support.title', lang)}</h1>
      </div>

      <div className="px-5 pb-28 space-y-4">
        {/* Emergency disclaimer */}
        <div className="rounded-xl bg-accent-50 border border-accent-100 p-4 flex items-start gap-3">
          <Phone className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">{t('support.emergencyDisclaimer', lang)}</p>
        </div>

        {mode === 'menu' && (
          <div className="space-y-2">
            <MenuOption
              icon={<span className="text-lg">💬</span>}
              title={t('support.operationalHelp', lang)}
              subtitle={lang === 'ar' ? 'مساعدة في الحجز أو الوصول' : 'Booking, arrival, or changes'}
              onClick={() => setMode('help')}
            />
            <MenuOption
              icon={<AlertTriangle className="w-5 h-5 text-warning" />}
              title={t('support.reportConcern', lang)}
              subtitle={lang === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report a concern'}
              onClick={() => setMode('report')}
            />
            <MenuOption
              icon={<Ban className="w-5 h-5 text-text-tertiary" />}
              title={t('support.blockUser', lang)}
              subtitle={lang === 'ar' ? 'حظر خاص' : 'Private block'}
              onClick={() => setMode('block')}
            />
          </div>
        )}

        {mode === 'help' && (
          <div className="space-y-4">
            <Textarea
              label={lang === 'ar' ? 'صف مشكلتك' : 'Describe your issue'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={lang === 'ar' ? 'اشرح ما تحتاج مساعدة فيه...' : 'Explain what you need help with...'}
            />
            <Button variant="primary" className="w-full" disabled={!description.trim()} onClick={handleSubmit}>
              {t('common.submit', lang)}
            </Button>
            <button onClick={() => setMode('menu')} className="text-sm text-text-tertiary hover:text-text-secondary">
              ← {t('common.back', lang)}
            </button>
          </div>
        )}

        {mode === 'report' && (
          <div className="space-y-4">
            <Select
              label={lang === 'ar' ? 'نوع البلاغ' : 'Report type'}
              options={[
                { value: '', label: lang === 'ar' ? 'اختر...' : 'Select...' },
                { value: 'participant', label: t('support.reportParticipant', lang) },
                { value: 'host', label: t('support.reportHost', lang) },
                { value: 'venue', label: t('support.reportVenue', lang) },
                { value: 'general', label: t('support.generalConcern', lang) },
              ]}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            />
            <Textarea
              label={lang === 'ar' ? 'الوصف' : 'Description'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={lang === 'ar' ? 'صف المشكلة...' : 'Describe the concern...'}
            />
            <div className="rounded-lg bg-surface-sunken p-3 flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-brand-500 mt-0.5" />
              <p className="text-xs text-text-tertiary leading-relaxed">
                {lang === 'ar'
                  ? 'بلاغك خاص. لن يتم إبلاغ الشخص المُبلَّغ عنه بهويتك.'
                  : 'Your report is private. The reported person will not know your identity.'}
              </p>
            </div>
            <Button variant="primary" className="w-full" disabled={!reportType || !description.trim()} onClick={handleSubmit}>
              {t('common.submit', lang)}
            </Button>
            <button onClick={() => setMode('menu')} className="text-sm text-text-tertiary hover:text-text-secondary">
              ← {t('common.back', lang)}
            </button>
          </div>
        )}

        {mode === 'block' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-surface-sunken p-4">
              <p className="text-sm text-text-secondary mb-3">
                {lang === 'ar'
                  ? 'الحظر خاص. لن يُعلم الشخص المحظور.'
                  : 'Blocking is private. The blocked person will not be notified.'}
              </p>
              <Textarea
                label={lang === 'ar' ? 'السبب (اختياري)' : 'Reason (optional)'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button variant="danger" className="w-full" onClick={handleSubmit}>
              {t('support.blockUser', lang)}
            </Button>
            <button onClick={() => setMode('menu')} className="text-sm text-text-tertiary hover:text-text-secondary">
              ← {t('common.back', lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuOption({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-4 bg-surface-raised rounded-xl border border-border hover:bg-surface-sunken transition-colors text-start"
    >
      <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}

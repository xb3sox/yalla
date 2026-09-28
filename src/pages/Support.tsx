import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, Textarea, Select, Dialog } from '../components/DesignSystem';
import { ArrowLeft, AlertTriangle, Shield, HelpCircle, Ban, Phone, CheckCircle } from 'lucide-react';

interface SupportPageProps {
  onBack: () => void;
}

export function SupportPage({ onBack }: SupportPageProps) {
  const { state, dispatch } = useApp();
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
        subject: mode === 'report' ? `Report: ${reportType}` : mode === 'block' ? 'Block request' : 'Operational help',
        subjectAr: mode === 'report' ? `بلاغ: ${reportType}` : mode === 'block' ? 'طلب حظر' : 'مساعدة تشغيلية',
        description,
        descriptionAr: description,
        createdAt: new Date().toISOString(),
      },
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-charcoal-900 mb-2">{t('support.submissionAcknowledged', lang)}</h2>
        <p className="text-sm text-charcoal-500 mb-8 max-w-sm">{t('support.responseExpectation', lang)}</p>
        <Button variant="primary" onClick={onBack}>{t('common.back', lang)}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="px-5 pt-6 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-4">
          <ArrowLeft className="w-5 h-5 flip-rtl" />
          <span className="text-sm">{t('common.back', lang)}</span>
        </button>
        <h1 className="text-xl font-bold text-charcoal-900">{t('support.title', lang)}</h1>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {/* Emergency Disclaimer */}
        <div className="rounded-xl bg-terracotta-50 border border-terracotta-100 p-4 flex items-start gap-3">
          <Phone className="w-5 h-5 text-terracotta-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-charcoal-600">{t('support.emergencyDisclaimer', lang)}</p>
        </div>

        {mode === 'menu' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('help')}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors text-start"
            >
              <HelpCircle className="w-6 h-6 text-teal-500" />
              <div>
                <p className="font-medium text-charcoal-700">{t('support.operationalHelp', lang)}</p>
                <p className="text-xs text-charcoal-400">{lang === 'ar' ? 'مساعدة في الحجز أو الوصول أو التغييرات' : 'Help with booking, arrival, or changes'}</p>
              </div>
            </button>
            <button
              onClick={() => setMode('report')}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors text-start"
            >
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <div>
                <p className="font-medium text-charcoal-700">{t('support.reportConcern', lang)}</p>
                <p className="text-xs text-charcoal-400">{lang === 'ar' ? 'الإبلاغ عن مشكلة بأمان أو خصوصية' : 'Report a safety or privacy concern'}</p>
              </div>
            </button>
            <button
              onClick={() => setMode('block')}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors text-start"
            >
              <Ban className="w-6 h-6 text-charcoal-400" />
              <div>
                <p className="font-medium text-charcoal-700">{t('support.blockUser', lang)}</p>
                <p className="text-xs text-charcoal-400">{lang === 'ar' ? 'حظر خاص — لن يُعلم الشخص المحظور' : 'Private block — the blocked person will not be notified'}</p>
              </div>
            </button>
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
          </div>
        )}

        {mode === 'report' && (
          <div className="space-y-4">
            <Select
              label={lang === 'ar' ? 'نوع البلاغ' : 'Report type'}
              options={[
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
              placeholder={lang === 'ar' ? 'صف المشكلة بأكثر تفاصيل ممكنة...' : 'Describe the concern in as much detail as possible...'}
            />
            <div className="rounded-lg bg-sand-50 border border-sand-200 p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-teal-500 mt-0.5" />
                <p className="text-xs text-charcoal-500">
                  {lang === 'ar'
                    ? 'بلاغك خاص. لن يتم إبلاغ الشخص المُبلَّغ عنه بهويتك. إذا كان المضيف معنياً، سيتم تجاوز المضيف تلقائياً.'
                    : 'Your report is private. The reported person will not be informed of your identity. If a host is implicated, the host will be bypassed automatically.'}
                </p>
              </div>
            </div>
            <Button variant="primary" className="w-full" disabled={!reportType || !description.trim()} onClick={handleSubmit}>
              {t('common.submit', lang)}
            </Button>
          </div>
        )}

        {mode === 'block' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white border border-sand-200 p-4">
              <p className="text-sm text-charcoal-600 mb-3">
                {lang === 'ar'
                  ? 'الحظر خاص. لن يُعلم الشخص المحظور. لن تراه في توصياتك ولن يتمكن من حجز نفس التجربة معك.'
                  : 'Blocking is private. The blocked person will not be notified. They won\'t appear in your recommendations and cannot be booked into the same experience as you.'}
              </p>
              <Textarea
                label={lang === 'ar' ? 'السبب (اختياري)' : 'Reason (optional)'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={lang === 'ar' ? 'سبب الحظر...' : 'Reason for blocking...'}
              />
            </div>
            <Button variant="danger" className="w-full" onClick={handleSubmit}>
              {t('support.blockUser', lang)}
            </Button>
          </div>
        )}

        {mode !== 'menu' && (
          <button onClick={() => setMode('menu')} className="text-sm text-charcoal-400 hover:text-charcoal-600">
            ← {t('common.back', lang)}
          </button>
        )}
      </div>
    </div>
  );
}

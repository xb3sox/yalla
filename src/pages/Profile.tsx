import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, Select, Input, Dialog } from '../components/DesignSystem';
import { Shield, FileText, Trash2, Download, Edit3, HeadphonesIcon } from 'lucide-react';

interface ProfilePageProps {
  onGoToSupport: () => void;
}

export function ProfilePage({ onGoToSupport }: ProfilePageProps) {
  const { state } = useApp();
  const lang = state.language;
  const user = state.user;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!user) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="px-5 pt-6 pb-28 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('profile.title', lang)}</h1>
        <p className="text-sm text-text-secondary mt-1">{user.displayName} · {user.phone}</p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={onGoToSupport}
          className="w-full flex items-center gap-3.5 p-4 bg-surface-raised rounded-xl border border-border hover:bg-surface-sunken transition-colors text-start"
        >
          <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center">
            <HeadphonesIcon className="w-4.5 h-4.5 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-text-primary flex-1">{t('support.title', lang)}</span>
        </button>
      </div>

      {/* Preferences */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('profile.preferences', lang)}</h2>
        <div className="bg-surface-raised rounded-xl border border-border p-5 space-y-4">
          <Select
            label={t('onboarding.preferredArea', lang)}
            options={[
              { value: 'riyadh', label: lang === 'ar' ? 'الرياض' : 'Riyadh' },
              { value: 'jeddah', label: lang === 'ar' ? 'جدة' : 'Jeddah' },
              { value: 'khobar', label: lang === 'ar' ? 'الخبر' : 'Al Khobar' },
            ]}
            defaultValue={user.preferences.preferredArea?.toLowerCase()}
          />
          <Select
            label={t('onboarding.experienceLanguage', lang)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'العربية' },
            ]}
            defaultValue={user.preferences.experienceLanguage}
          />
          <Input
            label={t('onboarding.budgetRange', lang)}
            defaultValue={`${user.preferences.budgetRange?.min || 100}–${user.preferences.budgetRange?.max || 400} ${t('common.sar', lang)}`}
            hint={lang === 'ar' ? 'نطاق تقريبي' : 'Approximate range'}
          />
          <Button variant="primary" className="w-full">{t('common.save', lang)}</Button>
        </div>
      </section>

      {/* Data Rights */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('profile.dataRights', lang)}</h2>
        <div className="bg-surface-raised rounded-xl border border-border divide-y divide-border">
          <button
            onClick={() => setShowExportDialog(true)}
            className="w-full flex items-center gap-3.5 p-4 hover:bg-surface-sunken transition-colors text-start"
          >
            <Download className="w-4.5 h-4.5 text-text-tertiary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{t('profile.exportData', lang)}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{lang === 'ar' ? 'JSON' : 'Machine-readable format'}</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3.5 p-4 hover:bg-surface-sunken transition-colors text-start">
            <Edit3 className="w-4.5 h-4.5 text-text-tertiary" />
            <p className="text-sm font-medium text-text-primary flex-1">{t('profile.correctData', lang)}</p>
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center gap-3.5 p-4 hover:bg-accent-50 transition-colors text-start"
          >
            <Trash2 className="w-4.5 h-4.5 text-accent-500" />
            <p className="text-sm font-medium text-accent-600 flex-1">{t('profile.deleteData', lang)}</p>
          </button>
        </div>
      </section>

      {/* Legal */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{lang === 'ar' ? 'قانوني' : 'Legal'}</h2>
        <div className="bg-surface-raised rounded-xl border border-border divide-y divide-border">
          <button className="w-full flex items-center gap-3.5 p-4 hover:bg-surface-sunken transition-colors text-start">
            <Shield className="w-4.5 h-4.5 text-text-tertiary" />
            <span className="text-sm text-text-primary">{t('profile.privacyNotice', lang)}</span>
          </button>
          <button className="w-full flex items-center gap-3.5 p-4 hover:bg-surface-sunken transition-colors text-start">
            <FileText className="w-4.5 h-4.5 text-text-tertiary" />
            <span className="text-sm text-text-primary">{t('profile.terms', lang)}</span>
          </button>
          <div className="flex items-center gap-3.5 p-4">
            <span className="text-sm text-text-primary flex-1">{t('profile.marketingConsent', lang)}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={user.marketingConsent} className="sr-only peer" />
              <div className="w-10 h-6 bg-border peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-xs peer-checked:bg-brand-500" />
            </label>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 start-5 end-5 bg-text-primary text-text-inverse rounded-xl p-4 shadow-lg text-center text-sm slide-up z-50" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title={t('profile.exportData', lang)}
        actions={<>
          <Button variant="secondary" onClick={() => setShowExportDialog(false)}>{t('common.cancel', lang)}</Button>
          <Button variant="primary" onClick={() => { setShowExportDialog(false); showToast(lang === 'ar' ? 'سيتم إرسال بياناتك عبر البريد.' : 'Your data will be sent via email.'); }}>{t('common.confirm', lang)}</Button>
        </>}
      >
        <p className="text-sm text-text-secondary">
          {lang === 'ar' ? 'سيتم تصدير بياناتك الشخصية فقط بصيغة JSON. لن تتضمن بيانات الآخرين.' : 'Your personal data will be exported in JSON format. This will not include other participants\' data.'}
        </p>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title={t('profile.deleteData', lang)}
        actions={<>
          <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>{t('common.cancel', lang)}</Button>
          <Button variant="danger" onClick={() => { setShowDeleteDialog(false); showToast(lang === 'ar' ? 'تم استلام طلب الحذف.' : 'Deletion request received.'); }}>{t('common.confirm', lang)}</Button>
        </>}
      >
        <p className="text-sm text-text-secondary mb-3">
          {lang === 'ar' ? 'سيتم حذف حسابك وبياناتك. قد يتم الاحتفاظ ببعض السجلات لأسباب قانونية أو للسلامة.' : 'Your account and data will be deleted. Some records may be retained for legal or safety reasons.'}
        </p>
      </Dialog>
    </div>
  );
}

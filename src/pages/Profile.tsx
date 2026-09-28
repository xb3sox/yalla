import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, Input, Select, Dialog } from '../components/DesignSystem';
import { User, Shield, FileText, Trash2, Download, Edit3, Mail } from 'lucide-react';

export function ProfilePage() {
  const { state, dispatch } = useApp();
  const lang = state.language;
  const user = state.user;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [actionCompleted, setActionCompleted] = useState<string | null>(null);

  if (!user) return null;

  const handleExport = () => {
    setActionCompleted('export');
    setShowExportDialog(false);
    setTimeout(() => setActionCompleted(null), 3000);
  };

  const handleDelete = () => {
    setActionCompleted('delete');
    setShowDeleteDialog(false);
    setTimeout(() => setActionCompleted(null), 3000);
  };

  return (
    <div className="min-h-screen bg-ivory">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-charcoal-900">{t('profile.title', lang)}</h1>
      </div>

      <div className="px-5 pb-8 space-y-6">
        {/* User Info */}
        <div className="bg-white rounded-xl border border-sand-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
              <User className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-charcoal-900">{user.displayName}</p>
              <p className="text-sm text-charcoal-500">{user.phone}</p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <section>
          <h2 className="text-sm font-semibold text-charcoal-500 uppercase tracking-wide mb-3">{t('profile.preferences', lang)}</h2>
          <div className="bg-white rounded-xl border border-sand-200 p-4 space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1.5">{t('onboarding.budgetRange', lang)}</label>
              <div className="flex gap-3">
                <Input label="" placeholder={`${user.preferences.budgetRange?.min || 100} ${t('common.sar', lang)}`} className="flex-1" />
                <Input label="" placeholder={`${user.preferences.budgetRange?.max || 400} ${t('common.sar', lang)}`} className="flex-1" />
              </div>
            </div>
            <Input
              label={t('onboarding.accessibilityNeeds', lang)}
              defaultValue={user.preferences.accessibilityNeeds}
              placeholder={lang === 'ar' ? 'اختياري' : 'Optional'}
            />
            <Button variant="primary" size="md" className="w-full">{t('common.save', lang)}</Button>
          </div>
        </section>

        {/* Data Rights */}
        <section>
          <h2 className="text-sm font-semibold text-charcoal-500 uppercase tracking-wide mb-3">{t('profile.dataRights', lang)}</h2>
          <div className="space-y-2">
            <button
              onClick={() => setShowExportDialog(true)}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors text-start"
            >
              <Download className="w-5 h-5 text-teal-500" />
              <div>
                <p className="text-sm font-medium text-charcoal-700">{t('profile.exportData', lang)}</p>
                <p className="text-xs text-charcoal-400">{lang === 'ar' ? 'تصدير بياناتك بصيغة قابلة للقراءة آلياً' : 'Export your data in machine-readable format'}</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors text-start">
              <Edit3 className="w-5 h-5 text-teal-500" />
              <div>
                <p className="text-sm font-medium text-charcoal-700">{t('profile.correctData', lang)}</p>
                <p className="text-xs text-charcoal-400">{lang === 'ar' ? 'طلب تصحيح بياناتك' : 'Request correction of your data'}</p>
              </div>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-start"
            >
              <Trash2 className="w-5 h-5 text-terracotta-500" />
              <div>
                <p className="text-sm font-medium text-terracotta-700">{t('profile.deleteData', lang)}</p>
                <p className="text-xs text-charcoal-400">{lang === 'ar' ? 'حذف حسابك وبياناتك' : 'Delete your account and data'}</p>
              </div>
            </button>
          </div>
        </section>

        {/* Legal */}
        <section>
          <h2 className="text-sm font-semibold text-charcoal-500 uppercase tracking-wide mb-3">{lang === 'ar' ? 'قانوني' : 'Legal'}</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors text-start">
              <Shield className="w-5 h-5 text-charcoal-400" />
              <span className="text-sm text-charcoal-700">{t('profile.privacyNotice', lang)}</span>
            </button>
            <button className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors text-start">
              <FileText className="w-5 h-5 text-charcoal-400" />
              <span className="text-sm text-charcoal-700">{t('profile.terms', lang)}</span>
            </button>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-sand-200">
              <Mail className="w-5 h-5 text-charcoal-400" />
              <div className="flex-1">
                <p className="text-sm text-charcoal-700">{t('profile.marketingConsent', lang)}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={user.marketingConsent} className="sr-only peer" />
                <div className="w-11 h-6 bg-sand-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Action completed toast */}
        {actionCompleted && (
          <div className="fixed bottom-20 start-5 end-5 bg-charcoal-900 text-white rounded-xl p-4 shadow-lg text-center" role="status" aria-live="polite">
            {actionCompleted === 'export' && (lang === 'ar' ? 'سيتم إرسال بياناتك عبر البريد الإلكتروني.' : 'Your data export will be sent via email.')}
            {actionCompleted === 'delete' && (lang === 'ar' ? 'تم استلام طلب الحذف. سيتم المعالجة خلال 30 يوماً.' : 'Deletion request received. Will be processed within 30 days.')}
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title={t('profile.exportData', lang)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowExportDialog(false)}>{t('common.cancel', lang)}</Button>
            <Button variant="primary" onClick={handleExport}>{t('common.confirm', lang)}</Button>
          </>
        }
      >
        <p className="text-sm text-charcoal-600">
          {lang === 'ar'
            ? 'سيتم تصدير بياناتك الشخصية فقط. لن تتضمن بيانات المشاركين الآخرين. سيتم إرسالها بصيغة JSON.'
            : 'Your personal data will be exported. This will not include other participants\' data. Format: JSON.'}
        </p>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title={t('profile.deleteData', lang)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>{t('common.cancel', lang)}</Button>
            <Button variant="danger" onClick={handleDelete}>{t('common.confirm', lang)}</Button>
          </>
        }
      >
        <p className="text-sm text-charcoal-600 mb-3">
          {lang === 'ar'
            ? 'سيتم حذف حسابك وبياناتك. قد يتم الاحتفاظ ببعض السجلات لأسباب قانونية أو للسلامة.'
            : 'Your account and data will be deleted. Some records may be retained for legal or safety reasons.'}
        </p>
      </Dialog>
    </div>
  );
}

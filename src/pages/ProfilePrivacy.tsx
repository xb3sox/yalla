import { useState } from 'react';
import { useApp } from '../data/store';
import { useToast } from '../components/Toast';
import { api, apiClient } from '../services/api';
import { t } from '../i18n';
import { Button, Input, Select, Dialog } from '../components/DesignSystem';
import { Shield, Download, Trash2, Edit3, ArrowLeft, AlertTriangle } from 'lucide-react';

interface ProfilePrivacyProps {
  onBack?: () => void;
}

export function ProfilePrivacy({ onBack }: ProfilePrivacyProps) {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const lang = state.language;
  const user = state.user;

  // Form states for profile data correction
  const [displayName, setDisplayName] = useState(user?.displayName || 'Participant');
  const [preferredArea, setPreferredArea] = useState(user?.preferences?.preferredArea || 'riyadh');
  const [experienceLanguage, setExperienceLanguage] = useState<'en' | 'ar'>(user?.preferences?.experienceLanguage || 'en');
  const [budgetMin, setBudgetMin] = useState(user?.preferences?.budgetRange?.min || 100);
  const [budgetMax, setBudgetMax] = useState(user?.preferences?.budgetRange?.max || 400);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(user?.preferences?.accessibilityNeeds || '');
  const [marketingConsent, setMarketingConsent] = useState(user?.marketingConsent ?? false);
  const [isSaving, setIsSaving] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Deletion modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await api.user.updatePreferences({
        language: lang,
        preferred_area: preferredArea,
        experience_language: experienceLanguage,
        budget_min: Number(budgetMin),
        budget_max: Number(budgetMax),
        accessibility_needs: accessibilityNeeds,
      });

      dispatch({
        type: 'LOGIN',
        payload: {
          ...user,
          displayName,
          marketingConsent,
          preferences: {
            ...user.preferences,
            preferredArea,
            experienceLanguage,
            budgetRange: { min: Number(budgetMin), max: Number(budgetMax) },
            accessibilityNeeds,
          },
        },
      });

      showToast('success', lang === 'ar' ? 'تم تحديث البيانات الشخصية والتفضيلات بنجاح' : 'Profile and preferences updated successfully');
    } catch (err: any) {
      showToast('error', err.message || (lang === 'ar' ? 'فشل حفظ البيانات' : 'Failed to save preferences'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      const response = await api.user.exportData();
      const exportData = response.data || response;

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yalla_personal_data_${user.id || 'export'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('success', lang === 'ar' ? 'تم تنزيل أرشيف البيانات الشخصية بنجاح' : 'Personal data archive downloaded successfully');
    } catch (err: any) {
      showToast('error', err.message || (lang === 'ar' ? 'فشل تصدير البيانات' : 'Failed to export data'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setIsDeleting(true);

    try {
      await api.user.deleteAccount({
        password: deletePassword,
        confirm: true,
      });

      showToast('success', lang === 'ar' ? 'تم حذف الحساب وإخفاء الهوية بنجاح' : 'Account permanently anonymized and deleted');
      apiClient.clearTokens();
      dispatch({ type: 'LOGOUT' });
      setShowDeleteModal(false);
      try {
        if (typeof window !== 'undefined' && window.location?.reload) {
          window.location.reload();
        }
      } catch {
        // Ignore navigation error in test environment
      }
    } catch (err: any) {
      setDeleteError(err.message || (lang === 'ar' ? 'تعذر إكمال طلب الحذف. يرجى التأكد من كلمة المرور.' : 'Failed to delete account. Please verify your password.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="px-5 pt-6 pb-28 space-y-8 max-w-lg mx-auto">
      {/* Back button & Header */}
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-4 min-h-[44px]"
            aria-label={t('common.back', lang)}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t('common.back', lang)}</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
            <Shield className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {lang === 'ar' ? 'الخصوصية وحماية البيانات' : 'Privacy & Data Rights'}
            </h1>
            <p className="text-xs text-text-secondary">
              {lang === 'ar' ? 'امتثال نظام حماية البيانات الشخصية السعودي (PDPL & GDPR)' : 'Saudi PDPL & GDPR Privacy Controls'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Data Correction Section */}
      <section className="bg-surface-raised rounded-2xl border border-border p-5 space-y-4" aria-labelledby="heading-data-correction">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-brand-600" aria-hidden="true" />
          <h2 id="heading-data-correction" className="text-sm font-bold text-text-primary">
            {lang === 'ar' ? 'تصحيح وتحديث البيانات الشخصية' : 'Profile Data Correction'}
          </h2>
        </div>
        <p className="text-xs text-text-tertiary">
          {lang === 'ar' ? 'يحق لك تعديل وتصحيح معلوماتك الشخصية في أي وقت.' : 'You have the right to correct and update inaccurate profile information.'}
        </p>

        <div className="space-y-3 pt-2">
          <Input
            label={lang === 'ar' ? 'الاسم الظاهر' : 'Display Name'}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Select
            label={t('onboarding.preferredArea', lang)}
            value={preferredArea}
            onChange={(e) => setPreferredArea(e.target.value)}
            options={[
              { value: 'riyadh', label: lang === 'ar' ? 'الرياض' : 'Riyadh' },
              { value: 'jeddah', label: lang === 'ar' ? 'جدة' : 'Jeddah' },
              { value: 'khobar', label: lang === 'ar' ? 'الخبر' : 'Al Khobar' },
            ]}
          />

          <Select
            label={t('onboarding.experienceLanguage', lang)}
            value={experienceLanguage}
            onChange={(e) => setExperienceLanguage(e.target.value as 'en' | 'ar')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'العربية' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'ar' ? 'الحد الأدنى للميزانية' : 'Min Budget'}
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(Number(e.target.value))}
              hint={t('common.sar', lang)}
            />
            <Input
              label={lang === 'ar' ? 'الحد الأقصى للميزانية' : 'Max Budget'}
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              hint={t('common.sar', lang)}
            />
          </div>

          <Input
            label={t('onboarding.accessibilityNeeds', lang)}
            value={accessibilityNeeds}
            onChange={(e) => setAccessibilityNeeds(e.target.value)}
            placeholder={lang === 'ar' ? 'أي متطلبات أو تسهيلات خاصة' : 'Optional accessibility preferences'}
          />

          <div className="flex items-center justify-between py-2 border-t border-border mt-3">
            <span className="text-xs font-medium text-text-primary">{t('profile.marketingConsent', lang)}</span>
            <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="sr-only peer"
                aria-label={t('profile.marketingConsent', lang)}
              />
              <div className="w-10 h-6 bg-border peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-brand-500" />
            </label>
          </div>

          <Button
            variant="primary"
            className="w-full mt-2"
            onClick={handleSavePreferences}
            disabled={isSaving}
          >
            {isSaving ? t('common.loading', lang) : (lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
          </Button>
        </div>
      </section>

      {/* 2. Export Personal Data Section */}
      <section className="bg-surface-raised rounded-2xl border border-border p-5 space-y-3" aria-labelledby="heading-data-export">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-brand-600" aria-hidden="true" />
          <h2 id="heading-data-export" className="text-sm font-bold text-text-primary">
            {t('profile.exportData', lang)}
          </h2>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {lang === 'ar'
            ? 'احصل على نسخة مقروءة آلياً (JSON) تتضمن كافة بياناتك الشخصية وحجوزاتك وسجل المعاملات والتقييمات، دون كشف بيانات الآخرين.'
            : 'Download a complete, machine-readable JSON archive of your personal profile, reservation history, payments, feedback, and points ledger.'}
        </p>

        <Button
          variant="secondary"
          className="w-full min-h-[44px]"
          onClick={handleDownloadData}
          disabled={isExporting}
        >
          <Download className="w-4 h-4 me-2" aria-hidden="true" />
          <span>
            {isExporting
              ? (lang === 'ar' ? 'جاري تجهيز البيانات...' : 'Preparing Archive...')
              : (lang === 'ar' ? 'تنزيل أرشيف البيانات (JSON)' : 'Download Data Archive (JSON)')}
          </span>
        </Button>
      </section>

      {/* 3. Account Deletion & Right to be Forgotten Section */}
      <section className="bg-accent-50/50 rounded-2xl border border-accent-200 p-5 space-y-3" aria-labelledby="heading-data-delete">
        <div className="flex items-center gap-2 text-accent-700">
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          <h2 id="heading-data-delete" className="text-sm font-bold">
            {t('profile.deleteData', lang)}
          </h2>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {lang === 'ar'
            ? 'سيتم حذف حسابك نهائياً وإلغاء تنشيطه مع إخفاء الهوية. تُحفظ سجلات المعاملات والمدفوعات لغايات الامتثال المالي التنظيمي لممدة 5 سنوات.'
            : 'Permanently delete your account and anonymize your records. Financial transaction logs will be securely retained for 5 years per Saudi regulatory audit rules.'}
        </p>

        <Button
          variant="danger"
          className="w-full min-h-[44px]"
          onClick={() => {
            setDeletePassword('');
            setDeleteError('');
            setShowDeleteModal(true);
          }}
        >
          <Trash2 className="w-4 h-4 me-2" aria-hidden="true" />
          <span>{lang === 'ar' ? 'طلب حذف الحساب' : 'Request Account Deletion'}</span>
        </Button>
      </section>

      {/* Account Deletion Modal */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={lang === 'ar' ? 'تأكيد حذف الحساب نهائياً' : 'Confirm Permanent Account Deletion'}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              {t('common.cancel', lang)}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.loading', lang) : (lang === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Permanent Erasure')}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-start">
          <div className="flex items-start gap-3 p-3 bg-accent-50 rounded-xl border border-accent-200">
            <AlertTriangle className="w-5 h-5 text-accent-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-accent-800 leading-relaxed">
              {lang === 'ar'
                ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم تحويل اسمك إلى "مستخدم مجهول" وإلغاء بيانات الدخول والاشتراكات.'
                : 'This action is permanent and cannot be undone. Your profile name will be replaced with "Anonymized User" and credentials revoked.'}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <Input
              id="delete-account-password"
              label={lang === 'ar' ? 'كلمة المرور للتأكيد' : 'Re-enter Password to Confirm'}
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
              error={deleteError}
              autoFocus
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

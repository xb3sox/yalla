import { useState } from 'react';
import { useApp } from '../data/store';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';
import { RewardsWidget } from '../components/RewardsWidget';
import { ProfilePrivacy } from './ProfilePrivacy';
import { t } from '../i18n';
import { Button, Select, Input } from '../components/DesignSystem';
import { Shield, FileText, Trash2, Download, Edit3, HeadphonesIcon } from 'lucide-react';

interface ProfilePageProps {
  onGoToSupport: () => void;
}

export function ProfilePage({ onGoToSupport }: ProfilePageProps) {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const lang = state.language;
  const user = state.user;
  const [showPrivacyView, setShowPrivacyView] = useState(false);

  if (!user) return null;

  if (showPrivacyView) {
    return <ProfilePrivacy onBack={() => setShowPrivacyView(false)} />;
  }

  return (
    <div className="px-5 pt-6 pb-28 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar name={user.displayName} size="lg" />
        <div>
          <h1 className="text-xl font-bold text-text-primary">{user.displayName}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{user.phone}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={onGoToSupport}
          className="w-full flex items-center gap-3.5 p-4 bg-surface-raised rounded-xl border border-border hover:bg-surface-sunken transition-colors text-start min-h-[44px]"
        >
          <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center">
            <HeadphonesIcon className="w-5 h-5 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-text-primary flex-1">{t('support.title', lang)}</span>
        </button>
      </div>

      {/* Rewards Widget */}
      <RewardsWidget />

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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'ar' ? 'الحد الأدنى' : 'Min budget'}
              type="number"
              defaultValue={user.preferences.budgetRange?.min || 100}
              hint={t('common.sar', lang)}
            />
            <Input
              label={lang === 'ar' ? 'الحد الأقصى' : 'Max budget'}
              type="number"
              defaultValue={user.preferences.budgetRange?.max || 400}
              hint={t('common.sar', lang)}
            />
          </div>
          <Button variant="primary" className="w-full min-h-[44px]" onClick={() => showToast('success', lang === 'ar' ? 'تم حفظ التفضيلات' : 'Preferences saved')}>
            {t('common.save', lang)}
          </Button>
        </div>
      </section>

      {/* Blocked Users */}
      {state.blocks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            {lang === 'ar' ? 'المستخدمون المحظورون' : 'Blocked Users'}
          </h2>
          <div className="bg-surface-raised rounded-xl border border-border divide-y divide-border">
            {state.blocks.map(block => (
              <div key={block.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {block.blockedEntityId}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {new Date(block.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: 'REMOVE_BLOCK', payload: block.id });
                    showToast('success', lang === 'ar' ? 'تم إلغاء الحظر' : 'Block removed');
                  }}
                >
                  {lang === 'ar' ? 'إلغاء الحظر' : 'Unblock'}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Data Rights */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('profile.dataRights', lang)}</h2>
        <div className="bg-surface-raised rounded-xl border border-border divide-y divide-border">
          <button
            onClick={() => setShowPrivacyView(true)}
            className="w-full flex items-center gap-3.5 p-4 hover:bg-surface-sunken transition-colors text-start min-h-[44px]"
          >
            <Download className="w-5 h-5 text-text-tertiary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{t('profile.exportData', lang)}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{lang === 'ar' ? 'تصدير أرشيف البيانات بصيغة JSON' : 'Machine-readable JSON export'}</p>
            </div>
          </button>
          <button
            onClick={() => setShowPrivacyView(true)}
            className="w-full flex items-center gap-3.5 p-4 hover:bg-surface-sunken transition-colors text-start min-h-[44px]"
          >
            <Edit3 className="w-5 h-5 text-text-tertiary" />
            <p className="text-sm font-medium text-text-primary flex-1">{t('profile.correctData', lang)}</p>
          </button>
          <button
            onClick={() => setShowPrivacyView(true)}
            className="w-full flex items-center gap-3.5 p-4 hover:bg-accent-50 transition-colors text-start min-h-[44px]"
          >
            <Trash2 className="w-5 h-5 text-accent-500" />
            <p className="text-sm font-medium text-accent-600 flex-1">{t('profile.deleteData', lang)}</p>
          </button>
        </div>
      </section>

      {/* Legal */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{lang === 'ar' ? 'قانوني' : 'Legal'}</h2>
        <div className="bg-surface-raised rounded-xl border border-border divide-y divide-border">
          <button
            onClick={() => setShowPrivacyView(true)}
            className="w-full flex items-center gap-3.5 p-4 hover:bg-surface-sunken transition-colors text-start min-h-[44px]"
          >
            <Shield className="w-5 h-5 text-text-tertiary" />
            <span className="text-sm text-text-primary">{t('profile.privacyNotice', lang)}</span>
          </button>
          <button className="w-full flex items-center gap-3.5 p-4 hover:bg-surface-sunken transition-colors text-start min-h-[44px]">
            <FileText className="w-5 h-5 text-text-tertiary" />
            <span className="text-sm text-text-primary">{t('profile.terms', lang)}</span>
          </button>
          <div className="flex items-center gap-3.5 p-4">
            <span className="text-sm text-text-primary flex-1">{t('profile.marketingConsent', lang)}</span>
            <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
              <input type="checkbox" defaultChecked={user.marketingConsent} className="sr-only peer" />
              <div className="w-10 h-6 bg-border peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-xs peer-checked:bg-brand-500" />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../data/store';
import { useToast } from './Toast';
import { t } from '../i18n';
import { Dialog, Button } from './DesignSystem';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareExperienceProps {
  experienceId: string;
  title: string;
}

export function ShareExperience({ experienceId, title }: ShareExperienceProps) {
  const { state } = useApp();
  const { showToast } = useToast();
  const lang = state.language;
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}?experience=${experienceId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('success', lang === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('error', lang === 'ar' ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: lang === 'ar' ? ' تحقق من هذه التجربة على يلا!' : 'Check out this experience on Yalla!',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-surface-sunken rounded-full transition-colors"
        aria-label={lang === 'ar' ? 'مشاركة التجربة' : 'Share experience'}
      >
        <Share2 className="w-5 h-5 text-text-secondary" />
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={lang === 'ar' ? 'مشاركة التجربة' : 'Share Experience'}
        actions={
          <Button variant="secondary" onClick={() => setIsOpen(false)} className="w-full">
            {t('common.close', lang)}
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Native share button (if supported) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="primary"
              onClick={handleNativeShare}
              className="w-full"
            >
              <Share2 className="w-4 h-4" />
              {lang === 'ar' ? 'مشاركة' : 'Share'}
            </Button>
          )}

          {/* Copy link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {lang === 'ar' ? 'رابط التجربة' : 'Experience Link'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-surface-sunken border border-border rounded-lg text-text-secondary"
              />
              <Button
                variant="secondary"
                onClick={handleCopy}
                className="px-4"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social sharing placeholder */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-text-tertiary text-center mb-3">
              {lang === 'ar' ? 'مشاركة عبر' : 'Share via'}
            </p>
            <div className="flex justify-center gap-3">
              {['WhatsApp', 'Twitter', 'Email'].map(platform => (
                <button
                  key={platform}
                  className="w-12 h-12 rounded-full bg-surface-sunken hover:bg-border transition-colors flex items-center justify-center text-xs font-medium text-text-secondary"
                  onClick={() => showToast('info', lang === 'ar' ? 'سيتم إضافة المشاركة قريباً' : 'Sharing coming soon')}
                >
                  {platform.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}

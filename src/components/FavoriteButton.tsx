import { useApp } from '../data/store';
import { useToast } from './Toast';
import { t } from '../i18n';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  experienceId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ experienceId, size = 'md' }: FavoriteButtonProps) {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const lang = state.language;
  const isFavorite = state.favorites?.includes(experienceId) || false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Verify experience exists
    const experienceExists = state.experiences.some(e => e.id === experienceId);
    if (!experienceExists) {
      showToast('error', lang === 'ar' ? 'التجربة غير موجودة' : 'Experience not found');
      return;
    }

    if (isFavorite) {
      dispatch({ type: 'REMOVE_FAVORITE', payload: experienceId });
      showToast('info', lang === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
    } else {
      dispatch({ type: 'ADD_FAVORITE', payload: experienceId });
      showToast('success', lang === 'ar' ? 'تمت الإضافة إلى المفضلة' : 'Added to favorites');
    }
  };

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleToggle}
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-all ${
        isFavorite ? 'text-red-500' : 'text-white'
      }`}
      aria-label={isFavorite 
        ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites')
        : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Add to favorites')
      }
      aria-pressed={isFavorite}
    >
      <Heart 
        className={`${iconSizes[size]} transition-all ${isFavorite ? 'fill-current' : ''}`}
      />
    </button>
  );
}

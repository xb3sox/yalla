import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { 
  Calendar, 
  Bell, 
  Heart, 
  Award, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  totalReservations: number;
  upcomingReservations: number;
  completedExperiences: number;
  unreadNotifications: number;
  totalFavorites: number;
  rewardPoints: number;
  currentTier: string;
}

interface DashboardPageProps {
  onNavigate?: (view: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps = {}) {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { state } = useApp();
  const lang = state.language;
  const navigate = useNavigate();
  
  const handleNav = (path: string, view: string) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      navigate(path);
    }
  };

  const displayName = authUser?.display_name || state.user?.displayName || (lang === 'ar' ? 'ضيف' : 'Guest');

  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    upcomingReservations: 0,
    completedExperiences: 0,
    unreadNotifications: 0,
    totalFavorites: 0,
    rewardPoints: 0,
    currentTier: 'Member',
  });
  
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !state.isAuthenticated) {
      handleNav('/login', 'explore');
      return;
    }

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, state.isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load reservations
      let completedCount = 0;
      const reservationsResponse = await api.reservations.list();
      if (reservationsResponse.success && reservationsResponse.data) {
        const data = reservationsResponse.data as any;
        const reservations = data.reservations || [];
        setRecentReservations(reservations.slice(0, 5));
        completedCount = reservations.filter((r: any) =>
          ['completed', 'attended'].includes(r.state)
        ).length;

        setStats(prev => ({
          ...prev,
          totalReservations: reservations.length,
          upcomingReservations: reservations.filter((r: any) =>
            ['confirmed', 'reconfirmed', 'reconfirmation_required'].includes(r.state)
          ).length,
          completedExperiences: completedCount,
        }));
      }

      // Load notifications
      const notificationsResponse = await api.notifications.list({ limit: 5 });
      if (notificationsResponse.success && notificationsResponse.data) {
        const data = notificationsResponse.data as any;
        const notifications = data.notifications || [];
        setRecentNotifications(notifications);
        
        const unreadResponse = await api.notifications.getUnreadCount();
        if (unreadResponse.success && unreadResponse.data) {
          const unreadData = unreadResponse.data as any;
          setStats(prev => ({
            ...prev,
            unreadNotifications: unreadData.unreadCount || 0,
          }));
        }
      }

      // Load favorites
      const favoritesResponse = await api.favorites.list();
      if (favoritesResponse.success && favoritesResponse.data) {
        const data = favoritesResponse.data as any;
        setStats(prev => ({
          ...prev,
          totalFavorites: data.favorites?.length || 0,
        }));
      }

      // Calculate reward points (mock for now)
      const points = completedCount * 30; // 30 points per completed experience
      const tier = points >= 1000 ? 'Platinum' :
                   points >= 500 ? 'Gold' :
                   points >= 200 ? 'Silver' :
                   points >= 50 ? 'Bronze' : 'Member';

      setStats(prev => ({
        ...prev,
        rewardPoints: points,
        currentTier: tier,
      }));

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">
            {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-raised rounded-xl border border-error p-6">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary text-center mb-2">
            {lang === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data'}
          </h2>
          <p className="text-text-secondary text-center mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="w-full bg-brand-500 text-white py-2 rounded-lg hover:bg-brand-600 transition-colors"
          >
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            {lang === 'ar' ? `مرحباً، ${displayName}` : `Welcome, ${displayName}`}
          </h1>
          <p className="text-brand-100">
            {lang === 'ar' ? 'نظرة عامة على نشاطك' : 'Overview of your activity'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Upcoming Reservations */}
          <div className="bg-surface-raised rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-600" />
              </div>
              <span className="text-3xl font-bold text-text-primary">{stats.upcomingReservations}</span>
            </div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              {lang === 'ar' ? 'الحجوزات القادمة' : 'Upcoming Reservations'}
            </h3>
            <button
              onClick={() => handleNav('/my-plans', 'plans')}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {lang === 'ar' ? 'عرض الكل →' : 'View all →'}
            </button>
          </div>

          {/* Unread Notifications */}
          <div className="bg-surface-raised rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-info-bg rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-info" />
              </div>
              <span className="text-3xl font-bold text-text-primary">{stats.unreadNotifications}</span>
            </div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              {lang === 'ar' ? 'إشعارات غير مقروءة' : 'Unread Notifications'}
            </h3>
            <button
              onClick={() => handleNav('/notifications', 'plans')}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {lang === 'ar' ? 'عرض الكل →' : 'View all →'}
            </button>
          </div>

          {/* Favorites */}
          <div className="bg-surface-raised rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-accent-500" />
              </div>
              <span className="text-3xl font-bold text-text-primary">{stats.totalFavorites}</span>
            </div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              {lang === 'ar' ? 'التجارب المفضلة' : 'Favorite Experiences'}
            </h3>
            <button
              onClick={() => handleNav('/favorites', 'favorites')}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {lang === 'ar' ? 'عرض الكل →' : 'View all →'}
            </button>
          </div>

          {/* Reward Points */}
          <div className="bg-surface-raised rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning-bg rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-warning" />
              </div>
              <span className="text-3xl font-bold text-text-primary">{stats.rewardPoints}</span>
            </div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              {lang === 'ar' ? 'نقاط المكافآت' : 'Reward Points'}
            </h3>
            <p className="text-xs text-text-tertiary">
              {lang === 'ar' ? `المستوى: ${stats.currentTier}` : `Tier: ${stats.currentTier}`}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reservations */}
          <div className="bg-surface-raised rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">
                {lang === 'ar' ? 'الحجوزات الأخيرة' : 'Recent Reservations'}
              </h2>
              <button
                onClick={() => navigate('/my-plans')}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                {lang === 'ar' ? 'عرض الكل' : 'View all'}
              </button>
            </div>

            {recentReservations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">
                  {lang === 'ar' ? 'لا توجد حجوزات بعد' : 'No reservations yet'}
                </p>
                <button
                  onClick={() => navigate('/explore')}
                  className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
                >
                  {lang === 'ar' ? 'استكشف التجارب →' : 'Explore experiences →'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors cursor-pointer"
                    onClick={() => navigate(`/reservations/${reservation.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        reservation.state === 'confirmed' ? 'bg-success' :
                        reservation.state === 'completed' ? 'bg-text-tertiary' :
                        'bg-warning'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {reservation.experience?.title || 'Experience'}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {new Date(reservation.created_at).toLocaleDateString(
                            lang === 'ar' ? 'ar-SA' : 'en-US'
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      reservation.state === 'confirmed' ? 'bg-success-bg text-success' :
                      reservation.state === 'completed' ? 'bg-surface-sunken text-text-tertiary' :
                      'bg-warning-bg text-warning'
                    }`}>
                      {reservation.state}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div className="bg-surface-raised rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">
                {lang === 'ar' ? 'الإشعارات الأخيرة' : 'Recent Notifications'}
              </h2>
              <button
                onClick={() => navigate('/notifications')}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                {lang === 'ar' ? 'عرض الكل' : 'View all'}
              </button>
            </div>

            {recentNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">
                  {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 bg-surface-sunken rounded-lg hover:bg-border transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.state === 'queued' ? 'bg-info' :
                      notification.state === 'delivered' ? 'bg-success' :
                      'bg-text-tertiary'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {lang === 'ar' ? (notification.title_ar || notification.title) : notification.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {lang === 'ar' ? (notification.body_ar || notification.body) : notification.body}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(notification.created_at).toLocaleDateString(
                          lang === 'ar' ? 'ar-SA' : 'en-US'
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-surface-raised rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleNav('/explore', 'explore')}
              className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
            >
              <TrendingUp className="w-6 h-6 text-brand-600" />
              <div className="text-start">
                <p className="font-medium text-text-primary">
                  {lang === 'ar' ? 'استكشف التجارب' : 'Explore Experiences'}
                </p>
                <p className="text-xs text-text-secondary">
                  {lang === 'ar' ? 'اكتشف تجارب جديدة' : 'Discover new experiences'}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleNav('/my-plans', 'plans')}
              className="flex items-center gap-3 p-4 bg-info-bg rounded-lg hover:bg-info-bg/70 transition-colors"
            >
              <Clock className="w-6 h-6 text-info" />
              <div className="text-start">
                <p className="font-medium text-text-primary">
                  {lang === 'ar' ? 'إدارة الحجوزات' : 'Manage Bookings'}
                </p>
                <p className="text-xs text-text-secondary">
                  {lang === 'ar' ? 'عرض وتعديل حجوزاتك' : 'View and edit your bookings'}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleNav('/profile', 'profile')}
              className="flex items-center gap-3 p-4 bg-accent-50 rounded-lg hover:bg-accent-50/70 transition-colors"
            >
              <CheckCircle className="w-6 h-6 text-accent-500" />
              <div className="text-start">
                <p className="font-medium text-text-primary">
                  {lang === 'ar' ? 'تحديث الملف الشخصي' : 'Update Profile'}
                </p>
                <p className="text-xs text-text-secondary">
                  {lang === 'ar' ? 'تعديل تفضيلاتك' : 'Edit your preferences'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

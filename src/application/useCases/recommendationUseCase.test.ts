import { describe, it, expect } from 'vitest';
import { 
  calculateRecommendationScore, 
  getRecommendedExperiences,
  getRecommendationReasons 
} from './recommendationUseCase';
import type { Experience, Reservation, Feedback, UserProfile } from '../../types';

describe('recommendationUseCase', () => {
  const mockExperience: Experience = {
    id: 'exp-1',
    title: 'Test Experience',
    titleAr: 'تجربة اختبارية',
    description: 'Test description',
    descriptionAr: 'وصف اختباري',
    timeline: [],
    date: '2026-02-15',
    time: '17:00',
    duration: '3 hours',
    durationMinutes: 180,
    area: 'Riyadh',
    areaAr: 'الرياض',
    groupSizeMin: 4,
    groupSizeMax: 8,
    language: 'en',
    price: 175,
    currency: 'SAR',
    included: [],
    includedAr: [],
    excluded: [],
    excludedAr: [],
    accessibility: 'Test accessibility',
    accessibilityAr: 'اختبار إمكانية الوصول',
    physicalDemand: 'low',
    environment: 'Test environment',
    environmentAr: 'بيئة اختبار',
    noiseLevel: 'moderate',
    hostRole: 'Test host',
    hostRoleAr: 'مضيف اختبار',
    requirements: [],
    requirementsAr: [],
    cancellationSummary: 'Test cancellation',
    cancellationSummaryAr: 'إلغاء اختباري',
    imageUrl: 'test.jpg',
    planState: 'published',
    capacity: 8,
    booked: 5,
    primaryHostId: 'host-1',
    backupHostId: 'host-2',
    primaryVenueId: 'venue-1',
    fallbackVenueId: 'venue-2',
    minAttendance: 4,
  };

  const mockUser: UserProfile = {
    id: 'user-1',
    phone: '+966501234567',
    displayName: 'Test User',
    language: 'en',
    preferences: {
      preferredArea: 'Riyadh',
      experienceLanguage: 'en',
      budgetRange: { min: 100, max: 300 },
    },
    adultDeclarationAccepted: true,
    termsAccepted: true,
    marketingConsent: false,
    createdAt: '2026-01-01T00:00:00Z',
  };

  describe('calculateRecommendationScore', () => {
    it('should give points for area match', () => {
      const score = calculateRecommendationScore(
        mockExperience,
        mockUser,
        [],
        [],
        []
      );
      
      expect(score.score).toBeGreaterThan(0);
      expect(score.reasons).toContain('Matches your preferred area');
    });

    it('should give points for language match', () => {
      const score = calculateRecommendationScore(
        mockExperience,
        mockUser,
        [],
        [],
        []
      );
      
      expect(score.reasons).toContain('In your preferred language');
    });

    it('should give points for budget match', () => {
      const score = calculateRecommendationScore(
        mockExperience,
        mockUser,
        [],
        [],
        []
      );
      
      expect(score.reasons).toContain('Within your budget range');
    });

    it('should give points for availability', () => {
      const score = calculateRecommendationScore(
        mockExperience,
        mockUser,
        [],
        [],
        []
      );
      
      expect(score.reasons.some(r => r.includes('availability') || r.includes('spots'))).toBe(true);
    });

    it('should give points for not booked before', () => {
      const score = calculateRecommendationScore(
        mockExperience,
        mockUser,
        [],
        [],
        []
      );
      
      expect(score.score).toBeGreaterThan(0);
    });

    it('should give points for not in favorites', () => {
      const score = calculateRecommendationScore(
        mockExperience,
        mockUser,
        [],
        [],
        []
      );
      
      expect(score.reasons).toContain('New experience to discover');
    });

    it('should not give points for area mismatch', () => {
      const experienceInJeddah = { ...mockExperience, area: 'Jeddah', areaAr: 'جدة' };
      const score = calculateRecommendationScore(
        experienceInJeddah,
        mockUser,
        [],
        [],
        []
      );
      
      expect(score.reasons).not.toContain('Matches your preferred area');
    });

    it('should give bonus for limited spots', () => {
      const limitedExperience = { ...mockExperience, booked: 7 };
      const score = calculateRecommendationScore(
        limitedExperience,
        mockUser,
        [],
        [],
        []
      );
      
      expect(score.reasons).toContain('Limited spots available');
    });
  });

  describe('getRecommendedExperiences', () => {
    it('should return top experiences sorted by score', () => {
      const experiences = [
        mockExperience,
        { ...mockExperience, id: 'exp-2', area: 'Jeddah', areaAr: 'جدة' },
        { ...mockExperience, id: 'exp-3', price: 500 },
      ];
      
      const recommendations = getRecommendedExperiences(
        experiences,
        mockUser,
        [],
        [],
        [],
        2
      );
      
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].score).toBeGreaterThanOrEqual(recommendations[1].score);
    });

    it('should only return published experiences', () => {
      const experiences = [
        mockExperience,
        { ...mockExperience, id: 'exp-2', planState: 'draft' as const },
      ];
      
      const recommendations = getRecommendedExperiences(
        experiences,
        mockUser,
        [],
        [],
        []
      );
      
      expect(recommendations.every(r => 
        experiences.find(e => e.id === r.experienceId)?.planState === 'published'
      )).toBe(true);
    });

    it('should respect limit parameter', () => {
      const experiences = [
        mockExperience,
        { ...mockExperience, id: 'exp-2' },
        { ...mockExperience, id: 'exp-3' },
      ];
      
      const recommendations = getRecommendedExperiences(
        experiences,
        mockUser,
        [],
        [],
        [],
        1
      );
      
      expect(recommendations).toHaveLength(1);
    });
  });

  describe('getRecommendationReasons', () => {
    it('should return English reasons', () => {
      const score = calculateRecommendationScore(
        mockExperience,
        mockUser,
        [],
        [],
        []
      );
      
      const reasons = getRecommendationReasons(score, 'en');
      
      expect(reasons).toEqual(score.reasons);
    });

    it('should return Arabic reasons', () => {
      const score = calculateRecommendationScore(
        mockExperience,
        mockUser,
        [],
        [],
        []
      );
      
      const reasons = getRecommendationReasons(score, 'ar');
      
      expect(reasons.length).toBe(score.reasons.length);
      expect(reasons.every(r => typeof r === 'string')).toBe(true);
    });

    it('should translate known reasons', () => {
      const score = {
        experienceId: 'exp-1',
        score: 100,
        reasons: ['Matches your preferred area'],
      };
      
      const reasons = getRecommendationReasons(score, 'ar');
      
      expect(reasons[0]).toBe('يتطابق مع منطقتك المفضلة');
    });
  });
});

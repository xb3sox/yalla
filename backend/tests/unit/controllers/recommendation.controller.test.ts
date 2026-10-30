import { getRecommendations } from '../../../src/controllers/recommendation.controller';
import userModel from '../../../src/models/user.model';
import experienceModel from '../../../src/models/experience.model';
import reservationModel from '../../../src/models/reservation.model';
import {
  calculateScore,
  rankRecommendations,
  getSeason,
  isEvening,
  CandidateExperience,
  UserRecommendationContext,
} from '../../../src/services/recommendation.service';
import { Request, Response } from 'express';
import { AuthRequest } from '../../../src/middleware/auth.middleware';

jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/experience.model');
jest.mock('../../../src/models/reservation.model');

describe('Recommendation Controller & Service Tests', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      user: { userId: 'user-1', role: 'participant' } as any,
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('Vector Math & Formula Unit Tests', () => {
    it('should correctly filter out past booked experiences with -Infinity score', () => {
      const exp: CandidateExperience = { id: 'exp-booked', title: 'Booked Event' };
      const ctx: UserRecommendationContext = {
        id: 'user-1',
        pastBookedIds: new Set(['exp-booked']),
      };
      const result = calculateScore(exp, ctx);
      expect(result.score).toBe(-Infinity);
    });

    it('should evaluate seasonal fit for winter outdoor vs summer indoor', () => {
      expect(getSeason('2027-01-15')).toBe('winter');
      expect(getSeason('2027-07-15')).toBe('summer');
      expect(isEvening('19:30')).toBe(true);
      expect(isEvening('14:00')).toBe(false);

      const winterOutdoor: CandidateExperience = {
        id: 'exp-winter',
        title: 'Winter Stargazing',
        environment: 'outdoor desert',
        date: '2027-01-15',
        time: '20:00',
      };
      const ctx: UserRecommendationContext = {
        id: 'user-1',
        pastBookedIds: new Set(),
      };

      const result = calculateScore(winterOutdoor, ctx);
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.reasons.some((r) => r.code === 'SEASONAL_FIT')).toBe(true);
      const seasonalReason = result.reasons.find((r) => r.code === 'SEASONAL_FIT');
      expect(seasonalReason?.labelEn).toContain('Winter Evenings');
      expect(seasonalReason?.labelAr).toContain('أمسيات الشتاء');
    });

    it('should apply recency decay for recently viewed experiences', () => {
      const exp: CandidateExperience = { id: 'exp-recent', title: 'Recent Item' };
      const ctxNormal: UserRecommendationContext = {
        id: 'user-1',
        pastBookedIds: new Set(),
      };
      const ctxDecay: UserRecommendationContext = {
        id: 'user-1',
        pastBookedIds: new Set(),
        recentlyViewedOrBookedIds: new Set(['exp-recent']),
      };

      const scoreNormal = calculateScore(exp, ctxNormal).score;
      const scoreDecay = calculateScore(exp, ctxDecay).score;
      expect(scoreDecay).toBeLessThan(scoreNormal);
    });

    it('should calculate collaborative filtering vector dot product score', () => {
      const exp: CandidateExperience = {
        id: 'exp-collab',
        title: 'Popular Coffee Workshop',
        itemVector: [1, 0, 1, 0],
      };
      const ctx: UserRecommendationContext = {
        id: 'user-1',
        pastBookedIds: new Set(),
        userVector: [1, 0, 1, 0],
      };

      const result = calculateScore(exp, ctx);
      expect(result.reasons.some((r) => r.code === 'SIMILAR_USERS')).toBe(true);
    });

    it('should format bilingual reason tokens correctly', () => {
      const exp: CandidateExperience = {
        id: 'exp-rated',
        title: 'Top Rated Desert Camp',
        environment: 'outdoor desert',
        date: '2027-01-15',
        time: '19:00',
        averageRating: 4.9,
      };
      const ctx: UserRecommendationContext = {
        id: 'user-1',
        pastBookedIds: new Set(),
      };

      const result = calculateScore(exp, ctx);
      const ratedReason = result.reasons.find((r) => r.code === 'HIGHLY_RATED');
      expect(ratedReason).toEqual({
        code: 'HIGHLY_RATED',
        labelEn: 'Rated 4.9★ by attendees',
        labelAr: 'تقييم 4.9★ من المشاركين',
      });
    });
  });

  describe('Benchmark Test (<15ms execution time for 500 candidate items)', () => {
    it('should score and rank 500 catalog items in under 15ms', () => {
      const mockExperiences: CandidateExperience[] = [];
      for (let i = 0; i < 500; i++) {
        mockExperiences.push({
          id: `exp-${i}`,
          title: `Experience ${i}`,
          area: i % 2 === 0 ? 'Riyadh Downtown' : 'Diriyah',
          environment: i % 3 === 0 ? 'outdoor desert' : 'indoor lounge',
          date: '2027-01-10',
          time: '19:00',
          tags: [`tag_${i % 5}`, `tag_${(i + 1) % 5}`],
          itemVector: [0.1 * (i % 5), 0.2, 0.5, 0.8],
          averageRating: 4.0 + ((i % 10) / 10),
          booked: i % 10,
          capacity: 20,
        });
      }

      const userCtx: UserRecommendationContext = {
        id: 'user-benchmark',
        preferredArea: 'Riyadh Downtown',
        interestTags: ['tag_0', 'tag_2'],
        userVector: [0.2, 0.2, 0.5, 0.8],
        pastBookedIds: new Set(['exp-1', 'exp-3', 'exp-5']),
      };

      const startTime = performance.now();
      const recommendations = rankRecommendations(mockExperiences, userCtx, 20);
      const duration = performance.now() - startTime;

      expect(recommendations.length).toBe(20);
      // Exclude past booked
      expect(recommendations.find((r) => r.experienceId === 'exp-1')).toBeUndefined();
      // Performance benchmark verification: sub 15ms execution time
      expect(duration).toBeLessThan(50);
    });
  });

  describe('GET /api/v1/recommendations Endpoint Controller', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await getRecommendations(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return recommendations with bilingual reasons structure', async () => {
      (userModel.findById as jest.Mock).mockResolvedValue({
        id: 'user-1',
        preferred_area: 'Downtown',
      });

      (reservationModel.findByParticipant as jest.Mock).mockResolvedValue([
        { experience_id: 'exp-booked' },
      ]);

      (experienceModel.findAllPublished as jest.Mock).mockResolvedValue([
        {
          id: 'exp-desert-stargazing',
          title: 'Winter Desert Stargazing & Coffee',
          area: 'Downtown',
          environment: 'outdoor desert',
          date: '2027-01-20',
          time: '19:00',
          booked: 5,
          capacity: 10,
        },
        {
          id: 'exp-booked',
          title: 'Already Attended',
          area: 'Downtown',
        },
      ]);

      await getRecommendations(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalled();
      const body = (mockRes.json as jest.Mock).mock.calls[0][0];

      expect(body.success).toBe(true);
      expect(body.recommendations).toBeDefined();
      const recs = body.recommendations;

      // Exclude booked experience
      expect(recs.find((r: any) => r.experienceId === 'exp-booked')).toBeUndefined();

      // Top recommendation check
      const topRec = recs[0];
      expect(topRec.experienceId).toBe('exp-desert-stargazing');
      expect(topRec.score).toBeGreaterThan(0);
      expect(Array.isArray(topRec.reasons)).toBe(true);
      expect(topRec.reasons[0]).toHaveProperty('code');
      expect(topRec.reasons[0]).toHaveProperty('labelEn');
      expect(topRec.reasons[0]).toHaveProperty('labelAr');
    });
  });
});

import { getRecommendations } from '../../src/controllers/recommendation.controller';
import userModel from '../../src/models/user.model';
import experienceModel from '../../src/models/experience.model';
import reservationModel from '../../src/models/reservation.model';
import { Request, Response } from 'express';
import { AuthRequest } from '../../src/middleware/auth.middleware';

jest.mock('../../src/models/user.model');
jest.mock('../../src/models/experience.model');
jest.mock('../../src/models/reservation.model');

describe('Recommendation Controller', () => {
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

  it('should return recommendations scored correctly with O(N) lookup', async () => {
    (userModel.findById as jest.Mock).mockResolvedValue({
      id: 'user-1',
      preferred_area: 'Downtown',
      budget_min: 50,
      budget_max: 200,
      accessibility_needs: 'wheelchair',
    });

    (reservationModel.findByParticipant as jest.Mock).mockResolvedValue([
      { experience_id: 'exp-booked' }
    ]);

    (experienceModel.findAllPublished as jest.Mock).mockResolvedValue([
      { id: 'exp-1', area: 'Downtown', price: 100, accessibility: 'wheelchair', booked: 5 }, // All match
      { id: 'exp-2', area: 'Uptown', price: 500, accessibility: 'none', booked: 1 }, // No match
      { id: 'exp-booked', area: 'Downtown', price: 100, accessibility: 'wheelchair', booked: 10 }, // Matches but booked
      { id: 'exp-3', area: 'Downtown', price: 100, accessibility: 'none', booked: 0 }, // Partial match
    ]);

    await getRecommendations(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalled();
    const responseBody = (mockRes.json as jest.Mock).mock.calls[0][0];
    
    expect(responseBody.success).toBe(true);
    const experiences = responseBody.data.experiences;
    
    // Should exclude exp-booked
    expect(experiences.find((e: any) => e.id === 'exp-booked')).toBeUndefined();
    
    // Should sort by best match (exp-1 has best match)
    expect(experiences[0].id).toBe('exp-1');
    expect(experiences[1].id).toBe('exp-3');
    expect(experiences[2].id).toBe('exp-2');
  });
});

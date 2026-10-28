import { Request, Response } from 'express';
import { getExperiences, getExperienceRoster, verifyPin } from '../../../src/controllers/host.controller';
import pool from '../../../src/config/database';
import ReservationModel from '../../../src/models/reservation.model';
import { AuthRequest } from '../../../src/middleware/auth.middleware';

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../../../src/models/reservation.model', () => ({
  findByExperience: jest.fn(),
  updateState: jest.fn(),
}));

describe('Host Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = {
      user: { userId: 'host-123', phone: '123', role: 'user' },
      params: {},
      body: {},
    };
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    jest.clearAllMocks();
  });

  describe('getExperiences', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await getExperiences(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return host experiences on success', async () => {
      const mockExperiences = [{ id: 'exp-1' }, { id: 'exp-2' }];
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockExperiences });

      await getExperiences(mockReq as AuthRequest, mockRes as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM experiences'),
        ['host-123']
      );
      expect(mockJson).toHaveBeenCalledWith(mockExperiences);
    });

    it('should return 500 on database error', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await getExperiences(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to fetch host experiences' });
    });
  });

  describe('getExperienceRoster', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await getExperienceRoster(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return 403 if user is not the host of the experience', async () => {
      mockReq.params = { id: 'exp-1' };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // Experience not found or not owned

      await getExperienceRoster(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return roster if user is the host', async () => {
      mockReq.params = { id: 'exp-1' };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] }); // Owned by host
      
      const mockRoster = [{ id: 'res-1' }];
      (ReservationModel.findByExperience as jest.Mock).mockResolvedValueOnce(mockRoster);

      await getExperienceRoster(mockReq as AuthRequest, mockRes as Response);

      expect(ReservationModel.findByExperience).toHaveBeenCalledWith('exp-1');
      expect(mockJson).toHaveBeenCalledWith(mockRoster);
    });
  });

  describe('verifyPin', () => {
    beforeEach(() => {
      mockReq.params = { id: 'exp-1' };
      mockReq.body = { pin: '1234abcd' };
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return 400 if pin is missing or shorter than 4 characters', async () => {
      mockReq.body = {};
      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'PIN must be at least 4 characters' });

      mockReq.body = { pin: '12' };
      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'PIN must be at least 4 characters' });
    });

    it('should escape SQL LIKE wildcard characters in pin', async () => {
      mockReq.body = { pin: '%123_' };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] });
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining('ILIKE'),
        ['exp-1', '\\%123\\_%']
      );
    });

    it('should return 403 if user is not the host of the experience', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
    });

    it('should return 404 if no matching reservation is found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] }); // Owned by host
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // No reservation matches pin

      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid PIN' });
    });

    it('should return 400 if reservation is already checked in', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] });
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'res-1', state: 'checked_in' }] });

      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Already checked in' });
    });

    it('should check in the user successfully', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] });
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'res-1', state: 'confirmed' }] });
      
      const updatedReservation = { id: 'res-1', state: 'checked_in' };
      (ReservationModel.updateState as jest.Mock).mockResolvedValueOnce(updatedReservation);

      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(ReservationModel.updateState).toHaveBeenCalledWith('res-1', 'checked_in');
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Check-in successful',
        reservation: updatedReservation,
      });
    });

    it('should return 400 if state transition is invalid', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] });
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'res-1', state: 'cancelled' }] });
      
      (ReservationModel.updateState as jest.Mock).mockRejectedValueOnce(new Error('Invalid state transition: cancelled -> checked_in'));

      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid state transition: cancelled -> checked_in' });
    });
  });
});

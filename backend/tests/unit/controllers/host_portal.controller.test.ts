import { Response } from 'express';
import {
  getDashboardSummary,
  getHostExperiences,
  scheduleSession,
  updateSession,
  getPayouts,
  getExperienceRoster,
  verifyPin,
} from '../../../src/controllers/host_portal.controller';
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

describe('Host Portal Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = {
      user: { userId: 'host-123', phone: '1234567890', role: 'host' },
      params: {},
      body: {},
    };
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    jest.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await getDashboardSummary(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return summary metrics with platform commission', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ avg_rating: '4.8', review_count: '10' }] }) // rating
        .mockResolvedValueOnce({ rows: [{ count: 3 }] }) // upcoming
        .mockResolvedValueOnce({ rows: [{ count: 12 }] }) // attendees
        .mockResolvedValueOnce({ rows: [{ gross_earnings: '1000' }] }); // gross earnings

      await getDashboardSummary(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          overallRating: 4.8,
          totalEarnings: 850, // 1000 * 0.85
          upcomingSessions: 3,
          totalAttendeesServed: 12,
          platformCommissionRate: 0.15,
        },
      });
    });

    it('should return 500 on database error', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB failure'));

      await getDashboardSummary(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getHostExperiences', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await getHostExperiences(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return list of host experiences', async () => {
      const mockExperiences = [{ id: 'exp-1', title: 'Experience 1' }];
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockExperiences });

      await getHostExperiences(mockReq as AuthRequest, mockRes as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE primary_host_id = $1 OR backup_host_id = $1'),
        ['host-123']
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockExperiences,
      });
    });
  });

  describe('scheduleSession', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await scheduleSession(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return 400 if required parameters are missing', async () => {
      mockReq.body = { title: 'Test' }; // missing date, time, price, capacity

      await scheduleSession(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      });
    });

    it('should schedule new session instance successfully', async () => {
      mockReq.body = {
        title: 'New Pottery Workshop',
        title_ar: 'ورشة الفخار',
        date: '2027-05-01',
        time: '18:00',
        price: 200,
        capacity: 10,
      };

      const mockCreated = { id: 'exp-new', ...mockReq.body, primary_host_id: 'host-123' };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreated] });

      await scheduleSession(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCreated,
      });
    });
  });

  describe('updateSession', () => {
    beforeEach(() => {
      mockReq.params = { id: 'exp-1' };
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await updateSession(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return 404 if host does not own experience', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // Not found/owned

      await updateSession(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 400 if attempting to reduce capacity below current confirmed count', async () => {
      const mockSession = { id: 'exp-1', capacity: 10, booked: 6, primary_host_id: 'host-123' };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSession] }) // check ownership
        .mockResolvedValueOnce({ rows: [{ confirmed_count: 6 }] }); // confirmed count = 6

      mockReq.body = { capacity: 4 }; // Attempt to reduce capacity below 6

      await updateSession(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'CAPACITY_TOO_LOW',
          current_confirmed_count: 6,
        }),
      });
    });

    it('should trigger staff alert when cancelling session within 24 hours', async () => {
      const tomorrowStr = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0];
      const mockSession = {
        id: 'exp-1',
        capacity: 10,
        booked: 2,
        date: tomorrowStr,
        time: '12:00',
        plan_state: 'published',
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSession] }) // check ownership
        .mockResolvedValueOnce({ rows: [{ confirmed_count: 2 }] }) // confirmed count
        .mockResolvedValueOnce({ rows: [] }) // insert audit alert
        .mockResolvedValueOnce({ rows: [{ ...mockSession, plan_state: 'cancelled' }] }); // update res

      mockReq.body = { plan_state: 'cancelled' };

      await updateSession(mockReq as AuthRequest, mockRes as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_events'),
        expect.arrayContaining(['host-123', 'host', 'HOST_LATE_CANCELLATION_ALERT'])
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ plan_state: 'cancelled' }),
        staffAlertTriggered: true,
      });
    });

    it('should update session capacity successfully when valid', async () => {
      const mockSession = { id: 'exp-1', capacity: 10, booked: 3, date: '2027-06-01', time: '18:00', plan_state: 'published' };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSession] })
        .mockResolvedValueOnce({ rows: [{ confirmed_count: 3 }] })
        .mockResolvedValueOnce({ rows: [{ ...mockSession, capacity: 15 }] });

      mockReq.body = { capacity: 15 };

      await updateSession(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ capacity: 15 }),
        staffAlertTriggered: false,
      });
    });
  });

  describe('getPayouts', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await getPayouts(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should calculate historical payouts and pending revenue balance', async () => {
      const mockPayoutRow = {
        id: 'exp-1',
        title: 'Session 1',
        title_ar: 'الجلسة 1',
        date: '2027-04-01',
        booked: 5,
        gross_revenue: '500',
        platform_fee: '75',
        net_payout: '425',
        payout_date: '2027-04-02',
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockPayoutRow] }) // completed payouts
        .mockResolvedValueOnce({ rows: [{ gross_pending: '1000' }] }); // pending balance

      await getPayouts(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          pendingBalance: 850, // 1000 * 0.85
          totalPaidOut: 425,
          commissionPercentage: 15,
          payouts: [
            expect.objectContaining({
              id: 'exp-1',
              netPayout: 425,
              platformFee: 75,
              stripeTransferStatus: 'transferred',
            }),
          ],
        },
      });
    });
  });

  describe('getExperienceRoster & verifyPin', () => {
    it('should return roster for host', async () => {
      mockReq.params = { id: 'exp-1' };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] });
      (ReservationModel.findByExperience as jest.Mock).mockResolvedValueOnce([{ id: 'res-1' }]);

      await getExperienceRoster(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 'res-1' }],
      });
    });

    it('should verify PIN and check in attendee', async () => {
      mockReq.params = { id: 'exp-1' };
      mockReq.body = { pin: 'ABC123' };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] }) // check ownership
        .mockResolvedValueOnce({ rows: [{ id: 'res-1', state: 'confirmed' }] }); // reservation match

      (ReservationModel.updateState as jest.Mock).mockResolvedValueOnce({ id: 'res-1', state: 'checked_in' });

      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(ReservationModel.updateState).toHaveBeenCalledWith('res-1', 'checked_in');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 'res-1', state: 'checked_in' },
        message: 'Check-in successful',
      });
    });

    it('should sanitize wildcard characters in pin to prevent bypass', async () => {
      mockReq.params = { id: 'exp-1' };
      mockReq.body = { pin: '%_\\' };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'exp-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await verifyPin(mockReq as AuthRequest, mockRes as Response);

      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining('ILIKE'),
        ['exp-1', '\\%\\_\\\\%', '%_\\']
      );
    });
  });
});

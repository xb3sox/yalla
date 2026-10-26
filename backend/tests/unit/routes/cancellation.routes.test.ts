import request from 'supertest';
import express from 'express';
import reservationRoutes from '../../../src/routes/reservation.routes';
import cancellationService from '../../../src/services/cancellation.service';
import userModel from '../../../src/models/user.model';

jest.mock('../../../src/services/cancellation.service');
jest.mock('../../../src/models/user.model');

const app = express();
app.use(express.json());
app.use('/api/v1/reservations', reservationRoutes);

describe('Cancellation Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/reservations/:id/cancel', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 401 if user is unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/reservations/${validUuid}/cancel`)
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if reservation ID is not a valid UUID (Zod validation)', async () => {
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        phone: '+966500000000',
        role: 'participant',
      });

      const res = await request(app)
        .post('/api/v1/reservations/invalid-id/cancel')
        .set('Authorization', 'Bearer valid_token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 200 and cancel reservation on success', async () => {
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        phone: '+966500000000',
        role: 'participant',
      });

      (cancellationService.executeCancellation as jest.Mock).mockResolvedValue({
        reservation: { id: validUuid, state: 'refunded' },
        refund: { amount: 200, percentage: 100, tier: 'full' },
      });

      const res = await request(app)
        .post(`/api/v1/reservations/${validUuid}/cancel`)
        .set('Authorization', 'Bearer valid_token')
        .send({ reason: 'Schedule conflict' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reservation.state).toBe('refunded');
      expect(cancellationService.executeCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          reservationId: validUuid,
          actorId: 'user-123',
          actorRole: 'participant',
          canceledBy: 'participant',
          reason: 'Schedule conflict',
        })
      );
    });

    it('should allow staff to specify canceled_by parameter', async () => {
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'staff-123',
        phone: '+966500000001',
        role: 'staff',
      });

      (cancellationService.executeCancellation as jest.Mock).mockResolvedValue({
        reservation: { id: validUuid, state: 'refunded' },
        refund: { amount: 200, percentage: 100, tier: 'operational' },
      });

      const res = await request(app)
        .post(`/api/v1/reservations/${validUuid}/cancel`)
        .set('Authorization', 'Bearer valid_token')
        .send({ canceled_by: 'yalla', reason: 'Weather event' });

      expect(res.status).toBe(200);
      expect(cancellationService.executeCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          reservationId: validUuid,
          actorId: 'staff-123',
          actorRole: 'staff',
          canceledBy: 'yalla',
          reason: 'Weather event',
        })
      );
    });

    it('should return 404 when reservation is not found', async () => {
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        phone: '+966500000000',
        role: 'participant',
      });

      (cancellationService.executeCancellation as jest.Mock).mockRejectedValue(
        new Error('RESERVATION_NOT_FOUND')
      );

      const res = await request(app)
        .post(`/api/v1/reservations/${validUuid}/cancel`)
        .set('Authorization', 'Bearer valid_token')
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESERVATION_NOT_FOUND');
    });

    it('should return 403 when user does not own reservation', async () => {
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        phone: '+966500000000',
        role: 'participant',
      });

      (cancellationService.executeCancellation as jest.Mock).mockRejectedValue(
        new Error('FORBIDDEN')
      );

      const res = await request(app)
        .post(`/api/v1/reservations/${validUuid}/cancel`)
        .set('Authorization', 'Bearer valid_token')
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});

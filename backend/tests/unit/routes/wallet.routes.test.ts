import { getApplePass, getGooglePass, pushPassUpdate, getLatestPass } from '../../../src/controllers/wallet.controller';
import reservationModel from '../../../src/models/reservation.model';
import experienceModel from '../../../src/models/experience.model';

jest.mock('../../../src/models/reservation.model');
jest.mock('../../../src/models/experience.model');

describe('Wallet Routes & Controller Unit Tests', () => {
  let req: any;
  let res: any;

  const mockReservation = {
    id: 'res-101',
    participant_id: 'user-1',
    experience_id: 'exp-1',
    state: 'reconfirmed',
    pin: '123456',
  };

  const mockExperience = {
    id: 'exp-1',
    title: 'Secret Rooftop Dinner',
    area: 'Al Olaya',
    neighborhood: 'Al Olaya',
    city: 'Riyadh',
    venue_name: 'Al Olaya Secret Lounge',
    venue_address: 'Olaya Towers, Floor 25, Riyadh',
    date: '2028-10-10',
    time: '20:00',
    latitude: 24.7136,
    longitude: 46.6753,
  };

  beforeEach(() => {
    req = {
      params: { id: 'res-101' },
      headers: {},
      user: { userId: 'user-1', role: 'user' },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('GET /api/v1/reservations/:id/wallet/apple (getApplePass)', () => {
    it('returns 401 if request is unauthenticated', async () => {
      req.user = undefined;
      await getApplePass(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
        })
      );
    });

    it('returns 404 if reservation is not found', async () => {
      (reservationModel.findById as jest.Mock).mockResolvedValue(null);

      await getApplePass(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'RESERVATION_NOT_FOUND' }),
        })
      );
    });

    it('returns 403 if user is not the reservation owner or staff', async () => {
      (reservationModel.findById as jest.Mock).mockResolvedValue(mockReservation);
      req.user = { userId: 'different-user', role: 'user' };

      await getApplePass(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
    });

    it('generates and streams .pkpass binary buffer with proper headers for authorized owner', async () => {
      (reservationModel.findById as jest.Mock).mockResolvedValue(mockReservation);
      (experienceModel.findById as jest.Mock).mockResolvedValue(mockExperience);

      await getApplePass(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.apple.pkpass');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('yalla-pass-res-101.pkpass')
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });
  });

  describe('GET /api/v1/reservations/:id/wallet/google (getGooglePass)', () => {
    it('returns Google Wallet save URL JSON payload for valid reservation', async () => {
      (reservationModel.findById as jest.Mock).mockResolvedValue(mockReservation);
      (experienceModel.findById as jest.Mock).mockResolvedValue(mockExperience);

      await getGooglePass(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          saveUrl: expect.stringContaining('https://pay.google.com/gp/v/save/'),
          payload: expect.objectContaining({
            id: 'issuer.res_res-101',
          }),
        }),
      });
    });
  });

  describe('POST /api/v1/wallet/v1/push/:reservationId (pushPassUpdate)', () => {
    it('triggers pass push update for registered wallet clients', async () => {
      req.params = { reservationId: 'res-101' };
      (reservationModel.findById as jest.Mock).mockResolvedValue(mockReservation);
      (experienceModel.findById as jest.Mock).mockResolvedValue(mockExperience);

      await pushPassUpdate(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          reservationId: 'res-101',
        }),
      });
    });
  });

  describe('GET /api/v1/wallet/v1/passes/:passTypeIdentifier/:serialNumber (getLatestPass)', () => {
    it('returns 404 if reservation is not found', async () => {
      req.params = { serialNumber: 'res-unknown' };
      (reservationModel.findById as jest.Mock).mockResolvedValue(null);

      await getLatestPass(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns 401 when Authorization header is missing', async () => {
      req.params = { serialNumber: 'res-101' };
      req.headers = {};
      (reservationModel.findById as jest.Mock).mockResolvedValue(mockReservation);

      await getLatestPass(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns 401 when Authorization header token does not match', async () => {
      req.params = { serialNumber: 'res-101' };
      req.headers = { authorization: 'ApplePass wrong_token' };
      (reservationModel.findById as jest.Mock).mockResolvedValue(mockReservation);

      await getLatestPass(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns 200 with pass buffer when Authorization header has valid ApplePass token', async () => {
      req.params = { serialNumber: 'res-101' };
      req.headers = { authorization: 'ApplePass auth_token_secret' };
      (reservationModel.findById as jest.Mock).mockResolvedValue(mockReservation);
      (experienceModel.findById as jest.Mock).mockResolvedValue(mockExperience);

      await getLatestPass(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.apple.pkpass');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('yalla-pass-res-101.pkpass')
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });
  });
});

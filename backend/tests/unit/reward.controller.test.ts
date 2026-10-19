import { Request, Response, NextFunction } from 'express';
import rewardController from '../../src/controllers/reward.controller';
import rewardModel from '../../src/models/reward.model';

jest.mock('../../src/models/reward.model', () => ({
  getUserPoints: jest.fn(),
  getTransactions: jest.fn(),
  redeemPoints: jest.fn(),
}));

describe('RewardController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      user: { userId: 'user1', phone: '123', role: 'user' },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRewards', () => {
    it('should return balance and transactions', async () => {
      const mockTransactions = [{ id: '1', points: 100 }];
      (rewardModel.getUserPoints as jest.Mock).mockResolvedValue(150);
      (rewardModel.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);

      await rewardController.getRewards(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          balance: 150,
          transactions: mockTransactions,
        },
      });
    });

    it('should return 401 if user not authenticated', async () => {
      req.user = undefined;
      await rewardController.getRewards(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('redeemRewards', () => {
    it('should successfully redeem points', async () => {
      req.body = { points: 50, description: 'gift' };
      const mockTx = { id: 'tx1', points: -50 };
      (rewardModel.redeemPoints as jest.Mock).mockResolvedValue(mockTx);

      await rewardController.redeemRewards(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Points redeemed successfully',
        data: { transaction: mockTx },
      });
    });

    it('should return 400 for invalid points input', async () => {
      req.body = { points: 0 };
      await rewardController.redeemRewards(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);

      req.body = { points: -10 };
      await rewardController.redeemRewards(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);

      req.body = { points: '10' };
      await rewardController.redeemRewards(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if balance is insufficient', async () => {
      req.body = { points: 100 };
      (rewardModel.redeemPoints as jest.Mock).mockRejectedValue(new Error('Insufficient points balance'));

      await rewardController.redeemRewards(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient points balance' }
      });
    });
  });
});

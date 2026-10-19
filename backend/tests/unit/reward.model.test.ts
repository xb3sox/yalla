import rewardModel from '../../src/models/reward.model';
import pool from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

describe('RewardModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPoints', () => {
    it('should return 0 when no points are found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ total_points: '0' }] });
      const points = await rewardModel.getUserPoints('user1');
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COALESCE(SUM(points), 0) AS total_points FROM rewards_ledger WHERE user_id = $1',
        ['user1']
      );
      expect(points).toBe(0);
    });

    it('should return correct total points', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ total_points: '150' }] });
      const points = await rewardModel.getUserPoints('user1');
      expect(points).toBe(150);
    });
  });

  describe('addTransaction', () => {
    it('should insert a transaction', async () => {
      const mockTx = { id: 'tx1', user_id: 'user1', points: 100, type: 'earned', description: 'Test' };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTx] });
      
      const tx = await rewardModel.addTransaction('user1', 100, 'earned', 'Test');
      expect(tx).toEqual(mockTx);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rewards_ledger'),
        ['user1', 100, 'earned', 'Test']
      );
    });
  });

  describe('redeemPoints', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    });

    it('should throw error if points <= 0', async () => {
      await expect(rewardModel.redeemPoints('user1', 0, 'desc')).rejects.toThrow('Points to redeem must be greater than zero');
    });

    it('should throw error if balance is insufficient', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // SELECT ... FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ total_points: '50' }] }); // balance

      await expect(rewardModel.redeemPoints('user1', 100, 'desc')).rejects.toThrow('Insufficient points balance');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should redeem points and commit', async () => {
      const mockTx = { id: 'tx2', user_id: 'user1', points: -50, type: 'redeemed', description: 'desc' };
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // SELECT ... FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ total_points: '150' }] }) // balance
        .mockResolvedValueOnce({ rows: [mockTx] }) // insert
        .mockResolvedValueOnce({}); // COMMIT

      const tx = await rewardModel.redeemPoints('user1', 50, 'desc');
      expect(tx).toEqual(mockTx);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});

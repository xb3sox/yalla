import { blockUser } from '../../../src/controllers/blocks.controller';
import pool from '../../../src/config/database';
import { AuthRequest } from '../../../src/middleware/auth.middleware';
import { Response } from 'express';

jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Blocks Controller Unit Tests', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    mockReq = {
      user: {
        userId: 'usr_1',
        phone: '+966500000001',
        role: 'participant',
      },
      body: {},
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq.user = undefined;
    await blockUser(mockReq as AuthRequest, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORIZED' }) })
    );
  });

  it('should return 400 if blocked_user_id is missing', async () => {
    mockReq.body = { reason: 'spam' };
    await blockUser(mockReq as AuthRequest, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_INPUT' }) })
    );
  });

  it('should return 400 if user attempts to block themselves', async () => {
    mockReq.body = { blocked_user_id: 'usr_1', reason: 'spam' };
    await blockUser(mockReq as AuthRequest, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'CANNOT_BLOCK_SELF' }) })
    );
  });

  it('should successfully create block when valid', async () => {
    mockReq.body = { blocked_user_id: 'usr_2', reason: 'inappropriate', reason_ar: 'غير لائق' };
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // existing check
      .mockResolvedValueOnce({
        rows: [{ id: 'blk_1', blocker_id: 'usr_1', blocked_entity_id: 'usr_2' }],
      });

    await blockUser(mockReq as AuthRequest, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(201);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.anything() })
    );
  });
});

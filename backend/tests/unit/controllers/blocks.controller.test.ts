import { Response } from 'express';
import { blockUser } from '../../../src/controllers/blocks.controller';
import { AuthRequest } from '../../../src/middleware/auth.middleware';
import pool from '../../../src/config/database';

jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Blocks Controller - blockUser', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest = { user: undefined };

    await blockUser(mockRequest as AuthRequest, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
    });
  });

  it('should return 400 if blocked_user_id is missing', async () => {
    mockRequest = {
      user: { userId: 'user-1', phone: '123456', role: 'participant' },
      body: {},
    };

    await blockUser(mockRequest as AuthRequest, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({ code: 'MISSING_FIELDS', message: 'blocked_user_id is required' }),
    });
  });

  it('should return 400 if user attempts to block themselves', async () => {
    mockRequest = {
      user: { userId: 'user-1', phone: '123456', role: 'participant' },
      body: { blocked_user_id: 'user-1' },
    };

    await blockUser(mockRequest as AuthRequest, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({ code: 'CANNOT_BLOCK_SELF', message: 'Users cannot block themselves' }),
    });
  });

  it('should return 409 if user is already blocked', async () => {
    mockRequest = {
      user: { userId: 'user-1', phone: '123456', role: 'participant' },
      body: { blocked_user_id: 'user-2' },
    };

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 'block-1', blocker_id: 'user-1', blocked_entity_id: 'user-2' }],
    });

    await blockUser(mockRequest as AuthRequest, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({ code: 'ALREADY_BLOCKED' }),
    });
  });

  it('should create block and return 201 on success', async () => {
    mockRequest = {
      user: { userId: 'user-1', phone: '123456', role: 'participant' },
      body: { blocked_user_id: 'user-2', reason: 'Harassment' },
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // No existing block
      .mockResolvedValueOnce({
        rows: [{ id: 'block-1', blocker_id: 'user-1', blocked_entity_id: 'user-2', reason: 'Harassment' }],
      });

    await blockUser(mockRequest as AuthRequest, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        block: expect.objectContaining({ id: 'block-1', blocker_id: 'user-1', blocked_entity_id: 'user-2' }),
      },
    });
  });
});

import { Response } from 'express';
import { exportData, deleteAccount } from '../../../src/controllers/privacy.controller';
import privacyService from '../../../src/services/privacy.service';
import pool from '../../../src/config/database';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../../../src/middleware/auth.middleware';

jest.mock('../../../src/services/privacy.service', () => ({
  exportUserData: jest.fn(),
  anonymizeAndDeleteAccount: jest.fn(),
}));

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Privacy Routes / Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let clearCookieMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    clearCookieMock = jest.fn();
    setHeaderMock = jest.fn();

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      clearCookie: clearCookieMock,
      setHeader: setHeaderMock,
    };

    jest.clearAllMocks();
  });

  describe('exportData controller', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest = { user: undefined, query: {} };

      await exportData(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      });
    });

    it('should return 200 and personal export data on success', async () => {
      const mockExportData = {
        profile: { id: 'u-1', display_name: 'Test' },
        reservations: [],
        payments: [],
        feedback: [],
        rewards_ledger: [],
        audit_events: [],
        push_subscriptions: [],
        exported_at: '2026-10-26T00:00:00.000Z',
      };

      (privacyService.exportUserData as jest.Mock).mockResolvedValueOnce(mockExportData);

      mockRequest = {
        user: { userId: 'u-1', phone: '+966500000000', role: 'participant' },
        query: {},
      };

      await exportData(mockRequest as AuthRequest, mockResponse as Response);

      expect(privacyService.exportUserData).toHaveBeenCalledWith('u-1');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockExportData,
      });
    });
  });

  describe('deleteAccount controller', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest = { user: undefined, body: {} };

      await deleteAccount(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      });
    });

    it('should return 400 if confirmation is missing', async () => {
      mockRequest = {
        user: { userId: 'u-1', phone: '+966500000000', role: 'participant' },
        body: {},
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ password_hash: '$2a$10$hashed' }],
      });

      await deleteAccount(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'CONFIRMATION_REQUIRED' }),
      });
    });

    it('should return 400 if password does not match', async () => {
      mockRequest = {
        user: { userId: 'u-1', phone: '+966500000000', role: 'participant' },
        body: { password: 'wrong-password' },
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ password_hash: '$2a$10$hashed' }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await deleteAccount(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_CREDENTIALS' }),
      });
    });

    it('should anonymize user, clear cookies, and return success when password matches', async () => {
      mockRequest = {
        user: { userId: 'u-1', phone: '+966500000000', role: 'participant' },
        body: { password: 'valid-password' },
        ip: '10.0.0.1',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ password_hash: '$2a$10$hashed' }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (privacyService.anonymizeAndDeleteAccount as jest.Mock).mockResolvedValueOnce(undefined);

      await deleteAccount(mockRequest as AuthRequest, mockResponse as Response);

      expect(privacyService.anonymizeAndDeleteAccount).toHaveBeenCalledWith(
        'u-1',
        '10.0.0.1',
        'participant'
      );
      expect(clearCookieMock).toHaveBeenCalledWith('access_token', expect.anything());
      expect(clearCookieMock).toHaveBeenCalledWith('refresh_token', expect.anything());
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Account successfully deleted and anonymized',
      });
    });
  });
});

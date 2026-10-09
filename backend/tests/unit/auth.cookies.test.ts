import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth, AuthRequest } from '../../src/middleware/auth.middleware';
import userModel from '../../src/models/user.model';
import { logout } from '../../src/controllers/auth.controller';

jest.mock('../../src/models/user.model', () => ({
  __esModule: true,
  default: {
    verifyAccessToken: jest.fn(),
  },
}));

describe('Auth Cookie & Token Handling', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should authenticate via access_token cookie', async () => {
      req.cookies = { access_token: 'valid-cookie-token' };
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        phone: '+966501234567',
        role: 'participant',
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(userModel.verifyAccessToken).toHaveBeenCalledWith('valid-cookie-token');
      expect(req.user).toEqual({
        userId: 'user-123',
        phone: '+966501234567',
        role: 'participant',
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should authenticate via Bearer header fallback when cookie is absent', async () => {
      req.headers = { authorization: 'Bearer valid-header-token' };
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-456',
        phone: '+966509876543',
        role: 'host',
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(userModel.verifyAccessToken).toHaveBeenCalledWith('valid-header-token');
      expect(req.user?.userId).toBe('user-456');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should reject with 401 when neither cookie nor header is provided', async () => {
      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should attach user if access_token cookie is present', async () => {
      req.cookies = { access_token: 'optional-cookie-token' };
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'user-789',
        phone: '+966501112233',
        role: 'participant',
      });

      await optionalAuth(req as AuthRequest, res as Response, next);

      expect(req.user?.userId).toBe('user-789');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should proceed without user if no credentials provided', async () => {
      await optionalAuth(req as AuthRequest, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout controller', () => {
    it('should clear access_token and refresh_token cookies', async () => {
      await logout(req as Request, res as Response);

      expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.objectContaining({ httpOnly: true }));
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.objectContaining({ httpOnly: true }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
